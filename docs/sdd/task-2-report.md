# Task 2 Report: Schemas + projects CRUD + slides PUT

## Status

**DONE** — TDD complete; all backend tests passing; committed on `feat/slide-maker`.

## What was implemented

### Files created
- `backend/app/schemas.py` — Pydantic models per brief (`SlideIn`/`SlideOut`, `ProjectOut`/`ProjectListItem`/`ProjectCreate`/`ProjectPatch`/`ProjectDetail`, `SlidesReplace`, `StructureRequest`/`StructureLLMResult`)
- `backend/app/routers/__init__.py`
- `backend/app/routers/projects.py` — REST router (`APIRouter(prefix="/projects")`)
- `backend/tests/test_projects.py` — exact test cases from brief

### Files modified
- `backend/app/main.py` — `app.include_router(projects.router, prefix="/api")`

### Endpoints
| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/projects` | 200 | `ProjectListItem[]` |
| POST | `/api/projects` | 201 | `ProjectDetail` |
| GET | `/api/projects/{id}` | 200 / 404 | `ProjectDetail` |
| PATCH | `/api/projects/{id}` | 200 / 404 | `ProjectDetail` (title only) |
| DELETE | `/api/projects/{id}` | 204 / 404 | empty |
| PUT | `/api/projects/{id}/slides` | 200 / 404 | `ProjectDetail` (replace-all) |

### Implementation notes
- IDs via `uuid.uuid4()`; timestamps via `datetime.now(timezone.utc).isoformat()`
- Slide `body` stored as JSON text; parsed to `dict` on read
- PUT slides: delete existing rows for project, then insert payload slides in order; updates `projects.updated_at`
- Unknown project → `HTTPException(404, detail="Project not found")` → `{"detail": "..."}`
- Layouts constrained to `title | section | bullets | two_column`

## TDD steps followed

1. Wrote failing tests (exact brief cases) → 404 / missing routes
2. Implemented schemas + router + mount
3. Re-ran `tests/test_projects.py` → PASS
4. Ran full suite `tests/` → PASS
5. Committed as specified

## Test results

```
tests/test_health.py::test_health PASSED
tests/test_projects.py::test_create_and_list_project PASSED
tests/test_projects.py::test_put_slides_and_get PASSED
tests/test_projects.py::test_delete_project PASSED
```

**4 passed** (full backend suite).

## Commit

- Hash: `f3bd753`
- Message: `feat: add project and slides CRUD API`
- Branch: `feat/slide-maker`
- Not pushed

## Concerns / follow-ups

- PATCH is implemented but not covered by the brief’s three tests; only create/list/get/put-slides/delete are asserted.
- `on_event("startup")` deprecation warning remains from Task 1 (lifespan migration deferred).
- SQLite FK cascade is enabled via PRAGMA; delete still explicitly removes slides then project for clarity.
- No dedicated test for invalid layout (422) or PUT on missing project (404).
