---
name: slide-polish
description: >-
  Structure messy meeting notes into slide narratives, expand sparse bullets
  without inventing facts, and polish deck aesthetics/logic for this slide-maker
  project. Use when the user asks to turn notes into slides, improve deck
  storytelling, refine PPTX visual system, GEO/marketing decks, or connect
  MCP/tools later for brand/aesthetic enhancement.
---

# Slide Polish

Turn raw notes into a coherent, speakable deck. Prefer clarity over decoration.

## When to use

- User pastes meeting notes / 会议摘要 and wants slides
- User asks to 结构化、拓展、润色、审美升级 a deck
- Generating or revising `content/notes/*.md` or PPTX under `content/decks/`
- Wiring future MCP (brand kit, image, typography) into this workflow

## Pipeline

1. **Preserve raw** — keep an verbatim appendix (do not lose original phrasing).
2. **Extract claims** — names, numbers, product names, metaphors stay intact.
3. **Choose narrative arc** (pick one):
   - Claim → Evidence → Implication → Action
   - Timeline → Shift → System → Org/Talent → Close
   - Problem → Reframe → Capability → Playbook
4. **Map to layouts** (project vocabulary):
   - `title` — cover / closing
   - `section` — chapter divider (use every 3–5 content slides)
   - `bullets` — 3–5 points max; one idea per line
   - `two_column` — contrast / before-after / 上半场-下半场
5. **Expand carefully** — add connective logic and speaker-ready phrasing; **never invent new metrics, customers, or quotes**.
6. **Polish visuals** — apply the visual system below (or brand MCP if connected).
7. **Output both** — structured Markdown under `content/notes/` + PPTX under `content/decks/`.

## Density rules

- One job per slide; title must state the point, not the topic alone
- Prefer ≤5 bullets; split rather than crowd
- Numbers get their own emphasis line when they carry the argument
- Section slides reset attention; do not skip them in long decks

## Visual system (default for this repo)

Avoid purple-on-white and generic “AI glow”. Default palette:

| Token | Hex | Use |
|-------|-----|-----|
| Paper | `#F7F4EE` | slide background |
| Ink | `#14161C` | titles / body |
| Muted | `#4A505C` | subtitles / footer |
| Accent | `#C45C26` | rules, column heads, top bar |
| Line | `#D9D2C5` | hairlines / card borders |

Layout habits:

- Widescreen 13.333×7.5 in
- Top accent bar on content slides; ink side rail or band on title/section
- Two-column content in light cards with hairline borders (interaction/compare only)
- Footer whisper: deck theme, not a second headline
- Fonts: Helvetica Neue / Arial stack; no emoji

When an MCP brand kit is available: override palette/fonts from brand tokens first, keep density rules.

## Narrative polish checklist

- [ ] Opening states the reframe in one sentence
- [ ] Each section answers “so what?”
- [ ] Jargon kept only when it was in the notes (e.g. GEO, MOS, Cub Swarm)
- [ ] Closing has 3–5 actionable implications
- [ ] Raw notes appendix exists for audit

## Repo hooks

- Structured notes: `content/notes/`
- Decks: `content/decks/`
- Example builder: `scripts/build_frontier_deck.py` / `scripts/build_themes_deck.py` (HTML)
- App export path: `backend/app/services/html_export.py`


## Optional MCP / tool enhancement

If tools are connected, use them in this order:

1. Brand / token MCP → colors, logo, type
2. Image MCP → full-bleed section atmosphere only (no sticker overlays)
3. Lint script / rebuild PPTX → regenerate deck from structured JSON/Markdown

If no MCP: still deliver Markdown + locally built PPTX using the default visual system.
