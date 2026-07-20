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

