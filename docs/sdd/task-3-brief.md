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

