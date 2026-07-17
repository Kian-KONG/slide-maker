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
    assert "attachment" in r.headers.get("content-disposition", "")
    assert "Export_Me.pptx" in r.headers.get("content-disposition", "") or "Export Me.pptx" in r.headers.get(
        "content-disposition", ""
    )


def test_export_missing_project(client):
    r = client.post("/api/projects/nonexistent-id/export")
    assert r.status_code == 404
