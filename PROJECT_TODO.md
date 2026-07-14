# AgentHub AI — Todo

## Phase 1: Foundation & Core Platform

| ID | Priority | Feature | Description | Status | Dependencies |
|----|----------|---------|-------------|--------|-------------|
| TASK-001 | HIGH | Project Setup | Monorepo, Clerk auth, DB, OpenAPI | ✅ Done | — |
| TASK-002 | HIGH | Database Schema | workspaces, businesses, agents, activity tables | ✅ Done | TASK-001 |
| TASK-003 | HIGH | API Routes | CRUD for workspaces, businesses, agents | ✅ Done | TASK-002 |
| TASK-004 | HIGH | Frontend UI | Dashboard, agents, businesses pages with Clerk auth | 🟡 In Progress | TASK-003 |
| TASK-005 | MEDIUM | Seed Data | Example workspace/business/agent for new users | ⬜ Pending | TASK-003 |

## Phase 2: AI Engine

| ID | Priority | Feature | Description | Status | Dependencies |
|----|----------|---------|-------------|--------|-------------|
| TASK-010 | HIGH | AI Provider Abstraction | Provider interface for DeepSeek, Gemini | ⬜ Pending | TASK-001 |
| TASK-011 | HIGH | API Key Management | Store/manage multiple API keys per provider | ⬜ Pending | TASK-010 |
| TASK-012 | HIGH | AI Router | Round-robin, priority, fallback, retry | ⬜ Pending | TASK-011 |
| TASK-013 | HIGH | AI Brain entity | Brain model linking agents to knowledge | ⬜ Pending | TASK-004 |
| TASK-014 | HIGH | Knowledge Base uploads | PDF, TXT, DOCX, CSV, URL ingestion | ⬜ Pending | TASK-013 |
| TASK-015 | HIGH | Embeddings + Vector Search | RAG architecture for semantic search | ⬜ Pending | TASK-014 |
| TASK-016 | MEDIUM | Prompt Builder | Dynamic prompt construction system | ⬜ Pending | TASK-015 |

## Phase 3: Instagram Integration

| ID | Priority | Feature | Description | Status | Dependencies |
|----|----------|---------|-------------|--------|-------------|
| TASK-020 | HIGH | Instagram Webhook | Verify + receive Instagram DM webhooks | ⬜ Pending | Meta Developer Setup |
| TASK-021 | HIGH | Message Processing | Queue, dedup, route messages to AI | ⬜ Pending | TASK-020 |
| TASK-022 | HIGH | Auto-Reply | Generate + send replies via Instagram API | ⬜ Pending | TASK-021, TASK-016 |
| TASK-023 | MEDIUM | Customer Memory | Store customer profiles, conversation summaries | ⬜ Pending | TASK-022 |

## Phase 4: Analytics & Polish

| ID | Priority | Feature | Description | Status | Dependencies |
|----|----------|---------|-------------|--------|-------------|
| TASK-030 | MEDIUM | Analytics Dashboard | Messages, response time, token usage, costs | ⬜ Pending | TASK-022 |
| TASK-031 | MEDIUM | Agent Skills system | Enable/disable skills per agent | ⬜ Pending | TASK-013 |
| TASK-032 | LOW | Workflow Engine | Visual workflow builder | ⬜ Pending | TASK-031 |
| TASK-033 | LOW | Multi-channel | WhatsApp, Messenger, Telegram | ⬜ Pending | TASK-022 |
