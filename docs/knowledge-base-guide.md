# Marketing Agent OS — Knowledge Base Guide

How the knowledge base works, how to add or remove KB modules, and how flexible the system is for changes.

---

## What is the knowledge base?

The knowledge base is a set of **12 plain markdown files** in the `/knowledge-base/` folder. They represent Acefone's institutional marketing knowledge — brand voice, target customers, product differentiators, SEO keywords, and more.

Every time an agent runs, the system reads a curated subset of these files and injects them into the agent's system prompt **before** sending it to Claude. This means every agent response is grounded in your real company context, not just Claude's training data.

**Key property: files are read from disk on every call.** There is no cache, no DB sync required. Edit a file → the next agent call picks up the change immediately. No restart needed.

---

## Current KB modules

| ID | File path | Purpose | Used by |
|---|---|---|---|
| KB-01 | `brand-voice/BRAND-VOICE-GUIDE.md` | Tone, style, writing rules | editor, content-writer, social, ux |
| KB-02 | `icp/ICP.md` | Ideal customer profile | content-writer, social, strategy, seo, paid-media, ux |
| KB-03 | `positioning/POSITIONING.md` | Product positioning, value props | All except be-dev |
| KB-04 | `competitors/COMPETITOR-ANALYSIS.md` | Competitor landscape | strategy |
| KB-05 | `funnel/FUNNEL-STAGE-DEFINITIONS.md` | Marketing funnel stages | content-writer, seo |
| KB-06 | `templates/CONTENT-BRIEF-TEMPLATE.md` | Content brief format | content-writer |
| KB-07 | `products/PRODUCT-DIFFERENTIATORS.md` | Feature/benefit list | content-writer, strategy, paid-media |
| KB-08 | `templates/CONTENT-CALENDAR.md` | Social calendar/themes | social |
| KB-09 | `seo/KEYWORD-LIBRARY.md` | Target keyword list | content-writer, seo |
| KB-10 | `templates/QUALITY-RUBRIC.md` | Output quality criteria | editor |
| KB-11 | `templates/DECK-TEMPLATES.md` | Presentation structures | strategy, fe-dev |
| KB-12 | `ad-copy/AD-COPY-LIBRARY.md` | Past ad copy examples | paid-media |

---

## How KB context is assembled

When an agent runs, `kb-parser.service.ts` builds a context block like this:

```
=== KNOWLEDGE BASE CONTEXT ===

[KB-01] Brand Voice Guide
------
<full content of BRAND-VOICE-GUIDE.md>

[KB-02] ICP
------
<full content of ICP.md>

...
```

This block is prepended to the agent's CLAUDE.md system prompt. Claude sees both: the KB context (company knowledge) + the CLAUDE.md (how to behave and what to produce).

The mapping that controls which KB modules go to which agent lives in:
`packages/backend/src/services/kb-parser.service.ts` → `AGENT_KB_MAP`

```typescript
const AGENT_KB_MAP: Record<string, string[]> = {
  "editor":         ["KB-01", "KB-10"],
  "content-writer": ["KB-01", "KB-02", "KB-03", "KB-05", "KB-06", "KB-07", "KB-09"],
  "social":         ["KB-01", "KB-02", "KB-03", "KB-08"],
  "strategy":       ["KB-02", "KB-03", "KB-04", "KB-07", "KB-11"],
  "seo":            ["KB-02", "KB-03", "KB-05", "KB-09"],
  "paid-media":     ["KB-02", "KB-03", "KB-07", "KB-12"],
  "fe-dev":         ["KB-11"],
  "be-dev":         [],        // no KB context — pure technical agent
  "ux":             ["KB-01", "KB-02", "KB-03"],
};
```

Agents with an empty array receive no KB context — only their CLAUDE.md.

---

## How to update an existing KB module

1. Open the relevant `.md` file in `knowledge-base/`
2. Make your edits — be specific and concrete (vague additions reduce output quality)
3. Save — the next agent call picks it up automatically
4. Commit:
   ```bash
   git commit -m "KB-02: updated ICP — added SMB segment April 2026"
   ```

**No restart required.**

---

## KB status in the UI

The Knowledge Base tab in the dashboard shows each module's status:

| Status | Meaning |
|---|---|
| **Complete** | File exists, no `[FILL IN]` placeholders |
| **Draft** | File exists but has unfilled sections |
| **Pending** | File does not exist on disk |

If a module is **Pending**, agents that depend on it still run — they just skip that module and proceed with the remaining context. The output may be lower quality for areas covered by the missing module.

---

## How to add a new KB module

The system is fully flexible. Steps:

### Step 1 — Create the file

Create a new markdown file anywhere in `/knowledge-base/`. Use a descriptive folder and filename:

```
knowledge-base/
└── case-studies/
    └── CUSTOMER-CASE-STUDIES.md
```

### Step 2 — Register it in kb-parser.service.ts

Open `packages/backend/src/services/kb-parser.service.ts` and add to `KB_FILES`:

```typescript
export const KB_FILES: Record<string, string> = {
  "KB-01": path.join(KB_ROOT, "brand-voice/BRAND-VOICE-GUIDE.md"),
  // ... existing entries ...
  "KB-13": path.join(KB_ROOT, "case-studies/CUSTOMER-CASE-STUDIES.md"),  // new
};
```

### Step 3 — Map it to the agents that should use it

In the same file, update `AGENT_KB_MAP` to include the new module ID for relevant agents:

```typescript
"content-writer": ["KB-01", "KB-02", "KB-03", "KB-05", "KB-06", "KB-07", "KB-09", "KB-13"],
```

### Step 4 — Restart the backend

```bash
# Dev
# (just save — tsx watch reloads automatically)

# Production
docker compose restart backend
```

That's it. The new module will be injected into agent calls for the agents you mapped it to.

---

## How to remove a KB module

1. Remove the entry from `KB_FILES` in `kb-parser.service.ts`
2. Remove its ID from all entries in `AGENT_KB_MAP`
3. Optionally delete the `.md` file (or keep it archived — it won't be read if not in `KB_FILES`)
4. Restart the backend

---

## How to replace the entire knowledge base

If you want to replace Acefone's KB with a completely different company's:

1. Replace or rewrite all files in `/knowledge-base/`
2. Keep the same file paths — or update `KB_FILES` in `kb-parser.service.ts` to point to the new paths
3. Review `AGENT_KB_MAP` — adjust which modules go to which agents if your new KB has different coverage
4. Restart backend

No database changes needed. The KB is entirely filesystem-based.

---

## Cost impact of KB size

KB context is sent to Claude on every agent call — it directly affects token cost.

**Guidelines:**
- Keep each KB file focused. Don't paste entire documents — extract only the decision-relevant content.
- KB-02 (ICP) and KB-03 (Positioning) are injected into 6+ agents and sent multiple times per day. Keep them under ~2000 words each.
- KB-09 (Keyword Library) can be large but is only used by 2 agents.
- If costs grow, consider enabling Anthropic prompt caching in `pipeline.service.ts` — repeated KB context is cacheable.

---

## KB file format recommendations

There is no required format — Claude reads plain markdown. But for best results:

```markdown
# [Module Name]

## [Section 1]
[Concise, decision-ready content]

## [Section 2]
[...]

Last updated: April 2026
```

- Use headers to separate sections — Claude uses them to navigate the content
- Write in the third person where possible ("Acefone's target customer is...")
- Replace `[FILL IN]` placeholders before going to production — they degrade output quality
- Include a "Last updated" line — helps the AI Marketer track freshness

---

*File edits → AI Marketer | Code registration (new modules) → BE Developer*
