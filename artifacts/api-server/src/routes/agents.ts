import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, agentsTable, activityTable } from "@workspace/db";
import {
  CreateAgentBody,
  CreateAgentParams,
  GetAgentParams,
  UpdateAgentParams,
  UpdateAgentBody,
  DeleteAgentParams,
  ToggleAgentStatusParams,
} from "@workspace/api-zod";

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

export default router;
