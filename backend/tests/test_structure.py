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
