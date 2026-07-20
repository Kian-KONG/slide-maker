# Slide Maker — common developer tasks
#
#   make install   # one-shot deps
#   make start     # one-shot run (API + UI)

ROOT        := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BACKEND     := $(ROOT)/backend
FRONTEND    := $(ROOT)/frontend
SCRIPTS     := $(ROOT)/scripts
VENV_PY     := $(BACKEND)/.venv/bin/python
VENV_PIP    := $(BACKEND)/.venv/bin/pip
UVICORN     := $(BACKEND)/.venv/bin/uvicorn
PYTEST      := $(BACKEND)/.venv/bin/pytest

.DEFAULT_GOAL := help

.PHONY: help install install-backend install-frontend \
	start stop backend frontend test lint build \
	decks deck-frontier deck-themes clean clean-frontend

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Quick path:  make install && make start"
	@echo "App: http://localhost:5173   API: http://localhost:8000/api/health"

install: install-backend install-frontend ## Install all dependencies (backend + frontend)

install-backend: ## Create venv and pip install backend
	cd $(BACKEND) && python3 -m venv .venv
	$(VENV_PIP) install -r $(BACKEND)/requirements.txt
	@test -f $(BACKEND)/.env || cp $(BACKEND)/.env.example $(BACKEND)/.env
	@echo "Backend ready. Edit backend/.env if needed (LLM_API_KEY)."

install-frontend: ## npm install frontend
	cd $(FRONTEND) && npm install

start: ## Start backend + frontend together
	@echo "Starting API :8000 and UI :5173 …"
	@echo "Open http://localhost:5173  (Ctrl-C stops both)"
	@$(MAKE) -j2 backend frontend

backend: ## Run FastAPI with reload on :8000
	cd $(BACKEND) && $(UVICORN) app.main:app --reload --port 8000

frontend: ## Run Vite dev server on :5173
	cd $(FRONTEND) && npm run dev

test: ## Run backend pytest suite
	cd $(BACKEND) && PYTHONPATH=. $(PYTEST) tests/ -v

lint: ## Lint frontend (oxlint)
	cd $(FRONTEND) && npm run lint

build: ## Build frontend for production
	cd $(FRONTEND) && npm run build

decks: deck-frontier deck-themes ## Rebuild content HTML decks

deck-frontier: ## Build 前沿生态 HTML deck
	cd $(SCRIPTS) && PYTHONPATH=$(BACKEND) $(VENV_PY) build_frontier_deck.py

deck-themes: ## Build 世界模型与前沿议题 HTML deck
	cd $(SCRIPTS) && PYTHONPATH=$(BACKEND) $(VENV_PY) build_themes_deck.py

clean: clean-frontend ## Remove frontend build artifacts
	@echo "Done."

clean-frontend: ## Remove frontend/dist
	rm -rf $(FRONTEND)/dist
