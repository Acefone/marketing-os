# INTAKE — conversational intake script

The skill asks these questions when `/sales-deck` is invoked. Parse the user's initial message first — only ask questions whose answers weren't already supplied. Ask ONE question at a time if several are missing; batching into one turn is acceptable only if the user's opening message clearly shows they're ready to answer everything at once.

## Required fields

| Field | Question | Validation |
|---|---|---|
| `company` | "What's the seller company / product name for this deck?" | Non-empty string. |
| `industry` | "What industry or vertical is the prospect in? (e.g. BFSI, healthcare, e-commerce)" | Non-empty. |
| `industry_facts` | "List 3–5 industry-specific facts you want surfaced — regulators, key metrics, recent events, jargon. One per line." | At least 1 item. If user has none, explicitly confirm "none" and proceed. |
| `persona` | "Who's the target persona / title you're pitching? (e.g. VP Risk, Head of Customer Experience)" | Non-empty. |
| `length` | "How many slides — 8, 12, or 16?" | Must be one of `8 / 12 / 16`. |
| `cta` | "What's the primary CTA on the closing slide? (e.g. 'book a pilot', 'schedule discovery call')" | Non-empty. |

## Optional fields — only ask if relevant

| Field | Question | Default |
|---|---|---|
| `prospect` | "Is there a specific prospect company name to put on the title slide?" | `null` → title slide uses generic industry reference |
| `tone_override` | "Default tone is pulled from BRAND-VOICE-GUIDE.md. Want to override with a specific tone? (e.g. 'more formal', 'punchier')" | `null` → use brand voice default |
| `contact` | "Contact line for the closing slide — name, email, phone?" | prompt once, remember for session |

## Confirmation before synthesis

After intake, read back a one-line summary and let the user correct before the skill reads KB files:

> "Building a {length}-slide deck for {company} pitching to {persona} at a {industry} prospect. CTA: {cta}. Industry facts noted: {N}. Proceed?"

Only on `proceed` or `yes` move to content synthesis. If the user edits, update and re-confirm.

## Brief checkpoint (after synthesis, before render)

Show the user:
- Slide count and type breakdown
- Per-slide: index, type, title, 1-line gist of the body

Then ask: **"Proceed to render, or revise slide N: <change>?"**

Revision loop: if `revise slide N: <change>`, update only that slide's entry in `brief.json`, re-show just that slide, and ask again. Repeat until `proceed`.
