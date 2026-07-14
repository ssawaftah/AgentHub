# Architecture Decisions

## AD-001: Infrastructure Adaptation (Replit vs Cloudflare)

**Decision:** Use Express + PostgreSQL on Replit instead of Cloudflare Workers + D1
**Reason:** Replit's environment provides pre-configured PostgreSQL and Express, which is where this project is hosted. Cloudflare Workers is the target deployment stack but not available in the development environment.
**Impact:** Drizzle ORM syntax is identical for D1 and PostgreSQL, so the migration path is clean. Express routing patterns are equivalent to Hono (Cloudflare's preferred framework).

## AD-002: Clerk for Authentication

**Decision:** Use Replit-managed Clerk for authentication instead of custom JWT
**Reason:** The spec calls for JWT authentication. Clerk provides JWT-based sessions with cookie transport on web, is fully managed (no user DB to maintain), and supports multiple OAuth providers out of the box.
**Impact:** All protected routes use `getAuth(req)` from `@clerk/express`. Frontend uses session cookies — no manual token handling.

## AD-003: Multi-tenant via ownerId on Workspaces

**Decision:** Workspaces are owned by Clerk userId. All data is workspace-scoped.
**Reason:** Simple, performant tenant isolation. Each workspace is isolated via `workspace_id` foreign keys. Users can own multiple workspaces.
**Impact:** Every API route filters by ownerId on workspace queries. Downstream entities (businesses, agents) are cascade-deleted when workspace is deleted.

## AD-004: Activity Log Table

**Decision:** Use a simple activity table instead of an event sourcing system
**Reason:** Phase 1 needs basic activity feed. A full event sourcing system adds complexity without immediate value.
**Impact:** Activity entries are written as a side effect of mutations. Failures are silently ignored (`.catch(() => {})`) to avoid failing the main mutation.

## AD-005: Phase-by-Phase Development

**Decision:** Build in strict phases. Never build AI features before the core platform is solid.
**Reason:** The spec explicitly requires milestone-based development. The core platform (auth, workspaces, businesses, agents) must be production-ready before the AI engine is built.
**Impact:** Phase 2 (AI engine) starts only after Phase 1 UI and APIs are complete and tested.
