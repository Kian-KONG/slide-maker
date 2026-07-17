# Slide Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite+React+React Router + FastAPI+SQLite web app that turns messy meeting notes into editable, previewable, downloadable PPTX decks via an OpenAI-compatible LLM.

**Architecture:** SPA talks to FastAPI over `/api`. Backend owns LLM structuring, SQLite persistence (`projects` + `slides`), and `python-pptx` export. API keys live only in backend `.env`. Vite proxies `/api` to `localhost:8000`.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, httpx, python-pptx, pydantic-settings; Vite, React 18, React Router 6, TypeScript.

**Spec:** `docs/superpowers/specs/2026-07-17-slide-maker-design.md`

## Global Constraints

- No Next.js / SSR — SPA only with React Router
- No auth / multi-tenant in v1
- LLM: OpenAI-compatible Chat Completions; config via `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
- SQLite file: `backend/data/slide_maker.db`
- Slide layouts only: `title` | `section` | `bullets` | `two_column`
- Structure endpoint path: `POST /api/structure` (not under `{id}`)
- API errors: `{ "detail": "..." }`
- Do not commit secrets; `.env` is gitignored

## File Map

| Path | Responsibility |
|------|----------------|
| `backend/app/main.py` | FastAPI app, CORS, router mount |
| `backend/app/config.py` | Settings from `.env` |
| `backend/app/db.py` | SQLite connect, schema init |
| `backend/app/schemas.py` | Pydantic request/response models |
| `backend/app/routers/projects.py` | CRUD + PUT slides |
| `backend/app/routers/structure.py` | POST `/api/structure` |
| `backend/app/routers/export.py` | POST export PPTX |
| `backend/app/services/llm.py` | Chat Completions + JSON parse/validate |
| `backend/app/services/pptx_export.py` | Build Presentation bytes |
| `backend/tests/` | pytest API/unit tests |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/types.ts` | Shared TS types |
| `frontend/src/api/client.ts` | fetch helpers |
| `frontend/src/pages/*` | List, New, Edit, Preview |
| `frontend/src/components/*` | Slide list/form/canvas |

---

### Task 1: Repo + Backend skeleton + DB

**Files:**
- Create: `slide-maker/.gitignore`, `slide-maker/README.md`
- Create: `backend/requirements.txt`, `backend/.env.example`, `backend/app/__init__.py`
- Create: `backend/app/config.py`, `backend/app/db.py`, `backend/app/main.py`
- Create: `backend/tests/test_health.py`, `backend/tests/conftest.py`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Produces: `get_settings()`, `get_connection()`, `init_db()`, FastAPI app with `GET /api/health`

- [ ] **Step 1: Init git and ignore secrets**

```bash
cd /Users/bob/Workspace/slide-maker
git init
```

Write `.gitignore`:

```
.env
backend/.env
backend/data/*.db
backend/__pycache__/
backend/**/__pycache__/
backend/.pytest_cache/
frontend/node_modules/
frontend/dist/
.DS_Store
*.pyc
.venv/
backend/.venv/
```

- [ ] **Step 2: Write failing health test**

`backend/requirements.txt`:

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
httpx>=0.27.0
python-pptx>=1.0.0
pydantic-settings>=2.6.0
pytest>=8.0.0
```

`backend/tests/conftest.py`:

```python
import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Isolate DB before app import side effects
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_PATH"] = _tmp.name
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("LLM_BASE_URL", "https://example.com/v1")
os.environ.setdefault("LLM_MODEL", "test-model")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")


@pytest.fixture()
def client():
    from app.main import app
    from app.db import init_db

    init_db()
    with TestClient(app) as c:
        yield c
```

`backend/tests/test_health.py`:

```python
def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
```

- [ ] **Step 3: Run test — expect fail**

```bash
cd /Users/bob/Workspace/slide-maker/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest tests/test_health.py -v
```

Expected: FAIL (app/module missing)

- [ ] **Step 4: Implement config, db, main**

`backend/app/config.py`:

```python
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BACKEND_ROOT / ".env"), extra="ignore")

    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"
    database_path: str = str(BACKEND_ROOT / "data" / "slide_maker.db")
    cors_origins: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

`backend/app/db.py`:

```python
import sqlite3
from pathlib import Path

from app.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  raw_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  layout TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '{}',
  UNIQUE(project_id, position)
);
CREATE INDEX IF NOT EXISTS idx_slides_project_pos ON slides(project_id, position);
"""


def get_connection() -> sqlite3.Connection:
    path = Path(get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()
```

`backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db

app = FastAPI(title="Slide Maker")
settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
```

`backend/.env.example`:

```
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
DATABASE_PATH=./data/slide_maker.db
CORS_ORIGINS=http://localhost:5173
```

Minimal `README.md` at repo root with run instructions (fill more in Task 8).

- [ ] **Step 5: Run tests — expect pass**

```bash
cd /Users/bob/Workspace/slide-maker/backend && source .venv/bin/activate
PYTHONPATH=. pytest tests/test_health.py -v
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/bob/Workspace/slide-maker
git add .gitignore README.md backend
git commit -m "$(cat <<'EOF'
chore: scaffold slide-maker backend with health and sqlite

EOF
)"
```

---

### Task 2: Schemas + projects CRUD + slides PUT

**Files:**
- Create: `backend/app/schemas.py`, `backend/app/routers/__init__.py`, `backend/app/routers/projects.py`
- Modify: `backend/app/main.py` (include router)
- Create: `backend/tests/test_projects.py`
- Test: `backend/tests/test_projects.py`

**Interfaces:**
- Consumes: `get_connection()`, `init_db()`
- Produces: REST per spec — list/create/get/patch/delete project; `PUT /api/projects/{id}/slides`

- [ ] **Step 1: Write failing CRUD tests**

`backend/tests/test_projects.py`:

```python
def test_create_and_list_project(client):
    r = client.post("/api/projects", json={"title": "Demo", "raw_notes": "notes"})
    assert r.status_code == 201
    body = r.json()
    assert body["project"]["title"] == "Demo"
    assert body["slides"] == []

    r2 = client.get("/api/projects")
    assert r2.status_code == 200
    assert any(p["id"] == body["project"]["id"] for p in r2.json())


def test_put_slides_and_get(client):
    created = client.post("/api/projects", json={"title": "P", "raw_notes": ""}).json()
    pid = created["project"]["id"]
    payload = {
        "slides": [
            {
                "id": "s1",
                "position": 0,
                "layout": "title",
                "title": "Hello",
                "body": {"subtitle": "World"},
            },
            {
                "id": "s2",
                "position": 1,
                "layout": "bullets",
                "title": "Points",
                "body": {"bullets": ["a", "b"]},
            },
        ]
    }
    r = client.put(f"/api/projects/{pid}/slides", json=payload)
    assert r.status_code == 200
    assert len(r.json()["slides"]) == 2

    got = client.get(f"/api/projects/{pid}").json()
    assert got["slides"][0]["title"] == "Hello"
    assert got["slides"][1]["body"]["bullets"] == ["a", "b"]


def test_delete_project(client):
    pid = client.post("/api/projects", json={"title": "X"}).json()["project"]["id"]
    assert client.delete(f"/api/projects/{pid}").status_code == 204
    assert client.get(f"/api/projects/{pid}").status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
PYTHONPATH=. pytest tests/test_projects.py -v
```

Expected: FAIL (404 / missing routes)

- [ ] **Step 3: Implement schemas + router**

`backend/app/schemas.py` — define:

```python
from typing import Any, Literal
from pydantic import BaseModel, Field

Layout = Literal["title", "section", "bullets", "two_column"]

class SlideIn(BaseModel):
    id: str | None = None
    position: int
    layout: Layout
    title: str = ""
    body: dict[str, Any] = Field(default_factory=dict)

class SlideOut(BaseModel):
    id: str
    project_id: str
    position: int
    layout: Layout
    title: str
    body: dict[str, Any]

class ProjectOut(BaseModel):
    id: str
    title: str
    raw_notes: str
    created_at: str
    updated_at: str

class ProjectListItem(BaseModel):
    id: str
    title: str
    updated_at: str

class ProjectCreate(BaseModel):
    title: str = "Untitled"
    raw_notes: str = ""

class ProjectPatch(BaseModel):
    title: str | None = None

class ProjectDetail(BaseModel):
    project: ProjectOut
    slides: list[SlideOut]

class SlidesReplace(BaseModel):
    slides: list[SlideIn]

class StructureRequest(BaseModel):
    title: str | None = None
    raw_notes: str

class StructureLLMResult(BaseModel):
    title: str
    slides: list[SlideIn]
```

`backend/app/routers/projects.py` — implement with `uuid.uuid4()`, ISO timestamps (`datetime.now(timezone.utc).isoformat()`), JSON `body` stored as text, parse on read. On PUT slides: delete existing for project then insert in order (or replace transactionally). Unknown project → 404. DELETE → 204.

Mount in `main.py`:

```python
from app.routers import projects
app.include_router(projects.router, prefix="/api")
```

Router prefix inside file: `APIRouter(prefix="/projects", tags=["projects"])`.

- [ ] **Step 4: Run tests — pass**

```bash
PYTHONPATH=. pytest tests/test_projects.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_projects.py
git commit -m "$(cat <<'EOF'
feat: add project and slides CRUD API

EOF
)"
```

---

### Task 3: LLM structure service + `POST /api/structure`

**Files:**
- Create: `backend/app/services/__init__.py`, `backend/app/services/llm.py`
- Create: `backend/app/routers/structure.py`
- Create: `backend/tests/test_structure.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_structure.py`

**Interfaces:**
- Consumes: `StructureRequest`, `get_settings()`, projects insert helpers
- Produces: `structure_notes(raw_notes: str, title: str | None) -> StructureLLMResult`; `POST /api/structure` → `ProjectDetail`

- [ ] **Step 1: Write tests with mocked httpx**

`backend/tests/test_structure.py`:

```python
import json
from unittest.mock import patch, MagicMock

FAKE_LLM = {
    "title": "AI Summit Notes",
    "slides": [
        {"position": 0, "layout": "title", "title": "AI Summit", "body": {"subtitle": "Notes"}},
        {
            "position": 1,
            "layout": "section",
            "title": "Education",
            "body": {"subtitle": ""},
        },
        {
            "position": 2,
            "layout": "bullets",
            "title": "Teaching quality",
            "body": {"bullets": ["Benchmark undergrad quality", "People over assets"]},
        },
    ],
}


def test_structure_creates_project(client):
    fake_resp = MagicMock()
    fake_resp.status_code = 200
    fake_resp.raise_for_status = MagicMock()
    fake_resp.json.return_value = {
        "choices": [{"message": {"content": json.dumps(FAKE_LLM)}}]
    }

    with patch("app.services.llm.httpx.Client") as Client:
        Client.return_value.__enter__.return_value.post.return_value = fake_resp
        r = client.post(
            "/api/structure",
            json={"raw_notes": "人工非常重要... 提升教学质量"},
        )
    assert r.status_code == 201
    data = r.json()
    assert data["project"]["title"] == "AI Summit Notes"
    assert len(data["slides"]) == 3
    assert data["slides"][2]["body"]["bullets"][0].startswith("Benchmark")


def test_structure_missing_key(client, monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("LLM_API_KEY", "")
    get_settings.cache_clear()
    # Re-import path: patch settings on module
    with patch("app.services.llm.get_settings") as gs:
        gs.return_value.llm_api_key = ""
        gs.return_value.llm_base_url = "https://example.com/v1"
        gs.return_value.llm_model = "m"
        r = client.post("/api/structure", json={"raw_notes": "x"})
    assert r.status_code == 503
    assert "detail" in r.json()
```

- [ ] **Step 2: Run — expect fail**

```bash
PYTHONPATH=. pytest tests/test_structure.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement `llm.py` + router**

`structure_notes` must:

1. If `llm_api_key` empty → raise HTTPException 503 `"LLM_API_KEY is not configured"`
2. POST `{base}/chat/completions` with system+user prompt (JSON-only slides; layouts whitelist; no invented facts; cover → sections → bullets)
3. Strip optional markdown fences; `json.loads`
4. Normalize: assign positions 0..n-1; unknown layout → `bullets` with `{"bullets":[]}` or coerce content; ensure `body` is dict
5. Return `StructureLLMResult`

`POST /api/structure`: call LLM → insert project + slides → return 201 `ProjectDetail`. LLM HTTP errors → 502 with safe detail.

Include router at `/api` without nesting under projects:

```python
app.include_router(structure.router, prefix="/api")
```

- [ ] **Step 4: Run tests — pass**

```bash
PYTHONPATH=. pytest tests/test_structure.py tests/test_projects.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services backend/app/routers/structure.py backend/tests/test_structure.py backend/app/main.py
git commit -m "$(cat <<'EOF'
feat: add LLM structure endpoint for meeting notes

EOF
)"
```

---

### Task 4: PPTX export

**Files:**
- Create: `backend/app/services/pptx_export.py`, `backend/app/routers/export.py`
- Create: `backend/tests/test_export.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_export.py`

**Interfaces:**
- Consumes: project slides from DB
- Produces: `build_pptx(title: str, slides: list[SlideOut]) -> bytes`; `POST /api/projects/{id}/export`

- [ ] **Step 1: Write export test**

```python
def test_export_pptx(client):
    pid = client.post("/api/projects", json={"title": "Export Me"}).json()["project"]["id"]
    client.put(
        f"/api/projects/{pid}/slides",
        json={
            "slides": [
                {"id": "a", "position": 0, "layout": "title", "title": "T", "body": {"subtitle": "S"}},
                {
                    "id": "b",
                    "position": 1,
                    "layout": "bullets",
                    "title": "B",
                    "body": {"bullets": ["one", "two"]},
                },
                {
                    "id": "c",
                    "position": 2,
                    "layout": "two_column",
                    "title": "C",
                    "body": {
                        "left_title": "L",
                        "right_title": "R",
                        "left": ["l1"],
                        "right": ["r1"],
                    },
                },
            ]
        },
    )
    r = client.post(f"/api/projects/{pid}/export")
    assert r.status_code == 200
    assert (
        r.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
    assert r.content[:2] == b"PK"  # zip/pptx
```

- [ ] **Step 2: Run — expect fail**

```bash
PYTHONPATH=. pytest tests/test_export.py -v
```

- [ ] **Step 3: Implement exporter**

For each layout use blank layout + textboxes:

- `title`: centered title + subtitle  
- `section`: large title  
- `bullets`: title + bullet paragraphs  
- `two_column`: title + two columns of bullets  

Return `StreamingResponse` / `Response` with `Content-Disposition: attachment; filename="...."`. Sanitize filename from project title.

- [ ] **Step 4: Tests pass + commit**

```bash
PYTHONPATH=. pytest tests/ -v
git add backend/app/services/pptx_export.py backend/app/routers/export.py backend/tests/test_export.py backend/app/main.py
git commit -m "$(cat <<'EOF'
feat: export projects to pptx

EOF
)"
```

---

### Task 5: Frontend scaffold + List + New

**Files:**
- Create: `frontend/` via Vite React-TS template
- Create: `frontend/src/types.ts`, `frontend/src/api/client.ts`
- Create: `frontend/src/pages/ListPage.tsx`, `frontend/src/pages/NewPage.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/vite.config.ts`
- Manual test: browser / curl via UI

**Interfaces:**
- Consumes: `GET /api/projects`, `POST /api/structure`
- Produces: routes `/`, `/new`

- [ ] **Step 1: Scaffold Vite app**

```bash
cd /Users/bob/Workspace/slide-maker
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install && npm install react-router-dom
```

`vite.config.ts` proxy:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000" },
  },
});
```

- [ ] **Step 2: Types + API client**

`frontend/src/types.ts` — mirror `ProjectOut`, `SlideOut`, `ProjectDetail`, `Layout`.

`frontend/src/api/client.ts`:

```ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail ?? detail;
    } catch { /* ignore */ }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listProjects: () => request<{ id: string; title: string; updated_at: string }[]>("/api/projects"),
  getProject: (id: string) => request<import("../types").ProjectDetail>(`/api/projects/${id}`),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  structure: (body: { title?: string; raw_notes: string }) =>
    request<import("../types").ProjectDetail>("/api/structure", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  putSlides: (id: string, slides: import("../types").SlideIn[]) =>
    request<import("../types").ProjectDetail>(`/api/projects/${id}/slides`, {
      method: "PUT",
      body: JSON.stringify({ slides }),
    }),
  patchProject: (id: string, title: string) =>
    request<import("../types").ProjectDetail>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
};
```

- [ ] **Step 3: Pages + router**

`App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ListPage from "./pages/ListPage";
import NewPage from "./pages/NewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

`ListPage`: load list, link to `/new`, each row → `/projects/:id` (placeholder ok until Task 6), delete button.

`NewPage`: textarea + optional title + submit → `api.structure` → `navigate(/projects/${id})`; show loading and error.

Keep CSS simple, readable, not purple-gradient AI slop — neutral light UI.

- [ ] **Step 4: Manual smoke**

```bash
# terminal 1
cd backend && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --reload --port 8000
# terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173` — list loads; `/new` form renders.

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "$(cat <<'EOF'
feat: add React frontend with list and new project pages

EOF
)"
```

---

### Task 6: Edit page (slides CRUD UX)

**Files:**
- Create: `frontend/src/pages/EditPage.tsx`
- Create: `frontend/src/components/SlideSidebar.tsx`, `SlideEditor.tsx`
- Modify: `frontend/src/App.tsx`
- Manual test

**Interfaces:**
- Consumes: `getProject`, `putSlides`, `patchProject`
- Produces: `/projects/:id` editor

- [ ] **Step 1: Wire route**

```tsx
<Route path="/projects/:id" element={<EditPage />} />
```

- [ ] **Step 2: Implement EditPage**

Behavior:

- Load project by `:id`
- Editable project title (blur/save → patch)
- Sidebar: list slides by position; buttons 上移 / 下移 / 删除 / 新增
- Main: edit `layout` select, `title`, body fields by layout (`subtitle` or bullets textarea one-per-line, or two_column fields)
- Save → `putSlides` with full array (generate client UUIDs for new slides via `crypto.randomUUID()`)
- Links: 预览 → `/projects/:id/preview`; 导出 button can wait until Task 7 or call blob download early

- [ ] **Step 3: Manual test** — reorder, save, refresh, data persists

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "$(cat <<'EOF'
feat: add slide outline editor

EOF
)"
```

---

### Task 7: Preview + export download

**Files:**
- Create: `frontend/src/pages/PreviewPage.tsx`, `frontend/src/components/SlideCanvas.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/api/client.ts`, EditPage export button
- Manual test

**Interfaces:**
- Consumes: `POST /api/projects/{id}/export`
- Produces: preview route + file download

- [ ] **Step 1: Add export helper**

```ts
export async function downloadPptx(projectId: string, filename: string) {
  const res = await fetch(`/api/projects/${projectId}/export`, { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.detail || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: SlideCanvas + PreviewPage**

Render 16:9 cards: title/section/bullets/two_column visually close to export. Prev/next or vertical stack. Buttons: 返回编辑、导出 PPT.

- [ ] **Step 3: Manual E2E with sample notes**

Paste meeting notes from the original user message (education / physical AI / etc.) with real `LLM_API_KEY` in `backend/.env`. Verify structure → edit → preview → open PPTX in Keynote/PowerPoint.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "$(cat <<'EOF'
feat: add slide preview and pptx download

EOF
)"
```

---

### Task 8: README polish + sample fixture

**Files:**
- Modify: `README.md`
- Create: `fixtures/sample-meeting-notes.md` (paste sanitized version of user notes)
- Modify: `.env.example` already present

- [ ] **Step 1: Write README**

Include: prerequisites, copy `.env.example` → `.env`, start backend, start frontend, how to structure notes, layout types, link to design doc.

- [ ] **Step 2: Add fixture file** with the meeting summary text for repeatable manual QA.

- [ ] **Step 3: Run full backend test suite**

```bash
cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/ -v
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add README.md fixtures
git commit -m "$(cat <<'EOF'
docs: add run guide and sample meeting notes fixture

EOF
)"
```

---

## Spec Coverage Checklist

| Spec section | Task |
|--------------|------|
| Vite + React Router SPA | 5–7 |
| FastAPI + SQLite | 1–2 |
| `.env` LLM config | 1, 3 |
| Routes `/` `/new` `/projects/:id` `/preview` | 5–7 |
| Layouts title/section/bullets/two_column | 2–4, 6–7 |
| CRUD + PUT slides | 2, 6 |
| `POST /api/structure` | 3 |
| python-pptx export | 4, 7 |
| Sample notes acceptance | 7–8 |
| No auth / no Next.js | Global |

## Self-Review Notes

- Structure path is `/api/structure` (avoids `{id}` clash) — matches updated spec.
- TDD on backend; frontend verified by manual smoke (no Jest required for v1).
- Commit steps assume repo already `git init` in Task 1; do not commit `.env`.
