import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Isolate DB before app import side effects
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_PATH"] = _tmp.name
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("LLM_BASE_URL", "https://example.com/v1")
os.environ.setdefault("LLM_MODEL", "test-model")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")


@pytest.fixture()
def client():
    from app.main import app
    from app.db import init_db

    init_db()
    with TestClient(app) as c:
        yield c
