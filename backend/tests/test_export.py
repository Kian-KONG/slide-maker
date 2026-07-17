def test_export_pptx(client):
    import zipfile
    from io import BytesIO

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

    # bullets + two_column body paragraphs must carry real OOXML bullet markers
    with zipfile.ZipFile(BytesIO(r.content)) as zf:
        slide_xml = "\n".join(
            zf.read(name).decode("utf-8")
            for name in sorted(zf.namelist())
            if name.startswith("ppt/slides/slide") and name.endswith(".xml")
        )
    assert "<a:buFont" in slide_xml
    assert "<a:buChar" in slide_xml
    assert slide_xml.count("<a:buChar") >= 4  # 2 bullets + 1 left + 1 right


def test_export_missing_project(client):
    r = client.post("/api/projects/nonexistent-id/export")
    assert r.status_code == 404
