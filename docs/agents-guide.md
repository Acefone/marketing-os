# Marketing Agent OS — Agent Interaction Guide

How the system interacts with agent `.md` files, how agents work end-to-end, and how to add, edit, or remove agents.

---

## What is a CLAUDE.md file?

Each agent in this system is defined entirely by a single markdown file: `CLAUDE.md`. This file is the agent's **system prompt** — it tells Claude who it is, what its job is, what format to produce, and what rules to follow.

There is no agent logic in code. The code just:
1. Reads the CLAUDE.md file from disk
2. Prepends relevant knowledge base context
3. Sends it to the Claude API as the system prompt
4. Saves the response

Everything about an agent's behaviour — tone, format, depth, rules — is controlled by its CLAUDE.md.

---

## How an agent call works (end-to-end)

```
User clicks "Run" in the UI (or Bull fires a scheduled job)
        │
        ▼
agent.routes.ts
  reads /agents/{agentId}/CLAUDE.md from the filesystem
        │
        ▼
pipeline.service.ts → runAgent()
  ┌─────────────────────────────────────────────────────────────┐
  │  1. getKBContext(agentName)                                 │
  │     → kb-parser.service reads the relevant KB .md files    │
  │     → assembles them into a context block:                  │
  │       "=== KNOWLEDGE BASE CONTEXT ===                       │
  │        [KB-01] Brand Voice Guide                            │
  │        <full file content>                                  │
  │        [KB-02] ICP                                          │
  │        <full file content> ..."                             │
  │                                                             │
  │  2. Build the system prompt:                                │
  │     system = KB context block + CLAUDE.md content          │
  │                                                             │
  │  3. Send to Anthropic API:                                  │
  │     messages.create({                                       │
  │       model: "claude-sonnet-4-6",                           │
  │       system: <KB + CLAUDE.md>,                             │
  │       messages: [{ role: "user", content: userBrief }]     │
  │     })                                                      │
  │                                                             │
  │  4. Save output to PostgreSQL (agent_outputs table)         │
  │  5. Write to Notion (non-fatal — won't block if it fails)  │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
  Returns { output, notionUrl, outputId, durationMs }
```

---

## The 9 agents

| Agent folder | Agent ID | Model | Team member |
|---|---|---|---|
| `agents/editor-agent/` | `editor` | Sonnet 4.6 | All |
| `agents/content-writer-agent/` | `content-writer` | Sonnet 4.6 | Content Writer |
| `agents/social-media-agent/` | `social` | Haiku 4.5 | Social Marketer |
| `agents/strategy-agent/` | `strategy` | Sonnet 4.6 | Digital Mktg Mgr |
| `agents/seo-agent/` | `seo` | Sonnet 4.6 | SEO Executive |
| `agents/paid-media-agent/` | `paid-media` | Sonnet 4.6 | Paid Marketer |
| `agents/fe-dev-agent/` | `fe-dev` | Haiku 4.5 | FE Developer |
| `agents/be-dev-agent/` | `be-dev` | Haiku 4.5 | BE Developer |
| `agents/ux-agent/` | `ux` | Haiku 4.5 | UX Designer |

---

## Where agent IDs are registered in code

When you add a new agent or rename one, you need to update 3 files:

1. **`packages/backend/src/routes/agent.routes.ts`** — `AGENT_FOLDER_MAP`  
   Maps agent ID → folder name:
   ```typescript
   const AGENT_FOLDER_MAP: Record<AgentId, string> = {
     "editor": "editor-agent",
     "content-writer": "content-writer-agent",
     // ...
   };
   ```

2. **`packages/backend/src/services/kb-parser.service.ts`** — `AGENT_KB_MAP`  
   Maps agent ID → which KB modules to inject:
   ```typescript
   const AGENT_KB_MAP: Record<string, string[]> = {
     "content-writer": ["KB-01", "KB-02", "KB-03", "KB-05", "KB-06", "KB-07", "KB-09"],
     "social":         ["KB-01", "KB-02", "KB-03", "KB-08"],
     // ...
   };
   ```

3. **`packages/frontend/src/components/AgentPanel.tsx`** — `AGENTS` array  
   Controls what appears in the UI dropdown.

---

## How to edit an existing agent

1. Open the agent's `CLAUDE.md` file — for example:
   `agents/content-writer-agent/CLAUDE.md`

2. Make your changes. Common edits:
   - Change the output format (add/remove sections)
   - Tighten tone or style instructions
   - Add examples of good/bad output
   - Update task type descriptions

3. Save and test via the UI (run a manual task)

4. Commit with a clear message:
   ```bash
   git commit -m "content-writer CLAUDE.md v1.2: tightened SEO brief format"
   ```

**No restart required** — CLAUDE.md files are read from disk on every agent call.

---

## How to add a new agent

### Step 1 — Create the CLAUDE.md file

```
agents/
└── your-new-agent/
    └── CLAUDE.md
```

Use an existing agent as a starting point. A good CLAUDE.md structure:

```markdown
# [Agent Name] — System Prompt

## Role
You are [role] for [company]. Your job is to [core responsibility].

## Context
[What this agent knows / what it has access to]

## Task Types
### [Task Type 1]
[What to produce, format, length, tone]

### [Task Type 2]
[...]

## Output Rules
- [Rule 1 — formatting, length, structure]
- [Rule 2 — what to never do]
- [Rule 3 — what to always do]

## Quality bar
[What "good" looks like for this agent's output]
```

### Step 2 — Register the agent ID in code

In `packages/backend/src/types/index.ts`, add to `AgentId`:
```typescript
export type AgentId = "editor" | "content-writer" | ... | "your-new-agent";
```

In `packages/backend/src/routes/agent.routes.ts`, add to `AGENT_FOLDER_MAP`:
```typescript
"your-new-agent": "your-new-agent",
```

In `packages/backend/src/services/kb-parser.service.ts`, add to `AGENT_KB_MAP`:
```typescript
"your-new-agent": ["KB-01", "KB-02"],  // list the KB modules this agent needs
```

In `packages/frontend/src/components/AgentPanel.tsx`, add to the `AGENTS` array:
```typescript
{ id: "your-new-agent", name: "Your Agent Label", teamMember: "Team Member Name", taskTypes: ["Task A", "Task B"] }
```

### Step 3 — (Optional) Add a scheduled job

If this agent should run on a cron, add to `packages/backend/src/jobs/scheduler.ts`:

```typescript
await agentQueue.add(
  "your-new-agent-weekly",
  { jobName: "your-new-agent-weekly", trigger: "cron", agentId: "your-new-agent", ... },
  { repeat: { cron: "0 9 * * 1" } }  // Mon 9 AM
);
```

Then restart the scheduler: `docker compose restart scheduler`

---

## How to remove an agent

1. Delete the agent folder: `agents/your-agent/`
2. Remove from `AGENT_FOLDER_MAP` in `agent.routes.ts`
3. Remove from `AGENT_KB_MAP` in `kb-parser.service.ts`
4. Remove from `AgentId` type in `types/index.ts`
5. Remove from `AGENTS` array in `AgentPanel.tsx`
6. Remove any scheduled jobs from `scheduler.ts` if applicable
7. Restart: `docker compose restart backend scheduler`

Existing `agent_outputs` rows for this agent remain in PostgreSQL — they are not deleted.

---

## CLAUDE.md file path resolution

The backend resolves agent files at runtime:

```typescript
// In agent.routes.ts
const agentDir = path.join(process.cwd(), "../../agents", folderName);
const claudeMdPath = path.join(agentDir, "CLAUDE.md");
const systemPrompt = fs.readFileSync(claudeMdPath, "utf-8");
```

In Docker: `process.cwd()` is `/app`, so `../../agents` resolves to `/agents` — which matches the Docker Compose volume mount:
```yaml
volumes:
  - ./agents:/app/agents:ro
```

In local dev: `process.cwd()` is `packages/backend`, so `../../agents` correctly resolves to the project root `/agents/`.

---

## Model selection

| Model | When to use |
|---|---|
| `claude-sonnet-4-6` | Long-form writing, analysis, strategy — anything where quality matters |
| `claude-haiku-4-5` | Short structured output, spec docs, social posts — where speed + cost matter |

Haiku is ~20× cheaper per token than Sonnet. Do not upgrade a Haiku agent to Sonnet unless you've verified the output quality gap is worth it.

To change a specific agent's model, update the `model` field in either:
- `scheduler.ts` (for scheduled jobs)
- `AgentPanel.tsx` AGENTS array (for manual runs — passed to the API)

---

*KB content questions → AI Marketer | Code registration changes → BE Developer*
