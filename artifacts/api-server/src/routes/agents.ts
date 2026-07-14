import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, agentsTable, activityTable, apiKeysTable, aiBrainsTable, knowledgeItemsTable } from "@workspace/db";
import {
  CreateAgentBody,
  CreateAgentParams,
  GetAgentParams,
  UpdateAgentParams,
  UpdateAgentBody,
  DeleteAgentParams,
  ToggleAgentStatusParams,
  ChatWithAgentParams,
  ChatWithAgentBody,
} from "@workspace/api-zod";
import { getProvider } from "../lib/providers";

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

// Create agent in workspace
router.post("/workspaces/:workspaceId/agents", requireAuth, async (req: any, res): Promise<void> => {
  const routeParams = CreateAgentParams.safeParse(req.params);
  if (!routeParams.success) {
    res.status(400).json({ error: routeParams.error.message });
    return;
  }
  const parsed = CreateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [agent] = await db
    .insert(agentsTable)
    .values({ ...parsed.data, workspaceId: routeParams.data.workspaceId })
    .returning();

  // Log activity
  await db.insert(activityTable).values({
    workspaceId: routeParams.data.workspaceId,
    type: "agent_created",
    title: "Agent created",
    description: `${agent.name} (${agent.role}) was created`,
    entityId: agent.id,
  }).catch(() => {});

  res.status(201).json(agent);
});

// Get agent
router.get("/agents/:agentId", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [agent] = await db
    .select()
    .from(agentsTable)
    .where(eq(agentsTable.id, params.data.agentId));
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(agent);
});

// Update agent
router.patch("/agents/:agentId", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [agent] = await db
    .update(agentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(agentsTable.id, params.data.agentId))
    .returning();
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  // Log activity
  await db.insert(activityTable).values({
    workspaceId: agent.workspaceId,
    type: "agent_updated",
    title: "Agent updated",
    description: `${agent.name} was updated`,
    entityId: agent.id,
  }).catch(() => {});

  res.json(agent);
});

// Delete agent
router.delete("/agents/:agentId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(agentsTable).where(eq(agentsTable.id, params.data.agentId));
  res.sendStatus(204);
});

// Toggle agent status
router.patch("/agents/:agentId/toggle-status", requireAuth, async (req: any, res): Promise<void> => {
  const params = ToggleAgentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [current] = await db
    .select()
    .from(agentsTable)
    .where(eq(agentsTable.id, params.data.agentId));
  if (!current) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  const newStatus = current.status === "active" ? "inactive" : "active";
  const [agent] = await db
    .update(agentsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(agentsTable.id, params.data.agentId))
    .returning();

  // Log activity
  const activityType = newStatus === "active" ? "agent_activated" : "agent_deactivated";
  await db.insert(activityTable).values({
    workspaceId: agent.workspaceId,
    type: activityType,
    title: `Agent ${newStatus === "active" ? "activated" : "deactivated"}`,
    description: `${agent.name} is now ${newStatus}`,
    entityId: agent.id,
  }).catch(() => {});

  res.json(agent);
});

// Chat with agent (test endpoint)
router.post("/agents/:agentId/chat", requireAuth, async (req: any, res): Promise<void> => {
  const params = ChatWithAgentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = ChatWithAgentBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, params.data.agentId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  // Find API key for this agent's provider in the workspace
  const [keyRow] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.workspaceId, agent.workspaceId))
    .limit(1);

  if (!keyRow) {
    res.status(400).json({ error: `No API key found for workspace. Please add a ${agent.provider} key in Settings.` });
    return;
  }

  // Build system prompt from agent + brain (if linked)
  let systemPrompt = agent.instructions ?? "";
  if (agent.goal) systemPrompt = `Goal: ${agent.goal}\n\n${systemPrompt}`;

  // Optionally inject knowledge from linked brain
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

  const provider = getProvider(keyRow.provider, keyRow.encryptedKey);
  const messages = body.data.conversationHistory ?? [];
  messages.push({ role: "user", content: body.data.message });

  try {
    const result = await provider.chat(messages, {
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      systemPrompt: systemPrompt || undefined,
    });

    res.json({ reply: result.reply, provider: keyRow.provider, model: agent.model, tokensUsed: result.tokensUsed });
  } catch (err: any) {
    res.status(502).json({ error: `Provider error: ${err.message}` });
  }
});

export default router;
