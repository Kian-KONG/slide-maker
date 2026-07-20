# Slide Maker

AI-assisted slide deck builder: paste meeting notes → LLM structures an outline → edit / preview → export `.pptx`.

**Stack:** FastAPI + SQLite · Vite + React + TypeScript · python-pptx · OpenAI-compatible LLM

## Project layout

```
slide-maker/
├── backend/                 # FastAPI API, SQLite, LLM, PPTX export
│   ├── app/
│   │   ├── routers/         # projects, structure, export
│   │   ├── services/        # llm, pptx_export
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
├── frontend/                # React SPA (Vite)
│   └── src/
│       ├── api/
│       ├── pages/           # List, New (+ Edit/Preview planned)
│       ├── App.tsx
│       └── types.ts
└── docs/
    ├── design.md            # Product & architecture design
    ├── implementation-plan.md
    └── sdd/                 # Task briefs / reports / progress
```

## Quick start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set LLM_API_KEY (and optionally LLM_BASE_URL / LLM_MODEL)
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health` → `{"status":"ok"}`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (Vite proxies `/api` → `http://localhost:8000`)

### Tests

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```

## Docs

| Doc | Description |
|-----|-------------|
| [docs/design.md](docs/design.md) | Goals, architecture, APIs, slide layouts |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Task-by-task implementation plan |
| [docs/sdd/](docs/sdd/) | Development task briefs, reports, progress ledger |

## Status

Backend: health, projects/slides CRUD, LLM structure, PPTX export.  
Frontend: project list + new-from-notes (edit / preview pages still planned).
