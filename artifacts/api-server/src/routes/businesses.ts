import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, businessesTable, workspacesTable, activityTable } from "@workspace/db";
import {
  CreateBusinessBody,
  CreateBusinessParams,
  GetBusinessParams,
  UpdateBusinessParams,
  UpdateBusinessBody,
  DeleteBusinessParams,
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

// Create business in workspace
router.post("/workspaces/:workspaceId/businesses", requireAuth, async (req: any, res): Promise<void> => {
  const routeParams = CreateBusinessParams.safeParse(req.params);
  if (!routeParams.success) {
    res.status(400).json({ error: routeParams.error.message });
    return;
  }
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .insert(businessesTable)
    .values({ ...parsed.data, workspaceId: routeParams.data.workspaceId })
    .returning();

  // Log activity
  await db.insert(activityTable).values({
    workspaceId: routeParams.data.workspaceId,
    type: "business_created",
    title: "Business created",
    description: `${business.name} was added`,
    entityId: business.id,
  }).catch(() => {});

  res.status(201).json(business);
});

// Get business
router.get("/businesses/:businessId", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, params.data.businessId));
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

// Update business
router.patch("/businesses/:businessId", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .update(businessesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(businessesTable.id, params.data.businessId))
    .returning();
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

// Delete business
router.delete("/businesses/:businessId", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(businessesTable).where(eq(businessesTable.id, params.data.businessId));
  res.sendStatus(204);
});

export default router;
