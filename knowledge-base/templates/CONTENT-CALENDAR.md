# KB-08: Content Calendar — Acefone

**Version:** 1.0  
**Last updated:** [DATE]  
**Used by:** Social Media Agent (auto-fetches via Notion API)  
**Owner:** Head of Content — update at start of each month  
**Note:** The live calendar lives in Notion. This file is a reference copy and the format spec the Social Agent expects.

---

## How the Social Media Agent uses this

Every weekday at 7 AM, the Social Agent fetches the next day's calendar entry from the Notion database via API. It reads exactly these fields:

| Notion field | What the agent uses it for |
|-------------|---------------------------|
| `Date` | Confirm it's pulling the correct entry |
| `Topic` | The subject of the post |
| `Pillar` | Which content pillar — determines messaging angle |
| `Post Type` | Which of the 5 post formats to use |
| `Platform` | Currently LinkedIn only; future: Instagram, X |
| `Notes` | Optional context the agent should factor in |
| `Status` | Agent only processes entries marked "Ready" |

**Status values:**  
- `Ready` — agent will process this entry  
- `Hold` — skip this entry  
- `Done` — already processed  
- `Needs review` — output produced but awaiting human approval  

---

## Content pillars

Every post belongs to one of these pillars. The pillar shapes the angle and messaging.

| Pillar | What it covers | Typical post types |
|--------|---------------|-------------------|
| [FILL IN — e.g. "Product"] | [FILL IN — e.g. Feature explainers, use cases, how-to with Acefone] | Insight, Educational |
| [FILL IN — e.g. "Industry insight"] | [FILL IN — e.g. UCaaS trends, business comms shifts, market data] | POV, Insight |
| [FILL IN — e.g. "Customer proof"] | [FILL IN — e.g. Outcomes, case studies, customer quotes] | Story, Proof |
| [FILL IN — e.g. "Team & culture"] | [FILL IN — e.g. Behind the scenes, people, values in action] | Story |
| [FILL IN — e.g. "Thought leadership"] | [FILL IN — e.g. Head of Content's POV, provocative angles] | POV |

---

## Monthly post type balance (target)

| Post type | Target % of monthly posts | Why |
|-----------|--------------------------|-----|
| Insight | 30% | Builds credibility — gives value without asking anything |
| Educational | 25% | Searchable, shareable, long tail value |
| Story | 20% | Humanises the brand — highest emotional engagement |
| Proof | 15% | Converts warm audience — builds trust near decision |
| POV | 10% | Drives discussion — builds thought leadership slowly |

---

## Current month calendar (reference)

*The live version is in Notion. This is a snapshot — do not edit here, edit in Notion.*

| Date | Topic | Pillar | Post Type | Notes | Status |
|------|-------|--------|-----------|-------|--------|
| [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | Ready |
| [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | — | Ready |

---

## Notes on topics to avoid this month

*Updated by Head of Content when certain topics are off-limits (legal hold, competitor sensitivity, timing).*

- [FILL IN — e.g. "Do not post about pricing until new plans launch on [date]"]
- [FILL IN]

---

## Seasonal / campaign hooks

*Upcoming dates relevant to content planning — gives the Social Agent context for timely posts.*

| Date | Event | Potential angle |
|------|-------|----------------|
| [FILL IN] | [FILL IN — e.g. "UK Small Business Week"] | [FILL IN] |
| [FILL IN] | [FILL IN] | [FILL IN] |
