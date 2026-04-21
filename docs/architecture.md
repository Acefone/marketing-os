# Marketing Agent OS — Architecture Reference

**Product:** Acefone Marketing Agent OS  
**Version:** 2.0 (TypeScript Monorepo)  
**Maintained by:** AI Marketer + BE Developer

> For local dev setup → [setup.md](setup.md)  
> For server deployment → [server.md](server.md)  
> For agent details → [agents-guide.md](agents-guide.md)  
> For knowledge base → [knowledge-base-guide.md](knowledge-base-guide.md)

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Data Flow](#5-data-flow)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [Agent System](#7-agent-system)
8. [Knowledge Base System](#8-knowledge-base-system)
9. [Job Queue & Scheduling](#9-job-queue--scheduling)
10. [Database Schema](#10-database-schema)

---

## 1. What This System Does

Marketing Agent OS is an internal, self-hosted multi-agent AI platform for Acefone's marketing team. It runs 9 specialised AI agents (powered by Anthropic Claude) that produce marketing content, SEO analysis, ad copy, strategy decks, and more. All outputs are saved to a PostgreSQL database and optionally mirrored to a Notion workspace.

**Key capabilities:**
- Manual agent triggering via a web UI (role-gated)
- Scheduled agent runs (6 recurring jobs — weekly SEO reports, daily social posts, etc.)
- Shared knowledge base (12 markdown modules injected into every agent call)
- Full output history queryable from the UI (no Notion dependency for read)
- Role-based access: admins, editors, and viewers

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js v20 LTS | Server runtime |
| **Language** | TypeScript 5 | Type safety across backend + frontend |
| **Web framework** | Express.js | REST API server |
| **Frontend** | React 18 + Vite | Admin dashboard SPA |
| **UI components** | Tailwind CSS + shadcn/ui primitives | Styling |
| **State management** | Zustand | Frontend store (auth + agent run state) |
| **Primary database** | PostgreSQL 16 + pgvector | Canonical output store, users, job audit log |
| **Cache / queue** | Redis 7 | Bull job queue backing store |
| **Job queue** | Bull | Scheduled + manual agent job runner |
| **LLM API** | Anthropic Claude API | AI inference (Sonnet 4.6 + Haiku 4.5) |
| **Secondary output** | Notion API | Optional: mirrors outputs to team pages |
| **Auth** | Custom JWT + bcrypt | RBAC — no third-party auth provider |
| **Logging** | Pino + pino-http | Structured JSON logs |
| **Testing** | Vitest + Supertest | Unit + integration tests |
| **Containers** | Docker + Docker Compose | Infra portability |
| **CI** | GitHub Actions | Lint, typecheck, test on every PR |

**Deliberately excluded:** Temporal, Kafka, ELK, Jaeger, Keycloak, Kong, K8s, PM2

---

## 3. Repository Structure

```
marketing-os/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── server.ts               # Entry point — Express on port 3001
│   │       ├── index.ts                # App factory (routes, middleware)
│   │       ├── routes/
│   │       │   ├── auth.routes.ts      # Login, user management
│   │       │   ├── agent.routes.ts     # POST /api/run-agent
│   │       │   ├── kb.routes.ts        # GET /api/kb-status
│   │       │   ├── output.routes.ts    # GET /api/outputs
│   │       │   └── health.routes.ts    # GET /api/health
│   │       ├── services/
│   │       │   ├── pipeline.service.ts # Core: KB + Claude → DB + Notion
│   │       │   ├── kb-parser.service.ts# Reads KB files, assembles context
│   │       │   └── notion.service.ts   # Secondary output (optional)
│   │       ├── middleware/
│   │       │   └── auth.ts             # JWT verify + requireRole()
│   │       ├── db/
│   │       │   ├── client.ts           # pg Pool singleton
│   │       │   ├── schema.sql          # DDL — auto-runs on first docker up
│   │       │   └── seed.ts             # Creates first admin user
│   │       └── jobs/
│   │           ├── queue.ts            # Bull queue definition
│   │           ├── processor.ts        # Job handler
│   │           └── scheduler.ts        # 6 recurring jobs
│   └── frontend/
│       └── src/
│           ├── components/
│           │   ├── LoginPage.tsx
│           │   ├── Dashboard.tsx
│           │   ├── AgentPanel.tsx
│           │   ├── KBViewer.tsx
│           │   └── OutputLog.tsx
│           ├── store/
│           │   ├── useAuthStore.ts
│           │   └── useAgentStore.ts
│           └── lib/api.ts
├── agents/                             # 9 agent CLAUDE.md files
├── knowledge-base/                     # 12 KB markdown modules
├── docker-compose.yml
└── package.json                        # npm workspaces root
```

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   Corporate LAN / Local Server                │
│                                                               │
│  Browser ──▶ Frontend :3000 (React/nginx)                    │
│                    │ /api proxy                               │
│                    ▼                                          │
│             Backend :3001 (Express)                          │
│              ├── Auth/RBAC middleware                         │
│              ├── Routes (agent, kb, output, health)          │
│              └── pipeline.service.ts                         │
│                    ├── KB Context (reads /knowledge-base/)   │
│                    ├── Claude API call                        │
│                    ├── INSERT agent_outputs (PostgreSQL)      │
│                    └── writeToNotion() [non-fatal]           │
│                                                               │
│  PostgreSQL 16          Redis 7 ──▶ Scheduler service        │
│  - agent_outputs        - Bull queue   (6 cron jobs)         │
│  - users/roles          - job state                          │
│  - job_runs                                                   │
└──────────────────────────────────────────────────────────────┘
                │
   Anthropic Claude API + Notion API (external)
```

---

## 5. Data Flow

### Manual run (UI)

```
1. POST /api/auth/login → bcrypt verify → JWT (8h) → localStorage
2. POST /api/run-agent  (Bearer token)
   → auth.ts verifies JWT, checks role ≥ editor
3. agent.routes.ts loads /agents/{agentId}/CLAUDE.md
4. pipeline.service.runAgent()
   a. getKBContext(agentName) → reads KB markdown → context block
   b. callClaude(system: KB+CLAUDE.md, user: brief) → Anthropic API
   c. INSERT INTO agent_outputs → UUID
   d. writeToNotion() non-fatal parallel write
5. Returns { output, notionUrl, outputId, durationMs }
```

### Scheduled run (Bull)

```
1. scheduler.ts registers 6 repeatable jobs in Redis on startup
2. Bull triggers at cron time → processor.ts picks up job
3. INSERT job_runs(running) → runAgent() → UPDATE job_runs(done|failed)
4. Retries: 2× with exponential backoff
```

---

## 6. Authentication & RBAC

No third-party auth. All user data in PostgreSQL.

| Role | Permissions |
|---|---|
| `admin` | Full access + create/manage users |
| `editor` | Run agents, view KB + output log |
| `viewer` | Read-only |

Flow: `POST /api/auth/login` → bcrypt verify → sign JWT `{ userId, email, role }` → `Authorization: Bearer` on every request → `requireRole()` enforces per-route.

See [setup.md](setup.md) for how to create and manage users.

---

## 7. Agent System

Each agent is a single `CLAUDE.md` file in `/agents/`. No agent logic in code — the code reads the file and sends it as the system prompt to Claude.

See [agents-guide.md](agents-guide.md) for the full interaction model, adding/removing agents.

| Agent ID | Model | Schedule |
|---|---|---|
| `editor` | Sonnet 4.6 | Manual |
| `content-writer` | Sonnet 4.6 | Mon/Thu/Wed cron + manual |
| `social` | Haiku 4.5 | Mon–Fri 7 AM |
| `strategy` | Sonnet 4.6 | Manual |
| `seo` | Sonnet 4.6 | Mon 8 AM |
| `paid-media` | Sonnet 4.6 | Mon 9 AM + manual |
| `fe-dev` | Haiku 4.5 | Manual |
| `be-dev` | Haiku 4.5 | Manual |
| `ux` | Haiku 4.5 | Manual |

---

## 8. Knowledge Base System

12 markdown files in `/knowledge-base/` read from disk on every agent call. No restart required after edits.

See [knowledge-base-guide.md](knowledge-base-guide.md) for full architecture and how to add/remove modules.

---

## 9. Job Queue & Scheduling

Bull replaces node-cron. Advantages: retries, failure logs, state persistence across restarts.

| Job | Cron | Agent | Model |
|---|---|---|---|
| `content-writer-seo-blog` | `0 6 * * 1` | content-writer | sonnet |
| `content-writer-thought-leadership` | `0 6 * * 4` | content-writer | sonnet |
| `social-daily` | `0 7 * * 1-5` | social | haiku |
| `seo-weekly-keywords` | `0 8 * * 1` | seo | sonnet |
| `paid-media-performance` | `0 9 * * 1` | paid-media | sonnet |
| `content-writer-blog-revamp` | `0 6 * * 3` | content-writer | sonnet |

Modify: edit `packages/backend/src/jobs/scheduler.ts` → `docker compose restart scheduler`

---

## 10. Database Schema

```sql
agent_outputs (id UUID, agent_id, team_member, task_type, output_text,
               notion_url NULLABLE, model_used, score, status, duration_ms, created_at)

roles (id, name)   -- admin | editor | viewer
users (id, name, email, password_hash, role_id FK, is_active, last_login_at)

job_runs (id UUID, job_name, agent_id, task_type, trigger, status,
          output_id FK→agent_outputs, error_message, started_at, finished_at, duration_ms)
```

---

*Infra/DB questions → BE Developer | Agent/KB questions → AI Marketer*
