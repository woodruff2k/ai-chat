# AI Character Chat — TODO

## 0. Git 설정

- [x] `git init`
- [x] `.gitignore` 작성
  - [x] `frontend/` — `.next/`, `node_modules/`, `.env.local`
  - [x] `backend/` — `__pycache__/`, `.venv/`, `.env`
  - [x] 공통 — `.DS_Store`, `*.log`
- [x] 초기 커밋 (`Initial commit`)
- [x] 원격 저장소 생성 및 연결 (`git remote add origin`) — https://github.com/woodruff2k/ai-chat
- [x] 브랜치 전략 설정
  - [x] `main` — 프로덕션 배포 기준
  - [x] `develop` — 개발 통합 브랜치
  - [ ] `feature/*` — 기능 단위 작업 브랜치

---

## 1. 프로젝트 초기 설정

> **주의**: 0단계(git init)를 먼저 완료한 후 진행. `create-next-app`은 `--no-git`, `uv init`은 `--no-vcs` 플래그 필수.

- [x] 모노레포 디렉터리 구조 생성 (`frontend/`, `backend/`)
- [x] `frontend/` — Next.js 15 (App Router) 프로젝트 초기화
- [x] `frontend/` — Tailwind CSS, shadcn/ui, Lucide React 설치 및 설정
- [x] `frontend/` — TypeScript strict 모드 설정
- [x] `backend/` — uv 설치 확인 (`pip install uv` 또는 공식 설치 스크립트)
- [x] `backend/` — uv로 가상환경 생성 (`uv venv`)
- [x] `backend/` — 가상환경 활성화 (`.venv/bin/activate`)
- [x] `backend/` — FastAPI 프로젝트 초기화 (`pyproject.toml` 작성)
- [x] `backend/` — 의존성 설치 (`uv add fastapi uvicorn langgraph langchain-anthropic motor python-dotenv`)
- [x] `backend/` — 개발 의존성 설치 (`uv add --dev ruff`)
- [x] `backend/` — ruff 린터 설정 (`pyproject.toml`에 ruff 설정 추가)
- [x] `.gitignore`에 `.venv/` 포함 확인
- [x] `backend/` — 환경 변수 파일 생성 (`.env.example`)
- [x] `frontend/` — 환경 변수 파일 생성 (`.env.local.example`)

---

## 2. 백엔드 — 기반 설정

- [x] FastAPI 앱 진입점 구성 (`backend/main.py`)
- [x] CORS 미들웨어 설정 (개발: `localhost:3000`, 프로덕션: Cloud Run URL)
- [x] MongoDB 연결 모듈 구현 (`backend/db/mongo.py`)
- [x] `conversations` 컬렉션 인덱스 생성
  - [x] `session_id` unique 인덱스
  - [x] `updated_at` TTL 인덱스 (24시간)

---

## 3. 백엔드 — 캐릭터

- [x] 더미 캐릭터 데이터 작성 (`backend/data/characters.json`)
- [x] 캐릭터 Pydantic 모델 정의 (`backend/models/character.py`)
- [x] `GET /characters` 엔드포인트 구현 (`backend/routers/characters.py`)

---

## 4. 백엔드 — LangGraph 에이전트

- [x] LangGraph, langchain-anthropic 패키지 설치
- [x] `MessagesState` 기반 그래프 상태 정의 (`backend/graph/agent.py`)
- [x] `character_prompt_injection` 노드 구현 — 캐릭터 시스템 프롬프트 주입
- [x] `llm_call` 노드 구현 — Claude claude-sonnet-4-6 호출
- [x] 그래프 컴파일 (`[START] → character_prompt_injection → llm_call → [END]`)
- [x] `.astream_events()` 기반 토큰 스트리밍 검증

---

## 5. 백엔드 — 대화 API

- [x] 메시지 Pydantic 모델 정의 (`backend/models/message.py`)
- [x] `POST /chat/stream` 엔드포인트 구현 (`backend/routers/chat.py`)
  - [x] MongoDB에서 `session_id`로 기존 대화 기록 로드
  - [x] LangGraph 그래프 실행 (대화 기록 주입)
  - [x] SSE 포맷으로 토큰 스트리밍 (`{"type": "token", "content": "..."}`)
  - [x] 응답 완료 후 MongoDB에 대화 기록 저장 (`{"type": "done"}`)
- [x] 에러 처리 구현
  - [x] Claude API 오류 → `{"type": "error", "code": "llm_error"}` 전송
  - [x] LangGraph 오류 → `{"type": "error", "code": "graph_error"}` 전송
  - [x] 존재하지 않는 `character_id` → 400 응답
  - [x] 에러 응답에 내부 정보 미포함 확인

---

## 6. 프론트엔드 — 공통

- [x] 비즈니스 스타일 테마 설정 (Tailwind 컬러 팔레트: Slate 계열 + Blue Accent)
- [x] 전역 레이아웃 구성 (`app/layout.tsx`)
- [x] 백엔드 API 클라이언트 구현 (`frontend/lib/api.ts`)
  - [x] `GET /characters` 호출 함수
  - [x] `POST /chat/stream` SSE 스트리밍 함수 (Next.js API Route 미경유)
- [x] `session_id` 관리 유틸리티 (sessionStorage UUID 생성/조회)

---

## 7. 프론트엔드 — 캐릭터 선택 화면

- [x] `CharacterCard` 컴포넌트 구현
  - [x] 프로필 이미지, 이름, 설명, 태그 뱃지 표시
  - [x] 호버 시 테두리 강조 효과
- [x] 캐릭터 목록 그리드 레이아웃 구현 (`app/page.tsx`)
  - [x] 반응형: 모바일 1열 → 태블릿 2열 → 데스크톱 3~4열
- [x] 캐릭터 로딩 실패 시 에러 상태 UI 표시

---

## 8. 프론트엔드 — 대화 화면

- [x] `ChatWindow` 컴포넌트 구현 (`app/chat/[characterId]/page.tsx`)
  - [x] 헤더: 캐릭터 아바타 + 이름 표시
  - [x] 반응형: 모바일 전체 너비 / 데스크톱 `max-w-2xl` 중앙 정렬
- [x] `MessageBubble` 컴포넌트 구현
  - [x] 사용자 메시지: Blue Accent 버블
  - [x] AI 응답: Slate 700 버블
  - [x] 타이핑 애니메이션 (스트리밍 토큰 순차 표시)
- [x] 메시지 입력창 구현
  - [x] 하단 고정 레이아웃
  - [x] 모바일 소프트 키보드 대응 (`dvh` 단위)
  - [x] 터치 타겟 최소 44×44px
- [x] SSE 스트리밍 수신 및 렌더링 구현 (`ReadableStream`)
- [x] 에러 처리 UI
  - [x] 에러 수신 시 한국어 안내 메시지 표시
  - [x] 네트워크 오류 처리

---

## 9. Docker 설정

- [x] `backend/Dockerfile` 작성
- [x] `frontend/Dockerfile` 작성 (`NEXT_PUBLIC_API_URL` 빌드 인자 포함)
- [x] 로컬에서 Docker 빌드 동작 확인

---

## 10. Google Cloud 배포

- [ ] GCP 프로젝트 설정 및 Artifact Registry 생성
- [ ] Secret Manager에 `ANTHROPIC_API_KEY`, `MONGODB_URI` 등록
- [ ] 백엔드 이미지 빌드 & Artifact Registry 푸시
- [ ] 백엔드 Cloud Run 배포 및 URL 확인
- [ ] 프론트엔드 이미지 빌드 (`NEXT_PUBLIC_API_URL` 주입) & 푸시
- [ ] 프론트엔드 Cloud Run 배포
- [ ] 백엔드 CORS 설정에 프론트엔드 Cloud Run URL 추가 후 재배포
- [ ] MongoDB Atlas 네트워크 접근 설정 (Cloud Run IP 허용)

---

## 11. 최종 검증

- [x] 캐릭터 선택 → 대화 화면 진입 동작 확인
- [x] 스트리밍 응답 실시간 표시 확인
- [x] 탭 닫기 후 재접속 시 새 세션 시작 확인
- [x] MongoDB TTL 인덱스 동작 확인
- [x] 모바일 반응형 레이아웃 확인
- [x] 에러 상황(API 오류, 네트워크 오류) 동작 확인
