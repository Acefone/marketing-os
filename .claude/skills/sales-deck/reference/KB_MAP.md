# KB_MAP — slide-role → knowledge-base source

Maps each slide role the skill produces to the file(s) in `knowledge-base/` that supply its content. Used during the synthesis step of the sales-deck workflow.

All paths below are **relative to the repo root** (two levels up from `.claude/skills/sales-deck/`).

## Per-slide mapping

| Slide role | Primary source | Secondary sources | Notes |
|---|---|---|---|
| `title` | `knowledge-base/positioning/POSITIONING.md` | intake (company, prospect) | Use the positioning one-liner as subtitle. |
| `agenda` | derived from selected skeleton | — | Plain list of upcoming section titles. |
| `section` divider | selected skeleton | — | Section name only. No KB read needed. |
| `challenge` / `pain` | `knowledge-base/icp/ICP.md` | `knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md` (tone) | Filter pains by the intake persona. Keep verbatim phrasing where possible. |
| `quote` | `knowledge-base/icp/ICP.md` | — | Pull a real verbatim pain quote. Attribute to persona + industry, never a named individual. |
| `market` / `why now` | `knowledge-base/positioning/POSITIONING.md` | intake `industry_facts` | User-supplied industry facts carry equal weight here. |
| `approach` / `solution` | `knowledge-base/products/PRODUCT-DIFFERENTIATORS.md` | — | 3 ranked differentiators, claim + 1-line proof each. |
| `why us` | `knowledge-base/products/PRODUCT-DIFFERENTIATORS.md` | `knowledge-base/positioning/POSITIONING.md` | Top 3 differentiators, bolded claims. |
| `competitors` / `comparison` | `knowledge-base/competitors/COMPETITOR-ANALYSIS.md` | — | **Only include if deck length ≥ 12.** 2-column table: us vs primary competitor. |
| `proof` / `case study` | `knowledge-base/products/PRODUCT-DIFFERENTIATORS.md` (proof fields) | — | Lead with the strongest quant proof point. |
| `stat` | `knowledge-base/products/PRODUCT-DIFFERENTIATORS.md` | intake `industry_facts` | Big-number + caption. Prefer user-supplied industry stat if provided. |
| `cta` / `closing` | intake `cta` | `knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md` | Filter CTA through use/avoid word lists. Append contact line from intake. |
| `appendix` | — | any | Only if length = 16 and there's leftover proof content. |

## Tone pass

After content is drafted, rewrite every bullet through `knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md`:
- Prefer words from the **use** list
- Replace any occurrences of words from the **avoid** list
- Match the tone spectrum position declared in the guide (unless intake `tone_override` is set)

## Content-depth rules

Word budget per slide comes from `reference/STYLE_SPEC.md` per-slide ranges (extracted from sample deck). The synthesizer MUST respect these ranges — truncate/expand rather than letting slides overflow. If a pain quote exceeds the budget, prefer truncating with ellipsis over cutting the verbatim voice.

## What to NOT pull from KB

- `knowledge-base/seo/` — not relevant to decks
- `knowledge-base/ad-copy/` — wrong format/tone
- `knowledge-base/funnel/` — internal ops content, not for external decks
