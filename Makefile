# Slide Maker — common developer tasks
#
#   make install   # one-shot deps
#   make start     # one-shot run (API + UI)

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
API  := $(ROOT)/apps/api
WEB  := $(ROOT)/apps/web

.DEFAULT_GOAL := help

.PHONY: help install start stop api web server frontend test lint build typecheck clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Quick path:  make install && make start"
	@echo "App: http://localhost:5173   API: http://localhost:8000/api/health"

install: ## Install workspace deps (apps/api + apps/web)
	cd $(ROOT) && npm install
	@test -f $(API)/.env || cp $(API)/.env.example $(API)/.env
	@echo "Ready. Edit apps/api/.env if needed (LLM_API_KEY)."

start: ## Start API + web together
	@echo "Starting API :8000 and UI :5173 …"
	@echo "Open http://localhost:5173  (Ctrl-C stops both)"
	@$(MAKE) -j2 api web

api: ## Run Fastify API with reload on :8000
	cd $(ROOT) && npm run dev:api

web: ## Run Vite dev server on :5173
	cd $(ROOT) && npm run dev:web

server: api ## Alias for api
frontend: web ## Alias for web

test: ## Run API tests
	cd $(ROOT) && npm test

typecheck: ## Typecheck api + web
	cd $(ROOT) && npm run typecheck

lint: ## Lint web (oxlint)
	cd $(ROOT) && npm run lint

build: ## Build web for production
	cd $(ROOT) && npm run build

clean: ## Remove web build artifacts
	rm -rf $(WEB)/dist
	@echo "Done."
