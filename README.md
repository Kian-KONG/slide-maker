# Slide Maker

AI-assisted slide deck builder (FastAPI + SQLite backend, React frontend coming in later tasks).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit LLM_API_KEY as needed
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health` → `{"status":"ok"}`

## Tests

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```
