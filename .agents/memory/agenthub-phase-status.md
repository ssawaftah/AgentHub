---
name: AgentHub Phase Status
description: Which phases are done and what's next for the AgentHub AI project
---

## Phase 1 — Foundation ✅ Complete
Full monorepo, Clerk auth, PostgreSQL/Drizzle, Express 5 API, React/Vite frontend.
Workspaces, businesses, agents, activity logging all working.

## Phase 2 — AI Engine ✅ Complete
- api_keys, ai_brains, knowledge_items DB tables
- Provider abstraction layer: Gemini, DeepSeek, OpenAI, Claude
- API routes: api-keys CRUD+test, brains CRUD, knowledge CRUD, agent chat
- Frontend: Settings (API keys), AI Brains, Brain Detail, Agent Chat Tester tab

## Phase 3 — Instagram Integration ✅ Built (2026-07-14)

**What was built:**
- DB tables: `instagram_accounts`, `instagram_messages` (pushed to DB)
- Backend routes (`artifacts/api-server/src/routes/instagram.ts`):
  - `GET /api/workspaces/:workspaceId/instagram` — get connected account
  - `POST /api/workspaces/:workspaceId/instagram/connect` — save/upsert account
  - `PATCH /api/workspaces/:workspaceId/instagram/agent` — assign DM agent
  - `DELETE /api/workspaces/:workspaceId/instagram/disconnect` — disconnect
  - `GET /api/workspaces/:workspaceId/instagram/agents` — list assignable agents
- Webhook routes (`webhookRouter`, mounted at app root NOT /api):
  - `GET /webhook/instagram` — Meta verify_token challenge (matches per-account token from DB)
  - `POST /webhook/instagram` — receives DM events, deduplicates via igMessageId UNIQUE, inserts into queue
- Background worker (`artifacts/api-server/src/lib/instagram-worker.ts`):
  - Polls every 5s using `SELECT ... FOR UPDATE SKIP LOCKED`
  - Builds AI context (agent + brain + knowledge), calls provider, sends reply via Graph API
  - No Cloudflare — pure PostgreSQL-backed queue
- OpenAPI spec updated, codegen re-run
- Frontend: `InstagramPage.tsx` at `/instagram`, added to sidebar + App.tsx routes

**Key constraint:** User said NO Cloudflare services. Queue is DB-backed.

**Workflows:**
- API server: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- Frontend: `PORT=18509 BASE_PATH=/ pnpm --filter @workspace/agent-hub run dev`

## Phase 4 — Analytics & Polish (not started)
Token usage tracking, analytics dashboard, agent skills system, prompt templates.
