# SLIDE_MAP — source-slide index per brief slide type

The `Acefone BFSI Deck.pptx` sample is shape-based (no placeholder layouts). To preserve its visual design, the renderer **duplicates** the exact source slide for each brief slide type and replaces only the largest-font title text. All remaining brief content is written to the slide's speaker notes for manual review.

`assets/master.pptx` contains the 21 source slides exactly as the sample — text intact.

## Mapping (source slide index is 1-based)

| Brief `type` | Source slide | Notes |
|---|---|---|
| `title` | 1 | Cover: big brand statement + eyebrow + trusted-by strip |
| `problem_stats` | 2 | 4-metric pain grid (40% / 95% / 4-8 wks / 40%) + "what's wrong" text |
| `bullet` | 3 | 2×4 before/after grid with 01/02/03/04 numbered items |
| `comparison` | 4 | 3-way capability comparison table |
| `positioning` | 5 | Single-line value prop + paragraph description |
| `section` | 6 | Minimal section divider |
| `trust_badges` | 7 | Compliance badge strip (DoT VNO / TRAI / ISO / CERT-IN) |
| `stat_grid` | 8 | 5-number feature grid under a kicker+subtitle |
| `feature_grid` | 9 | 3-item feature callouts with images |
| `use_case_index` | 10 | 5 numbered use-case tiles |
| `use_case_detail` | 11 | Single use-case deep-dive (reuse for 12/13/14/15 too) |
| `integrations` | 16 | Vendor logo grid grouped by system type |
| `credibility` | 17 | 3 big-number trust stats |
| `results` | 18 | 7-metric results grid |
| `logos_trusted` | 19 | Customer logo wall by vertical |
| `quote` | 20 | 4-quote testimonial grid |
| `closing` | 21 | 3-option CTA footer with contact |

## Reuse rules

- The same source index can appear multiple times in one brief (e.g. 3× `use_case_detail` → 3 duplicates of slide 11, each with a different title).
- If a brief references a `type` not in this map, the renderer logs a warning and skips the slide.

## v1 render limits

- **Titles only are auto-replaced** (largest-font text frame in the source slide).
- **All other content** (bullets, stats, quote body) is written to speaker notes verbatim from `brief.json`. Reviewer opens the .pptx in PowerPoint, reads notes, pastes content into visible text frames.
- **Brand colors, fonts, logos, vector shapes** — fully preserved because we duplicate not rebuild.

## To graduate beyond v1

For full-auto text substitution, annotate each source slide's text frames by field token. Add a table under each slide here:

```
### Slide 8 (stat_grid)
| shape idx | field | original text |
|---|---|---|
| 0 | kicker       | AI Voice Bot |
| 1 | subtitle     | 10 Million Calls. Every Day |
| 2 | stat_1_value | <800ms |
| 3 | stat_1_label | Voice-to-voice latency |
...
```

Then run `scripts/tokenize_master.py` (future) to bake `{{kicker}}` placeholders into `assets/master.pptx`, and the builder will do token substitution.
