---
name: expand-narrative
description: >-
  Expand and logically restructure messy meeting notes into speakable narrative
  markdown plus a chapter outline. Use before generating slides; never invent
  facts; preserve names, numbers, and jargon from the source.
---

# Expand Narrative

Turn raw notes into an expanded deck script. Slides must be built from this
output — never from the raw paste alone.

## Hard rules

1. **Keep source claims** — names, numbers, product names, metaphors stay intact.
2. **No invention** — do not add metrics, customers, quotes, or events absent from notes.
3. **Connective logic only** — expand with “so what?”, transitions, and speaker phrasing.
4. **Prefer one narrative arc**:
   - Claim → Evidence → Implication → Action
   - Timeline → Shift → System → Org/Talent → Close
   - Problem → Reframe → Capability → Playbook

## Output shape

1. **Expanded markdown** (`expanded.md`):
   - Elevator summary (3–5 sentences)
   - Sections with clear H2/H3
   - Bullet points that are speakable, not telegram fragments
2. **Outline** (JSON list):
   - `[{ "title": "...", "intent": "one-line purpose of this chapter" }, ...]`
   - **Target 4–6 chapters** (hard preference). Merge semantically similar themes
     (e.g. brand perception + entry points; talent + creativity).

## Density

- Prefer a short outline that supports an entire deck of **≤12 slides**
- Each chapter maps to ~1–2 content slides (not many thin pages)
- Cull repetition; merge near-duplicates
- Keep jargon only when it appeared in the notes
- **Do not** hard-cut after generation — get density right in expansion/outline

## Checklist

- [ ] Elevator summary states the reframe
- [ ] Every section answers “so what?”
- [ ] Numbers and proper nouns match the source
- [ ] Outline is ordered for speaking, not note-taking order
- [ ] Outline has ≤6 chapters after merges
