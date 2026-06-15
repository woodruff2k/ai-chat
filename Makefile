.PHONY: init dev stop logs build deploy-backend deploy-frontend deploy

-include .env

BACKEND_DIR  := backend
FRONTEND_DIR := frontend

REGION       := asia-northeast3
REGISTRY     := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/ai-chat
BACKEND_URL  := https://ai-chat-backend-370670066576.$(REGION).run.app
FRONTEND_URL := https://ai-chat-frontend-370670066576.$(REGION).run.app

# ── 초기 설정 ────────────────────────────────────────────────
init:
	@echo "▶ Backend: installing dependencies..."
	cd $(BACKEND_DIR) && uv sync
	@echo "▶ Frontend: installing dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "✓ Init complete"

# ── 로컬 개발 ────────────────────────────────────────────────
dev:
	@echo "▶ Starting backend on :8000 and frontend on :3000..."
	@cd $(BACKEND_DIR) && .venv/bin/uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 & echo "Backend PID: $$!"
	@cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev > /tmp/frontend.log 2>&1 & echo "Frontend PID: $$!"
	@echo "✓ Dev servers started. Run 'make logs' to tail output."

stop:
	@pkill -f "uvicorn main:app" 2>/dev/null && echo "✓ Backend stopped" || echo "Backend was not running"
	@pkill -f "next dev"         2>/dev/null && echo "✓ Frontend stopped" || echo "Frontend was not running"

logs:
	@tail -f /tmp/backend.log /tmp/frontend.log

# ── 프로덕션 빌드 & 배포 ─────────────────────────────────────
build:
	@echo "▶ Building frontend for production..."
	cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_URL=$(BACKEND_URL) npm run build

deploy-backend: build-backend-image
	@echo "▶ Deploying backend to Cloud Run..."
	gcloud run deploy ai-chat-backend \
		--image $(REGISTRY)/backend:latest \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--memory 1Gi \
		--cpu 1 \
		--max-instances 2 \
		--concurrency 10 \
		--vpc-connector ai-chat-connector \
		--vpc-egress all-traffic \
		--set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest
	@echo "✓ Backend deployed: $(BACKEND_URL)"

deploy-frontend: build
	@echo "▶ Building and pushing frontend image..."
	docker buildx build \
		--platform linux/amd64 \
		--push \
		-f $(FRONTEND_DIR)/Dockerfile.prebuilt \
		-t $(REGISTRY)/frontend:latest \
		$(FRONTEND_DIR)
	@echo "▶ Deploying frontend to Cloud Run..."
	gcloud run deploy ai-chat-frontend \
		--image $(REGISTRY)/frontend:latest \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--memory 512Mi \
		--cpu 1 \
		--max-instances 2 \
		--port 3000
	@echo "✓ Frontend deployed: $(FRONTEND_URL)"

deploy: deploy-backend deploy-frontend

build-backend-image:
	@echo "▶ Building and pushing backend image..."
	docker buildx build \
		--platform linux/amd64 \
		--push \
		-t $(REGISTRY)/backend:latest \
		$(BACKEND_DIR)
