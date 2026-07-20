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

