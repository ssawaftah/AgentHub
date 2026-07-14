/**
 * Instagram Message Worker
 *
 * Polls the instagram_messages table every 5 seconds for unprocessed rows,
 * uses SELECT ... FOR UPDATE SKIP LOCKED so multiple server processes won't
 * double-process the same message, calls the configured AI agent, then sends
 * the reply via the Instagram Graph API.
 */
import { db, instagramAccountsTable, instagramMessagesTable, agentsTable, apiKeysTable, aiBrainsTable, knowledgeItemsTable } from "@workspace/db";
import { eq, isNull, sql } from "drizzle-orm";
import { getProvider } from "./providers";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 5_000;
const GRAPH_API_VERSION = "v19.0";

async function sendInstagramReply(
  accessToken: string,
  recipientIgUserId: string,
  text: string,
): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;
  const body = {
    recipient: { id: recipientIgUserId },
    message: { text },
    messaging_type: "RESPONSE",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram Graph API error ${res.status}: ${err}`);
  }
}

async function buildSystemPrompt(agent: typeof agentsTable.$inferSelect): Promise<string> {
  let systemPrompt = agent.instructions ?? "";
  if (agent.goal) systemPrompt = `Goal: ${agent.goal}\n\n${systemPrompt}`;

  const brain = await db
    .select()
    .from(aiBrainsTable)
    .where(eq(aiBrainsTable.agentId, agent.id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (brain) {
    if (brain.systemPrompt) systemPrompt = `${brain.systemPrompt}\n\n${systemPrompt}`;
    const items = await db
      .select()
      .from(knowledgeItemsTable)
      .where(eq(knowledgeItemsTable.brainId, brain.id))
      .limit(10);
    if (items.length > 0) {
      const knowledge = items.map((i) => `## ${i.title}\n${i.content}`).join("\n\n");
      systemPrompt = `${systemPrompt}\n\n--- Knowledge Base ---\n${knowledge}`;
    }
  }

  return systemPrompt;
}

async function processNextBatch(): Promise<void> {
  // Use FOR UPDATE SKIP LOCKED to safely handle concurrent workers
  const unprocessed = await db.execute(sql`
    SELECT im.id, im.instagram_account_id, im.from_ig_user_id, im.message_text, im.ig_message_id
    FROM instagram_messages im
    WHERE im.processed_at IS NULL
    LIMIT 5
    FOR UPDATE SKIP LOCKED
  `);

  if (!unprocessed.rows || unprocessed.rows.length === 0) return;

  for (const row of unprocessed.rows as any[]) {
    const msgId: number = row.id;
    const accountId: number = row.instagram_account_id;
    const fromIgUserId: string = row.from_ig_user_id;
    const messageText: string = row.message_text;

    try {
      // Load Instagram account + its assigned agent
      const [account] = await db
        .select()
        .from(instagramAccountsTable)
        .where(eq(instagramAccountsTable.id, accountId));

      if (!account || account.status !== "active") {
        await db
          .update(instagramMessagesTable)
          .set({ processedAt: new Date(), error: "Account not active" })
          .where(eq(instagramMessagesTable.id, msgId));
        continue;
      }

      if (!account.agentId) {
        await db
          .update(instagramMessagesTable)
          .set({ processedAt: new Date(), error: "No agent assigned to this Instagram account" })
          .where(eq(instagramMessagesTable.id, msgId));
        continue;
      }

      const [agent] = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.id, account.agentId));

      if (!agent || agent.status !== "active") {
        await db
          .update(instagramMessagesTable)
          .set({ processedAt: new Date(), error: "Agent not found or inactive" })
          .where(eq(instagramMessagesTable.id, msgId));
        continue;
      }

      // Find API key for the agent's provider
      const [keyRow] = await db
        .select()
        .from(apiKeysTable)
        .where(eq(apiKeysTable.workspaceId, agent.workspaceId))
        .limit(1);

      if (!keyRow) {
        await db
          .update(instagramMessagesTable)
          .set({ processedAt: new Date(), error: "No API key found for workspace" })
          .where(eq(instagramMessagesTable.id, msgId));
        continue;
      }

      const systemPrompt = await buildSystemPrompt(agent);
      const provider = getProvider(keyRow.provider, keyRow.encryptedKey);

      const result = await provider.chat(
        [{ role: "user", content: messageText }],
        {
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          systemPrompt: systemPrompt || undefined,
        },
      );

      await sendInstagramReply(account.accessToken, fromIgUserId, result.reply);

      await db
        .update(instagramMessagesTable)
        .set({ processedAt: new Date(), replySent: true })
        .where(eq(instagramMessagesTable.id, msgId));

      logger.info({ msgId, agentId: agent.id }, "Instagram message processed and reply sent");
    } catch (err: any) {
      logger.error({ msgId, err: err.message }, "Failed to process Instagram message");
      await db
        .update(instagramMessagesTable)
        .set({ processedAt: new Date(), error: err.message })
        .where(eq(instagramMessagesTable.id, msgId))
        .catch(() => {});
    }
  }
}

export function startInstagramWorker(): void {
  logger.info("Instagram worker started");
  setInterval(() => {
    processNextBatch().catch((err) =>
      logger.error({ err: err.message }, "Instagram worker poll error"),
    );
  }, POLL_INTERVAL_MS);
}
