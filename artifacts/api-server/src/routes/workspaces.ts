import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, workspacesTable, agentsTable, businessesTable, activityTable } from "@workspace/db";
import {
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
  GetWorkspaceParams,
  UpdateWorkspaceParams,
  DeleteWorkspaceParams,
  ListBusinessesParams,
  ListAgentsParams,
  GetDashboardSummaryParams,
  GetRecentActivityParams,
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

// List workspaces for current user
router.get("/workspaces", requireAuth, async (req: any, res): Promise<void> => {
  const workspaces = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerId, req.userId))
    .orderBy(workspacesTable.createdAt);
  res.json(workspaces);
});

// Create workspace
router.post("/workspaces", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [workspace] = await db
    .insert(workspacesTable)
    .values({ ...parsed.data, ownerId: req.userId })
    .returning();
  res.status(201).json(workspace);
});

// Get workspace
router.get("/workspaces/:workspaceId", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(and(eq(workspacesTable.id, params.data.workspaceId), eq(workspacesTable.ownerId, req.userId)));
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json(workspace);
});

// Update workspace
router.patch("/workspaces/:workspaceId", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [workspace] = await db
    .update(workspacesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(workspacesTable.id, params.data.workspaceId), eq(workspacesTable.ownerId, req.userId)))
    .returning();
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json(workspace);
});

// Delete workspace
router.delete("/workspaces/:workspaceId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(workspacesTable)
    .where(and(eq(workspacesTable.id, params.data.workspaceId), eq(workspacesTable.ownerId, req.userId)));
  res.sendStatus(204);
});

// List businesses in workspace
router.get("/workspaces/:workspaceId/businesses", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListBusinessesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const businesses = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.workspaceId, params.data.workspaceId))
    .orderBy(businessesTable.createdAt);
  res.json(businesses);
});

// List agents in workspace
router.get("/workspaces/:workspaceId/agents", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListAgentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const agents = await db
    .select()
    .from(agentsTable)
    .where(eq(agentsTable.workspaceId, params.data.workspaceId))
    .orderBy(agentsTable.createdAt);
  res.json(agents);
});

// Dashboard summary
router.get("/workspaces/:workspaceId/dashboard", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetDashboardSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { workspaceId } = params.data;

  const [agents, businesses] = await Promise.all([
    db.select().from(agentsTable).where(eq(agentsTable.workspaceId, workspaceId)),
    db.select().from(businessesTable).where(eq(businessesTable.workspaceId, workspaceId)),
  ]);

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const inactiveAgents = agents.filter((a) => a.status === "inactive").length;
  const totalBusinesses = businesses.length;

  // Group by status
  const statusMap: Record<string, number> = {};
  for (const agent of agents) {
    statusMap[agent.status] = (statusMap[agent.status] || 0) + 1;
  }
  const agentsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Group by provider
  const providerMap: Record<string, number> = {};
  for (const agent of agents) {
    providerMap[agent.provider] = (providerMap[agent.provider] || 0) + 1;
  }
  const agentsByProvider = Object.entries(providerMap).map(([provider, count]) => ({ provider, count }));

  res.json({ totalAgents, activeAgents, inactiveAgents, totalBusinesses, agentsByStatus, agentsByProvider });
});

// Recent activity
router.get("/workspaces/:workspaceId/activity", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetRecentActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const activity = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.workspaceId, params.data.workspaceId))
    .orderBy(activityTable.createdAt)
    .limit(20);
  res.json(activity);
});

export default router;
