# KB-10: Quality Rubric — Acefone Content Scoring Framework

**Version:** 1.0  
**Last updated:** [DATE]  
**Used by:** Editor Agent  
**Purpose:** Defines how all Acefone content is scored before it reaches a human reviewer or gets published to Notion.

---

## Scoring System

Each piece of content is scored across **5 dimensions on a 1–5 scale**.  
The overall score is the average of all 5 dimensions.

| Score | Meaning |
|-------|---------|
| 5 | Exceptional — publish-ready, no changes needed |
| 4 | Strong — minor polish only |
| 3 | Acceptable — notable gaps, specific revisions required |
| 2 | Weak — significant rework needed before consideration |
| 1 | Fail — does not meet minimum standards, return to draft |

---

## Dimension 1: Brand Voice Match

**What it measures:** Does the content sound like Acefone? Does it use our tone, vocabulary, and communication style correctly?

| Score | Criteria |
|-------|----------|
| 5 | Perfectly aligned — tone, vocabulary, and sentence structure are indistinguishable from our best content |
| 4 | Mostly aligned — one or two phrases feel slightly off but overall tone is correct |
| 3 | Partially aligned — correct intent but multiple tone inconsistencies or vocabulary gaps |
| 2 | Poor alignment — frequently off-brand, too formal/casual, or uses prohibited language |
| 1 | Brand violation — reads like a different company's content entirely |

**What to flag:** Over-formal language, jargon the ICP wouldn't use, generic corporate phrases, missing warmth, missing directness.

---

## Dimension 2: Research Depth & Source Quality

**What it measures:** Is the content grounded in real, cited, credible evidence? Does it go beyond surface-level observations?

| Score | Criteria |
|-------|----------|
| 5 | Original research or primary data cited; insights not easily found via a basic search; 3+ credible sources |
| 4 | Solid sourcing; 2–3 credible sources; insights add genuine value |
| 3 | Some sourcing but weak — claims without citations, or sources are secondary aggregators |
| 2 | Mostly assertions without evidence; one weak citation at best |
| 1 | No citations; speculative; or clearly fabricated data points |

**What to flag:** Uncited statistics, vague "studies show" references, hallucinated URLs, Wikipedia as a primary source.

---

## Dimension 3: Audience & Funnel Stage Fit

**What it measures:** Is the content written for the right person at the right moment in their journey?

| Score | Criteria |
|-------|----------|
| 5 | Precisely calibrated — language, depth, and CTA match the persona and funnel stage exactly |
| 4 | Well-targeted — correct audience but one element (usually CTA or depth) is slightly misaligned |
| 3 | Broadly correct audience but wrong depth (too simple for MOFU, too complex for TOFU) |
| 2 | Content could be for anyone — no clear persona or funnel awareness |
| 1 | Wrong audience entirely — would confuse or alienate the intended reader |

**What to flag:** TOFU content with a hard sell, BOFU content without specifics, content that doesn't use ICP vocabulary, missing or wrong CTA.

---

## Dimension 4: Insight Originality

**What it measures:** Does the content say something worth saying? Does it add a perspective the reader couldn't get from 10 other articles?

| Score | Criteria |
|-------|----------|
| 5 | Genuinely original — proprietary angle, unique synthesis, or counterintuitive insight |
| 4 | Above average — takes a clear point of view, even if the topic is common |
| 3 | Competent but generic — covers the topic but says nothing new |
| 2 | Largely derivative — could have been written by copying the top 3 Google results |
| 1 | No original thought — pure summary or obvious observations |

**What to flag:** "In today's fast-paced world", "In conclusion", listicle padding, obvious tips, restating what the reader already knows.

---

## Dimension 5: Factual Accuracy & Product Representation

**What it measures:** Are Acefone's products, features, and differentiators described accurately? Are all claims verifiable?

| Score | Criteria |
|-------|----------|
| 5 | Flawless — every product claim is accurate, every stat is sourced, no misleading implications |
| 4 | Accurate — one minor imprecision that doesn't materially mislead |
| 3 | Mostly accurate — one factual error or one unverifiable product claim |
| 2 | Notable errors — incorrect product descriptions, outdated features, or exaggerated capabilities |
| 1 | Misinformation — contains claims that could damage Acefone's credibility or mislead customers |

**What to flag:** Wrong feature names, outdated pricing references, capabilities we don't have, competitor misrepresentation, hallucinated integrations.

---

## Pass / Fail Thresholds by Content Type

| Content Type | Minimum Overall Score | Minimum per Dimension |
|---|---|---|
| SEO Blog (TOFU) | 3.5 / 5.0 | No dimension below 3.0 |
| Thought Leadership | 4.0 / 5.0 | No dimension below 3.5 |
| LinkedIn Post | 3.0 / 5.0 | Brand voice and audience fit must be ≥ 3.5 |
| Sales Enablement | 4.0 / 5.0 | Factual accuracy must be 5.0 |
| Blog Revamp | 3.5 / 5.0 | No dimension below 3.0 |
| Ad Copy | 3.5 / 5.0 | Brand voice must be ≥ 4.0 |

---

## Editor Agent Output Format

The Editor Agent must return scores in the following JSON format:

```json
{
  "overall_score": 3.8,
  "pass_fail": "PASS",
  "content_type": "SEO Blog",
  "dimension_scores": {
    "brand_voice": 4,
    "research_depth": 3,
    "audience_fit": 4,
    "insight_originality": 4,
    "factual_accuracy": 4
  },
  "annotations": [
    {
      "dimension": "research_depth",
      "score": 3,
      "finding": "The statistic in paragraph 3 ('74% of businesses...') has no citation. Either source it or remove it.",
      "quoted_text": "74% of businesses report that..."
    }
  ],
  "top_3_improvements": [
    "Add a primary citation to the stat in paragraph 3.",
    "The conclusion CTA is too soft for MOFU — sharpen it to a specific action.",
    "Replace 'leverage' (line 7) with 'use' per brand voice guidelines."
  ]
}
```

---

## Words and phrases that always flag a Brand Voice score below 3

These are automatic red flags. If any appear in a draft, the brand voice score cannot exceed 2:

- "In today's fast-paced world"
- "In conclusion" / "To summarise"  
- "Leverage" (use "use" instead)
- "Synergy" / "Synergistic"
- "Robust solution"  
- "Cutting-edge"  
- "Game-changer"
- "Seamless" (unless describing a specific UX feature)
- "Going forward"
- Any passive voice in a headline or subheading

*[Add Acefone-specific terms here during the brand voice guide writing session]*
