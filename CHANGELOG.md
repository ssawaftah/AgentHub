# Changelog

## [0.1.0] — 2026-07-14

### Added
- AgentHub AI project initialized
- Clerk authentication integration (Replit-managed)
- PostgreSQL database with Drizzle ORM (workspaces, businesses, agents, activity tables)
- OpenAPI 3.1 specification for Phase 1 API surface
- React Query hooks and Zod schemas via Orval codegen
- REST API endpoints:
  - `GET/POST /api/workspaces` — workspace management
  - `GET/PATCH/DELETE /api/workspaces/:id`
  - `GET/POST /api/workspaces/:id/businesses`
  - `GET/PATCH/DELETE /api/businesses/:id`
  - `GET/POST /api/workspaces/:id/agents`
  - `GET/PATCH/DELETE /api/agents/:id`
  - `PATCH /api/agents/:id/toggle-status`
  - `GET /api/workspaces/:id/dashboard`
  - `GET /api/workspaces/:id/activity`
- Clerk proxy middleware on Express API server
- Activity logging for agent/business lifecycle events
- Frontend React/Vite app (AgentHub AI) scaffolded with Tailwind v4 + shadcn/ui
- Project tracking system (PROJECT_STATUS, PROJECT_TODO, PROJECT_PROGRESS, CHANGELOG, DECISIONS)
