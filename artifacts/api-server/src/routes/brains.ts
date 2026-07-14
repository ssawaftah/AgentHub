import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  aiBrainsTable,
  knowledgeItemsTable,
  agentsTable,
  activityTable,
  workspacesTable,
} from "@workspace/db";
import {
  ListBrainsParams,
  CreateBrainParams,
  CreateBrainBody,
  GetBrainParams,
  UpdateBrainParams,
  UpdateBrainBody,
  DeleteBrainParams,
  ListKnowledgeItemsParams,
  CreateKnowledgeItemParams,
  CreateKnowledgeItemBody,
  DeleteKnowledgeItemParams,
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

// List brains in workspace
router.get(
  "/workspaces/:workspaceId/brains",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = ListBrainsParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const brains = await db
      .select()
      .from(aiBrainsTable)
      .where(eq(aiBrainsTable.workspaceId, params.data.workspaceId))
      .orderBy(aiBrainsTable.createdAt);

    res.json(brains);
  },
);

// Create brain
router.post(
  "/workspaces/:workspaceId/brains",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = CreateBrainParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const body = CreateBrainBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    const [brain] = await db
      .insert(aiBrainsTable)
      .values({ ...body.data, workspaceId: params.data.workspaceId })
      .returning();

    await db.insert(activityTable).values({
      workspaceId: params.data.workspaceId,
      type: "brain_created",
      title: "Brain created",
      description: `AI Brain "${brain.name}" was created`,
      entityId: brain.id,
    }).catch(() => {});

    res.status(201).json(brain);
  },
);

// Get brain
router.get(
  "/brains/:brainId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = GetBrainParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const [brain] = await db
      .select()
      .from(aiBrainsTable)
      .where(eq(aiBrainsTable.id, params.data.brainId));

    if (!brain) { res.status(404).json({ error: "Brain not found" }); return; }

    res.json(brain);
  },
);

// Update brain
router.patch(
  "/brains/:brainId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = UpdateBrainParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const body = UpdateBrainBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    const [brain] = await db
      .update(aiBrainsTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(aiBrainsTable.id, params.data.brainId))
      .returning();

    if (!brain) { res.status(404).json({ error: "Brain not found" }); return; }

    res.json(brain);
  },
);

// Delete brain
router.delete(
  "/brains/:brainId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = DeleteBrainParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    await db.delete(aiBrainsTable).where(eq(aiBrainsTable.id, params.data.brainId));

    res.sendStatus(204);
  },
);

// List knowledge items for a brain
router.get(
  "/brains/:brainId/knowledge",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = ListKnowledgeItemsParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const items = await db
      .select()
      .from(knowledgeItemsTable)
      .where(eq(knowledgeItemsTable.brainId, params.data.brainId))
      .orderBy(knowledgeItemsTable.createdAt);

    res.json(items);
  },
);

// Add knowledge item to brain
router.post(
  "/brains/:brainId/knowledge",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = CreateKnowledgeItemParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const body = CreateKnowledgeItemBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    // Get the brain to extract workspaceId
    const [brain] = await db
      .select()
      .from(aiBrainsTable)
      .where(eq(aiBrainsTable.id, params.data.brainId));

    if (!brain) { res.status(404).json({ error: "Brain not found" }); return; }

    const [item] = await db
      .insert(knowledgeItemsTable)
      .values({ ...body.data, brainId: params.data.brainId, workspaceId: brain.workspaceId })
      .returning();

    res.status(201).json(item);
  },
);

// Delete knowledge item
router.delete(
  "/knowledge/:itemId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = DeleteKnowledgeItemParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    await db
      .delete(knowledgeItemsTable)
      .where(eq(knowledgeItemsTable.id, params.data.itemId));

    res.sendStatus(204);
  },
);

export default router;
