# Task 4 Report: PPTX export

**Status:** complete

**Commits:**
- `feat: export projects to pptx` (on `feat/slide-maker`)

**Tests:**
- `PYTHONPATH=. pytest tests/ -v` → **8 passed**
- Covered: export PPTX (title/bullets/two_column), content-type, ZIP magic, Content-Disposition, 404 missing project

**Files:**
- Created: `backend/app/services/pptx_export.py`, `backend/app/routers/export.py`, `backend/tests/test_export.py`
- Modified: `backend/app/main.py`

**Concerns:**
- `section` layout is implemented but not asserted in the sample export test
- Filename sanitization replaces Windows-illegal chars only; spaces kept (`Export Me.pptx`)
- Relies on default template blank layout index `6`

---

## Review fix: real OOXML bullets

**Finding:** `pptx_export.py` wrote plain paragraphs for `bullets` / `two_column` without `a:buFont` / `a:buChar`.

**Fix:** Added `_apply_bullet()` that sets paragraph XML `a:buFont` + `a:buChar` (•). Applied in `_render_bullets` and both columns via `_column`. Export test now unzips slide XML and asserts `buChar` count ≥ 4.

**Commit:** `4358f05` — `fix: apply real bullets in pptx export`

**Test command:**
```bash
cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/test_export.py tests/ -v
```

**Test output:**
```
============================= test session starts ==============================
platform darwin -- Python 3.13.3, pytest-9.1.1, pluggy-1.6.0 -- /Users/bob/Workspace/slide-maker/backend/.venv/bin/python3
cachedir: .pytest_cache
rootdir: /Users/bob/Workspace/slide-maker/backend
plugins: anyio-4.14.2
collecting ... collected 8 items

tests/test_export.py::test_export_pptx PASSED                            [ 12%]
tests/test_export.py::test_export_missing_project PASSED                 [ 25%]
tests/test_health.py::test_health PASSED                                 [ 37%]
tests/test_projects.py::test_create_and_list_project PASSED              [ 50%]
tests/test_projects.py::test_put_slides_and_get PASSED                   [ 62%]
tests/test_projects.py::test_delete_project PASSED                       [ 75%]
tests/test_structure.py::test_structure_creates_project PASSED           [ 87%]
tests/test_structure.py::test_structure_missing_key PASSED               [100%]

======================== 8 passed, 3 warnings in 0.21s =========================
```
