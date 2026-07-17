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
