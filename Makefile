# Slide Maker — common developer tasks
#
#   make install   # one-shot deps
#   make start     # one-shot run (API + UI)

ROOT        := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
SERVER      := $(ROOT)/server
FRONTEND    := $(ROOT)/frontend

.DEFAULT_GOAL := help

.PHONY: help install install-server install-frontend \
	start stop server frontend test lint build typecheck clean clean-frontend

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Quick path:  make install && make start"
	@echo "App: http://localhost:5173   API: http://localhost:8000/api/health"

install: install-server install-frontend ## Install all dependencies (server + frontend)

install-server: ## npm install API server
	cd $(SERVER) && npm install
	@test -f $(SERVER)/.env || cp $(SERVER)/.env.example $(SERVER)/.env
	@echo "Server ready. Edit server/.env if needed (LLM_API_KEY)."

install-frontend: ## npm install frontend
	cd $(FRONTEND) && npm install

start: ## Start server + frontend together
	@echo "Starting API :8000 and UI :5173 …"
	@echo "Open http://localhost:5173  (Ctrl-C stops both)"
	@$(MAKE) -j2 server frontend

server: ## Run Fastify API with reload on :8000
	cd $(SERVER) && npm run dev

frontend: ## Run Vite dev server on :5173
	cd $(FRONTEND) && npm run dev

test: ## Run server tests
	cd $(SERVER) && npm test

typecheck: ## Typecheck server + frontend
	cd $(SERVER) && npm run typecheck
	cd $(FRONTEND) && npx tsc -b --noEmit

lint: ## Lint frontend (oxlint)
	cd $(FRONTEND) && npm run lint

build: ## Build frontend for production
	cd $(FRONTEND) && npm run build

clean: clean-frontend ## Remove frontend build artifacts
	@echo "Done."

clean-frontend: ## Remove frontend/dist
	rm -rf $(FRONTEND)/dist
