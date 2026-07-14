import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  instagramAccountsTable,
  workspacesTable,
  instagramMessagesTable,
  agentsTable,
} from "@workspace/db";
import { z } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

async function ownedWorkspace(workspaceId: number, userId: string) {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(
      and(
        eq(workspacesTable.id, workspaceId),
        eq(workspacesTable.ownerId, userId),
      ),
    );
  return ws;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const WorkspaceIdParam = z.object({
  workspaceId: z.coerce.number().int().positive(),
});

const ConnectInstagramBody = z.object({
  igUserId: z.string().min(1),
  igUsername: z.string().min(1),
  igProfilePicUrl: z.string().url().optional(),
  accessToken: z.string().min(1),
  webhookVerifyToken: z.string().min(8),
});

const AssignAgentBody = z.object({
  agentId: z.number().int().positive().nullable(),
});

// ─── GET /workspaces/:workspaceId/instagram ───────────────────────────────────
// Returns the connected Instagram account for this workspace (or 404)
router.get(
  "/workspaces/:workspaceId/instagram",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = WorkspaceIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    const [account] = await db
      .select()
      .from(instagramAccountsTable)
      .where(eq(instagramAccountsTable.workspaceId, params.data.workspaceId));

    if (!account) {
      res.status(404).json({ error: "No Instagram account connected" });
      return;
    }
    // Never return the raw access token to the client
    const { accessToken: _omit, ...safe } = account;
    res.json(safe);
  },
);

// ─── POST /workspaces/:workspaceId/instagram/connect ─────────────────────────
// Save an Instagram Page Access Token for this workspace
router.post(
  "/workspaces/:workspaceId/instagram/connect",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = WorkspaceIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = ConnectInstagramBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    // Upsert — one account per workspace
    const existing = await db
      .select()
      .from(instagramAccountsTable)
      .where(eq(instagramAccountsTable.workspaceId, params.data.workspaceId))
      .then((r) => r[0] ?? null);

    if (existing) {
      const [updated] = await db
        .update(instagramAccountsTable)
        .set({
          igUserId: body.data.igUserId,
          igUsername: body.data.igUsername,
          igProfilePicUrl: body.data.igProfilePicUrl ?? null,
          accessToken: body.data.accessToken,
          webhookVerifyToken: body.data.webhookVerifyToken,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(instagramAccountsTable.id, existing.id))
        .returning();
      const { accessToken: _omit, ...safe } = updated;
      res.json(safe);
      return;
    }

    const [account] = await db
      .insert(instagramAccountsTable)
      .values({
        workspaceId: params.data.workspaceId,
        igUserId: body.data.igUserId,
        igUsername: body.data.igUsername,
        igProfilePicUrl: body.data.igProfilePicUrl ?? null,
        accessToken: body.data.accessToken,
        webhookVerifyToken: body.data.webhookVerifyToken,
        status: "active",
      })
      .returning();
    const { accessToken: _omit2, ...safe } = account;
    res.status(201).json(safe);
  },
);

// ─── PATCH /workspaces/:workspaceId/instagram/agent ──────────────────────────
// Assign (or clear) the AI agent that handles DMs for this account
router.patch(
  "/workspaces/:workspaceId/instagram/agent",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = WorkspaceIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = AssignAgentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    const [account] = await db
      .select()
      .from(instagramAccountsTable)
      .where(eq(instagramAccountsTable.workspaceId, params.data.workspaceId));
    if (!account) {
      res.status(404).json({ error: "No Instagram account connected" });
      return;
    }
    const [updated] = await db
      .update(instagramAccountsTable)
      .set({ agentId: body.data.agentId, updatedAt: new Date() })
      .where(eq(instagramAccountsTable.id, account.id))
      .returning();
    const { accessToken: _omit, ...safe } = updated;
    res.json(safe);
  },
);

// ─── DELETE /workspaces/:workspaceId/instagram/disconnect ────────────────────
router.delete(
  "/workspaces/:workspaceId/instagram/disconnect",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = WorkspaceIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    await db
      .delete(instagramAccountsTable)
      .where(eq(instagramAccountsTable.workspaceId, params.data.workspaceId));
    res.sendStatus(204);
  },
);

// ─── GET /workspaces/:workspaceId/instagram/agents ───────────────────────────
// List agents available to assign for DM handling
router.get(
  "/workspaces/:workspaceId/instagram/agents",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = WorkspaceIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    const agents = await db
      .select({ id: agentsTable.id, name: agentsTable.name, role: agentsTable.role, status: agentsTable.status })
      .from(agentsTable)
      .where(eq(agentsTable.workspaceId, params.data.workspaceId));
    res.json(agents);
  },
);

// ─── Webhook routes (exported separately, mounted on app root) ───────────────
// These are NOT under /api — Meta requires a stable public URL like /webhook/instagram

export const webhookRouter: IRouter = Router();

// GET /webhook/instagram — Meta webhook verification
webhookRouter.get("/webhook/instagram", (req: any, res: any): void => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe") {
    res.sendStatus(400);
    return;
  }

  // Accept if verify token matches any registered account
  db.select()
    .from(instagramAccountsTable)
    .where(eq(instagramAccountsTable.webhookVerifyToken, token as string))
    .then(([account]) => {
      if (!account) {
        logger.warn({ token }, "Webhook verify token not found");
        res.sendStatus(403);
        return;
      }
      logger.info({ accountId: account.id }, "Instagram webhook verified");
      res.send(challenge);
    })
    .catch((err) => {
      logger.error({ err: err.message }, "Webhook verify DB error");
      res.sendStatus(500);
    });
});

// POST /webhook/instagram — Receive DM events from Meta
webhookRouter.post("/webhook/instagram", async (req: any, res: any): Promise<void> => {
  // Always ack immediately — Meta retries if you don't respond within 5s
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body?.object !== "instagram") return;

    const entries: any[] = body.entry ?? [];
    for (const entry of entries) {
      const messaging: any[] = entry.messaging ?? [];
      const recipientIgId: string = entry.id; // the Instagram account that received the message

      // Find the account record by its IG user ID
      const [account] = await db
        .select()
        .from(instagramAccountsTable)
        .where(eq(instagramAccountsTable.igUserId, recipientIgId));

      if (!account) {
        logger.warn({ recipientIgId }, "No account found for incoming Instagram message");
        continue;
      }

      for (const event of messaging) {
        if (!event.message || event.message.is_echo) continue; // skip echoes (our own sends)

        const igMessageId: string = event.message.mid;
        const fromIgUserId: string = event.sender.id;
        const text: string = event.message.text ?? "";
        if (!text) continue; // skip non-text messages (stickers, reactions, etc.)

        // Insert with ON CONFLICT DO NOTHING for idempotency
        await db
          .insert(instagramMessagesTable)
          .values({
            instagramAccountId: account.id,
            igMessageId,
            fromIgUserId,
            messageText: text,
          })
          .onConflictDoNothing()
          .catch((err) =>
            logger.error({ err: err.message }, "Failed to insert instagram message"),
          );
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Instagram webhook processing error");
  }
});

export default router;
