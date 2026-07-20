---
name: deck-aesthetic
description: >-
  Visual system for Reveal.js slide decks and in-app preview in slide-maker. Use
  when exporting slides.html, polishing Preview, or designing cover / section /
  bullets / two-column layouts. Avoid purple AI-cliché themes.
---

# Deck Aesthetic

Prefer clarity over decoration. High information density per slide; fewer total pages.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| Paper | `#F7F4EE` | slide background |
| Ink | `#14161C` | titles / body |
| Muted | `#4A505C` | subtitles / footer |
| Accent | `#C45C26` | rules, column heads, top bar |
| Line | `#D9D2C5` | hairlines / card borders |
| White | `#FFFFFF` | column cards |

Avoid: purple-on-white, indigo glow, emoji, multi-layer shadows, pill clusters.

## Layout habits

- Widescreen 16:9 (Reveal.js)
- **Title**: ink side rail + large title + muted subtitle
- **Section**: full ink band + warm accent hairline + light subtitle (≤2–3 per deck)
- **Bullets**: top accent bar, hairline under title, **5–8 dense points**
- **Two-column**: white cards with hairline borders; accent column headings — prefer for contrasts
- Footer whisper: Reveal slide number

## Typography

- Sans stack: Helvetica Neue / PingFang SC / Microsoft YaHei / Arial
- Title: bold, clamp large; body ~1.05–1.35rem; never walls of fluff

## Density

- Whole deck **≤12 slides** (prompt target; no post-generation hard trim)
- Prefer dense bullets / two_column over many thin slides
- Numbers get emphasis when they carry the argument

## Repo hooks

- Theme CSS: `frontend/src/lib/revealExport.ts`
- Preview: `frontend/src/pages/PreviewPage.tsx`
