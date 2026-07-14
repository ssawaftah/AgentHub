# Architecture Decisions

## AD-005: Phase-by-Phase Development

**Decision:** Build in strict phases. Never build AI features before the core platform is solid.
**Reason:** The spec explicitly requires milestone-based development.
**Impact:** Phase 2 (AI engine) starts only after Phase 1 is complete and tested.

## AD-006: API Key Storage Strategy

**Decision:** Store API keys in plaintext in DB for development. Add encryption layer before production.
**Reason:** Implementing AES-256 encryption adds complexity. The DB is already behind auth + network isolation. For dev speed, plaintext is acceptable with a clear TODO.
**How to apply:** Before deploying to production, wrap `encryptedKey` with AES-256-GCM using a `KEY_ENCRYPTION_SECRET` environment variable. The column name stays the same.
**Note:** Keys are NEVER returned via API — only `keyPreview` (last 4 chars) is exposed.

## AD-007: Provider Abstraction Pattern

**Decision:** Use a simple class-based provider pattern with a factory function, not a plugin registry.
**Reason:** Only 4 providers (Gemini, DeepSeek, OpenAI, Claude) are needed for Phase 2. A factory function (`getProvider(provider, apiKey)`) is simpler and type-safe without over-engineering.
**How to apply:** Add new providers by creating a new class implementing `IProvider` and adding it to the factory switch in `lib/providers/index.ts`.

## AD-008: Knowledge Base Context Injection

**Decision:** Inject knowledge items as plain text in the system prompt (not vector search / RAG).
**Reason:** Phase 2 needs a working knowledge base quickly. Vector embeddings and RAG are Phase 3 optimizations. Injecting the top 10 knowledge items as text works for small knowledge bases (<50 items).
**How to apply:** When scaling to larger knowledge bases, replace the top-10 select with a vector similarity search.

## AD-009: Multi-tenant API Key Selection

**Decision:** When chatting, select the first available API key from the workspace (not provider-matched).
**Reason:** Early implementation simplicity. Most workspaces will start with one key.
**How to apply:** In a future iteration, filter `apiKeysTable` by `provider = agent.provider` to use the exact provider's key. The column and query are already structured for this.

---

## AD-001: Infrastructure Adaptation (Replit vs Cloudflare)

**Decision:** Use Express + PostgreSQL on Replit instead of Cloudflare Workers + D1.
**Why:** Replit's environment provides pre-configured PostgreSQL and Express. Drizzle ORM syntax is identical for D1 and PostgreSQL, so migration is clean.

## AD-002: Clerk for Authentication

**Decision:** Use Replit-managed Clerk. All protected routes use `getAuth(req)`. Frontend uses session cookies — no manual token handling.

## AD-003: Multi-tenant via ownerId on Workspaces

**Decision:** Workspaces owned by Clerk userId. All data workspace-scoped via FK cascade.

## AD-004: Activity Log Table

**Decision:** Simple activity table instead of event sourcing. Failures silently ignored (`.catch(() => {})`) to avoid failing main mutations.
