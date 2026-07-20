# Slide Maker

AI-assisted slide deck builder: paste meeting notes → LLM structures an outline → edit / preview → export **HTML** slides.

**Stack:** FastAPI + SQLite · Vite + React + TypeScript · OpenAI-compatible LLM

## Quick start

```bash
make install   # install backend + frontend deps
make start     # run API (:8000) + UI (:5173) together
```

Open http://localhost:5173 · Health: http://localhost:8000/api/health

```bash
make test      # backend pytest
make lint      # frontend oxlint
make build     # frontend production build
make decks     # rebuild content/*.html decks
make help      # all targets
```

Set `LLM_API_KEY` in `backend/.env` (copied from `.env.example` on install).

## Project layout

```
slide-maker/
├── backend/                 # FastAPI API, SQLite, LLM, HTML export
│   ├── app/
│   │   ├── routers/         # projects, structure, export
│   │   ├── services/        # llm, html_export
│   │   └── …
│   ├── tests/
│   └── requirements.txt
├── frontend/                # React SPA
│   └── src/pages/           # List, New, Edit, Preview
├── content/
│   ├── notes/               # structured meeting notes
│   └── decks/               # standalone HTML slide decks
└── docs/
```

## Docs

| Doc | Description |
|-----|-------------|
| [docs/design.md](docs/design.md) | Goals, architecture, APIs, slide layouts |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Task-by-task implementation plan |
| [content/](content/) | Notes + HTML decks |

## Status

Backend: health, projects/slides CRUD, LLM structure, **HTML** export.  
Frontend: list, new-from-notes, edit, preview, export HTML (←/→ keys in exported file; `P` to print/PDF).
