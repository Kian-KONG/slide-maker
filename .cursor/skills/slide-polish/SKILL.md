---
name: slide-polish
description: >-
  Full slide-maker pipeline: expand messy notes, confirm outline, generate
  Reveal.js slides, polish narrative and aesthetics. Use when building or
  revising decks, expanding notes, or exporting slides.html.
---

# Slide Polish

Pipeline: **raw → expand → confirm outline → slides from expanded → Reveal export**.

## When to use

- User pastes meeting notes and wants slides
- Expand / restructure / aesthetic upgrade requests
- Working under `content/notes/` or `content/decks/`

## Pipeline

1. **Preserve raw** → `notes.md` (verbatim)
2. **Expand** (skill: `expand-narrative`) → `expanded.md` + outline JSON (4–6 chapters)
3. **Human confirm** — edit expanded text and/or outline in the UI
4. **Generate slides from expanded only** — never from raw alone; target ≤12 pages
5. **Layouts**: `title` | `section` | `bullets` | `two_column`
6. **Aesthetics** (skill: `deck-aesthetic`) → Reveal `slides.html` + in-app preview
7. **Export** writes `content/decks/<slug>/{notes,expanded,slides,meta}` via `POST .../export-html`

## Density / narrative

- Titles state the point; **5–8 bullets** on content slides
- Merge similar chapters; few section dividers (≤2–3)
- No invented facts; keep source jargon and numbers
- **No hard page trim** after LLM generation — fix density in prompts / outline

## Repo hooks

- Skills: `.cursor/skills/expand-narrative`, `deck-aesthetic`, `slide-polish`
- APIs: `POST /api/expand`, `PATCH /api/projects/{id}/expanded`, `POST /api/projects/{id}/generate`
- Export client: `apps/web/src/lib/revealExport.ts`
- Store: `apps/api/src/services/deckStore.ts`
- LLM: `apps/api/src/services/llm.ts` (`MAX_SLIDES`, `MAX_OUTLINE_CHAPTERS`)
