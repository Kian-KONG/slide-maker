# Slide Maker

AI-assisted slide deck builder: paste meeting notes → LLM expands & outlines → edit → generate slides → preview / export **Reveal.js HTML**.

**Stack:** Fastify + TypeScript + SQLite · Vite + React · Reveal.js · OpenAI-compatible LLM (DeepSeek)

## Quick start

```bash
make install   # install workspace deps (apps/api + apps/web)
make start     # run API (:8000) + UI (:5173) together
```

Open http://localhost:5173 · Health: http://localhost:8000/api/health

```bash
make test       # API tests (node:test)
make lint       # web oxlint
make build      # web production build
make typecheck  # TypeScript checks
make help       # all targets
```

Set `LLM_API_KEY` in `apps/api/.env` (copied from `.env.example` on install).

Defaults are DeepSeek (`https://api.deepseek.com/v1` · set `LLM_MODEL` in `.env`). Key: https://platform.deepseek.com/api_keys

Density targets (prompt-guided, no hard trim): outline **4–6** chapters, deck **≤12** slides, denser bullets per page.

Export downloads Reveal HTML **and** saves under `content/decks/<slug>/` (`notes.md`, `expanded.md`, `slides.html`, `meta.json`).

Flow in UI: **New → Expand (edit narrative + outline) → Generate slides → Edit / Preview**.

## Project layout

```
slide-maker/
├── apps/
│   ├── api/                 # Fastify API, SQLite, LLM, deck store
│   └── web/                 # React SPA + Reveal.js preview/export
├── content/
│   ├── notes/               # structured meeting notes
│   └── decks/               # standalone Reveal HTML decks
├── package.json             # npm workspaces root
└── docs/
```

## Docs

| Doc | Description |
|-----|-------------|
| [docs/design.md](docs/design.md) | Goals, architecture, APIs, slide layouts |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Task-by-task implementation plan |
| [content/](content/) | Notes + HTML decks |

## Status

API: health, projects/slides CRUD, expand → generate, Reveal HTML export to disk.  
Web: list, new-from-notes, expand, edit, Reveal preview, export HTML.
