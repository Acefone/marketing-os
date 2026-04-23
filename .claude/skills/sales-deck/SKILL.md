---
name: sales-deck
description: Generates industry-specific sales decks as editable .pptx files. Triggers on "build a sales deck", "create a pitch deck", "generate a presentation", "make a deck for <industry>", "/sales-deck", or any request to produce a branded PowerPoint pitch deck. Runs a conversational intake, pulls content from the repo's knowledge-base/, checkpoints a brief.json with the user, then renders via python-pptx against a master template extracted from a gold-standard sample deck.
---

# sales-deck

Produces a branded PPTX pitch deck tailored to a specific prospect / industry, using the repo's knowledge-base as source of truth and a pre-extracted style spec for visual fidelity.

## Prerequisites — before first use

1. **Sample deck extraction must have run.** Check that `reference/STYLE_SPEC.md` and `assets/master.pptx` exist. If either is missing, run Step 0 (below) first — refuse to render until this is done.
2. **Python venv exists.** From `.claude/skills/sales-deck/`:
   ```
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```

## Step 0 — gold-standard extraction (one-shot, before first invocation)

Blocks until the user provides an absolute path to the sample .pptx.

```
.venv\Scripts\python.exe scripts/extract_style_spec.py --input "<absolute path to sample.pptx>" --out reference/STYLE_SPEC.md --assets assets/
```

Produces:
- `reference/STYLE_SPEC.md` — human-readable spec + terminal JSON block the builder consumes
- `assets/master.pptx` — sample with body text stripped; used as render template
- `assets/images/`, `assets/shapes/`, `assets/fonts/` populated

After running, visually diff `assets/master.pptx` against the sample in PowerPoint to confirm layouts, logos, backgrounds, and accent shapes survived.

## Workflow when `/sales-deck` is invoked

### 1. Verify prerequisites
Check `reference/STYLE_SPEC.md` and `assets/master.pptx` exist. If missing, tell the user Step 0 hasn't been run and stop.

### 2. Intake (conversational)
Follow [reference/INTAKE.md](reference/INTAKE.md). Collect:
- Company / product name (the seller)
- Target prospect name (optional)
- Industry / vertical
- **Industry-specific facts** supplied by the user this turn — regulators, jargon, key metrics, recent events to surface. No pre-built industry files exist; this is how specialization happens.
- Target persona / title (e.g. "VP Risk", "Head of Marketing")
- Deck length tier: 8 / 12 / 16 slides
- Primary CTA (e.g. "book a pilot", "schedule discovery call")
- Optional tone override (default: pull from [knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md](../../../knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md))

Ask missing fields one at a time if the user's initial message didn't cover them. Don't proceed with unknowns.

### 3. Select skeleton
From [knowledge-base/templates/DECK-TEMPLATES.md](../../../knowledge-base/templates/DECK-TEMPLATES.md), choose the deck archetype matching persona seniority + length tier. If no exact match, pick the closest and note the adaptation in the brief.

### 4. Synthesize content
Use [reference/KB_MAP.md](reference/KB_MAP.md) — it maps each slide role to a source file in `knowledge-base/`. Read only the files your chosen skeleton requires. For each slide, produce 3–6 bullets respecting the word budget from `STYLE_SPEC.md` per-slide ranges.

Tone pass: rewrite all bullets through the word-lists (use / avoid) in [knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md](../../../knowledge-base/brand-voice/BRAND-VOICE-GUIDE.md).

Pain-slide bullets MUST be paraphrased from real ICP pains in [knowledge-base/icp/ICP.md](../../../knowledge-base/icp/ICP.md) — don't invent.

### 5. Emit brief.json and checkpoint with user
Write to:
```
C:\Users\Testuser\OneDrive - Real Time Data Services Pvt Ltd\Desk Files\Claude Results\<YYYY-MM-DD-HHMM>-<industry-slug>\brief.json
```

Schema:
```json
{
  "meta": {"company": "...", "prospect": "...", "industry": "...", "persona": "...", "length": 12, "cta": "...", "generated_at": "..."},
  "industry_facts": ["...", "..."],
  "slides": [
    {"index": 1, "type": "title", "title": "...", "subtitle": "...", "notes": "..."},
    {"index": 2, "type": "bullet", "title": "...", "bullets": ["...", "...", "..."], "notes": "..."}
  ]
}
```

Show the user a compact summary (slide number, type, title, 1-line gist per slide) and ask: **"Proceed, or revise slide N: <change>?"**

Loop: if user says `revise slide N: <change>`, update only that slide in the brief and re-show the single slide; repeat until they say `proceed`.

### 6. Render
```
.venv\Scripts\python.exe scripts/build_deck.py --brief "<brief.json path>" --spec reference/STYLE_SPEC.md --master assets/master.pptx --out "C:\Users\Testuser\OneDrive - Real Time Data Services Pvt Ltd\Desk Files\Claude Results\<YYYY-MM-DD-HHMM>-<industry>-<persona>.pptx"
```

Create the output folder if missing.

### 7. Report back
- Absolute path to generated .pptx
- Slide count
- Any unresolved placeholders (builder logs these)
- Font fallback warnings (builder logs these)
- Reminder: "Open in PowerPoint and eyedrop against sample to confirm brand color fidelity."

## Slide types the builder supports

Each type in `brief.json["slides"][].type` maps to a source slide in `assets/master.pptx` per [reference/SLIDE_MAP.md](reference/SLIDE_MAP.md). Pick types to match the skeleton you chose.

| Type | Source slide | Use for |
|---|---|---|
| `title` | 1 | Cover — company, value prop, trusted-by |
| `problem_stats` | 2 | 4-metric pain grid |
| `bullet` | 3 | Before/after 2×4 numbered grid |
| `comparison` | 4 | 3-way capability comparison table |
| `positioning` | 5 | Value-prop one-liner + paragraph |
| `section` | 6 | Minimal section divider |
| `trust_badges` | 7 | Compliance/certification badge strip |
| `stat_grid` | 8 | 5-number feature grid under kicker |
| `feature_grid` | 9 | 3-item feature callouts |
| `use_case_index` | 10 | 5 numbered use-case tiles |
| `use_case_detail` | 11 | Single use-case deep-dive (reusable) |
| `integrations` | 16 | Vendor logo grid grouped by system |
| `credibility` | 17 | 3 big-number trust stats |
| `results` | 18 | 7-metric results grid |
| `logos_trusted` | 19 | Customer logo wall |
| `quote` | 20 | 4-quote testimonial grid |
| `closing` | 21 | CTA footer with contact |

Re-use the same type multiple times for repetition (e.g. 3× `use_case_detail` → 3 deep-dive slides).

## v1 render behavior — important for reviewer

The sample deck is **shape-based, not placeholder-based**. The renderer uses a slide-duplicate strategy:

1. Duplicates the exact source slide from `assets/master.pptx` (preserving 100% of Acefone's visual design — brand colors, fonts, logos, vector shapes).
2. **Auto-replaces the largest-font text frame** on each slide with `slide_data["title"]` from the brief.
3. **Dumps the full brief slide data into speaker notes** as YAML-ish text.
4. Original text in all other text frames is preserved (from the sample deck).

**The reviewer must open the rendered .pptx in PowerPoint, read each slide's speaker notes, and paste the generated bullet/stat/quote/comparison content into the existing text frames manually.** This is a deliberate v1 trade-off: perfect visual fidelity, partial content automation.

To graduate beyond v1, annotate text-frame field tokens per source slide in SLIDE_MAP.md and write a `tokenize_master.py` step.

## Limitations — tell the user if asked

- Only **titles are auto-substituted** in v1. All other content goes into speaker notes — reviewer pastes into text frames manually in PowerPoint. See "v1 render behavior" above.
- Visual fidelity comes from duplicating sample slides, not rebuilding them. Any new slide archetype (not in SLIDE_MAP) requires adding a corresponding slide to `assets/master.pptx` AND a new row in SLIDE_MAP.md.
- If a required font isn't installed system-wide and not in `assets/fonts/`, PowerPoint auto-substitutes on open. The 10 embedded fonts from the sample are committed to `assets/fonts/` — install them locally for perfect match.
- Industry specialization is user-supplied per invocation. The skill does not maintain per-industry fact databases.

## File map inside this skill

- `SKILL.md` — this file
- `requirements.txt` — Python deps
- `reference/STYLE_SPEC.md` — (Step 0 output) visual spec the builder reads
- `reference/KB_MAP.md` — static slide-role → KB file mapping
- `reference/INTAKE.md` — static intake question script
- `scripts/extract_style_spec.py` — Step 0 extractor
- `scripts/build_deck.py` — renderer
- `scripts/kb_loader.py` — shared KB markdown reader
- `assets/master.pptx` — (Step 0 output) blank-content template
- `assets/images/`, `shapes/`, `fonts/` — (Step 0 output) extracted from sample
