---
name: AgentHub Workflow Port Config
description: Correct workflow commands for running AgentHub locally — both PORT and BASE_PATH are required
---

## Required env vars per service

| Service | Workflow name | Command |
|---------|--------------|---------|
| API server | `artifacts/api-server: API Server` | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| Frontend | `artifacts/agent-hub: web` | `PORT=18509 BASE_PATH=/ pnpm --filter @workspace/agent-hub run dev` |

**Why:** Both `PORT` and `BASE_PATH` are validated at startup (not just used) — missing either throws immediately.
Artifact-managed workflows inject these automatically, but when configured manually via `configureWorkflow`, they must be set explicitly in the command.

**How to apply:** Always use these exact commands when restarting workflows. If PORT-not-found or BASE_PATH-not-found errors appear in logs, the command is missing an env var.
