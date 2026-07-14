import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, apiKeysTable, workspacesTable } from "@workspace/db";
import {
  ListApiKeysParams,
  CreateApiKeyParams,
  CreateApiKeyBody,
  DeleteApiKeyParams,
  TestApiKeyParams,
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

/** Verify the workspace belongs to this user */
async function ownedWorkspace(workspaceId: number, userId: string) {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(and(eq(workspacesTable.id, workspaceId), eq(workspacesTable.ownerId, userId)));
  return ws;
}

// List API keys (masked — never return encryptedKey)
router.get(
  "/workspaces/:workspaceId/api-keys",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = ListApiKeysParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) { res.status(404).json({ error: "Workspace not found" }); return; }

    const keys = await db
      .select({
        id: apiKeysTable.id,
        workspaceId: apiKeysTable.workspaceId,
        provider: apiKeysTable.provider,
        label: apiKeysTable.label,
        keyPreview: apiKeysTable.keyPreview,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.workspaceId, params.data.workspaceId))
      .orderBy(apiKeysTable.createdAt);

    res.json(keys);
  },
);

// Add API key
router.post(
  "/workspaces/:workspaceId/api-keys",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = CreateApiKeyParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const body = CreateApiKeyBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    const ws = await ownedWorkspace(params.data.workspaceId, req.userId);
    if (!ws) { res.status(404).json({ error: "Workspace not found" }); return; }

    const { provider, label, key } = body.data;
    const keyPreview = `****${key.slice(-4)}`;

    const [apiKey] = await db
      .insert(apiKeysTable)
      .values({
        workspaceId: params.data.workspaceId,
        provider,
        label,
        encryptedKey: key, // TODO: encrypt at rest in production
        keyPreview,
      })
      .returning({
        id: apiKeysTable.id,
        workspaceId: apiKeysTable.workspaceId,
        provider: apiKeysTable.provider,
        label: apiKeysTable.label,
        keyPreview: apiKeysTable.keyPreview,
        createdAt: apiKeysTable.createdAt,
      });

    res.status(201).json(apiKey);
  },
);

// Delete API key
router.delete(
  "/api-keys/:keyId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = DeleteApiKeyParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    await db
      .delete(apiKeysTable)
      .where(eq(apiKeysTable.id, params.data.keyId));

    res.sendStatus(204);
  },
);

// Test API key
router.post(
  "/api-keys/:keyId/test",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = TestApiKeyParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const [keyRow] = await db
      .select()
      .from(apiKeysTable)
      .where(eq(apiKeysTable.id, params.data.keyId));

    if (!keyRow) { res.status(404).json({ error: "API key not found" }); return; }

    const provider = getProvider(keyRow.provider, keyRow.encryptedKey);
    const result = await provider.testKey();

    res.json(result);
  },
);

export default router;
