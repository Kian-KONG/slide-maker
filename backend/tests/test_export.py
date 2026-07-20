def test_export_html(client):
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
    assert "text/html" in r.headers["content-type"]
    html = r.content.decode("utf-8")
    assert "<!DOCTYPE html>" in html
    assert "Export Me" in html
    assert "one" in html and "two" in html
    assert "l1" in html and "r1" in html
    assert "attachment" in r.headers.get("content-disposition", "")
    assert ".html" in r.headers.get("content-disposition", "")


def test_export_missing_project(client):
    r = client.post("/api/projects/nonexistent-id/export")
    assert r.status_code == 404


def test_export_utf8_filename(client):
    pid = client.post("/api/projects", json={"title": "前沿生态"}).json()["project"]["id"]
    client.put(
        f"/api/projects/{pid}/slides",
        json={
            "slides": [
                {
                    "id": "utf8-a",
                    "position": 0,
                    "layout": "title",
                    "title": "T",
                    "body": {"subtitle": ""},
                },
            ]
        },
    )
    r = client.post(f"/api/projects/{pid}/export")
    assert r.status_code == 200
    cd = r.headers.get("content-disposition", "")
    assert "filename*=" in cd
    assert "UTF-8''" in cd
    assert "%E5%89%8D%E6%B2%BF%E7%94%9F%E6%80%81" in cd
    assert r.content.decode("utf-8").startswith("<!DOCTYPE html>")
