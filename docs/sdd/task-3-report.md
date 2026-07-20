# Task 3 Report: LLM structure service + POST /api/structure

## Status

**PASS** — implemented and committed on `feat/slide-maker`.

## What shipped

- `backend/app/services/llm.py` — `structure_notes()` via OpenAI-compatible `httpx` chat completions; empty key → 503; HTTP/parse failures → 502 (safe detail); layout whitelist + body normalize; markdown fence strip
- `backend/app/routers/structure.py` — `POST /api/structure` → LLM → insert project + UUID slides → 201 `ProjectDetail` (reuses `_now` / `_project_detail` from projects router)
- `backend/app/main.py` — mounts structure router at `/api` (not under `/projects`)
- `backend/tests/test_structure.py` — mocked httpx success + missing key

## Commits

- `6e6cac7` — `feat: add LLM structure endpoint for meeting notes`

## Tests

```bash
cd backend && PYTHONPATH=. python -m pytest tests/ -v
```

**6 passed** (`test_structure` ×2, `test_projects` ×3, `test_health` ×1)

## TDD

1. Wrote `test_structure.py` first
2. Confirmed RED (missing `app.services`)
3. Implemented service + router
4. Confirmed GREEN (full suite)

## Concerns

- Structure router imports private helpers (`_now`, `_project_detail`) from `projects.py` — fine for now; consider extracting shared DB helpers if more routers need them
- No dedicated unit test for 502 / invalid JSON / unknown-layout coercion (covered by implementation, not asserted in suite)
- `on_event("startup")` deprecation warning remains (pre-existing)
