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

