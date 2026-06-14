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

- [x] GCP 프로젝트 설정 및 Artifact Registry 생성
- [x] Secret Manager에 `ANTHROPIC_API_KEY`, `MONGODB_URI` 등록
- [x] 백엔드 이미지 빌드 & Artifact Registry 푸시
- [x] 백엔드 Cloud Run 배포 및 URL 확인 — https://ai-chat-backend-370670066576.asia-northeast3.run.app
- [x] 프론트엔드 이미지 빌드 (`NEXT_PUBLIC_API_URL` 주입) & 푸시
- [x] 프론트엔드 Cloud Run 배포 — https://ai-chat-frontend-370670066576.asia-northeast3.run.app
- [x] 백엔드 CORS 설정에 프론트엔드 Cloud Run URL 추가 후 재배포
- [x] MongoDB Atlas 네트워크 접근 설정 (Cloud Run 고정 NAT IP `8.230.9.66` 허용)

---

## 11. 최종 검증

- [x] 캐릭터 선택 → 대화 화면 진입 동작 확인
- [x] 스트리밍 응답 실시간 표시 확인
- [x] 탭 닫기 후 재접속 시 새 세션 시작 확인
- [x] MongoDB TTL 인덱스 동작 확인
- [x] 모바일 반응형 레이아웃 확인
- [x] 에러 상황(API 오류, 네트워크 오류) 동작 확인

---

## 12. 버그 수정 및 기능 보완

코드 리뷰에서 발견한 미구현·결함 항목. 높음 → 중간 → 낮음 순서로 작업.

### 높음 — 버그 / 사용 불가 시나리오

- [x] **`save_messages` 실패 시 스트림 비정상 종료** (`backend/routers/chat.py`)
  - 현재: `await save_messages(...)` 예외 발생 시 `{"type": "done"}` 미전송 → 클라이언트 `onDone` 미호출 → `isStreaming` 영구 `true` → 입력창 잠김
  - 수정: `save_messages` 호출을 `try/except`로 감싸고, 저장 실패 시 로그 기록 후 `done` 이벤트는 정상 전송

- [x] **스트리밍 중 컴포넌트 언마운트 cleanup 없음** (`frontend/components/ChatWindow.tsx`)
  - 현재: 채팅 중 뒤로가기 등으로 컴포넌트가 unmount되어도 SSE fetch가 백그라운드에서 계속 실행됨
  - 수정: `AbortController`를 `useEffect` cleanup에서 `abort()` 호출하도록 연결

- [x] **채팅 화면에서 뒤로가기 수단 없음** (`frontend/components/ChatWindow.tsx`)
  - 현재: 채팅 화면 헤더에 캐릭터 선택 화면(`/`)으로 돌아갈 버튼 없음
  - 수정: 헤더 좌측에 `<Link href="/">` 또는 `useRouter().back()` 버튼 추가

### 중간 — 기능 누락 / UX 개선

- [x] **메시지 최대 길이 제한 없음**
  - 프론트: `<textarea>` `maxLength` 속성 추가 (예: 2000자)
  - 백엔드: `ChatRequest.message` Pydantic `Field(max_length=2000)` 추가 → 초과 시 400 응답

- [x] **`session_id` UUID 형식 검증 없음** (`backend/models/message.py`)
  - 현재: 임의 문자열을 session_id로 허용 → MongoDB 쿼리 인젝션 방어층 부재
  - 수정: Pydantic `Field(pattern=r'^[0-9a-f]{8}-...')` 또는 `UUID` 타입으로 강제

- [x] **캐릭터 아바타 이미지 미구현**
  - `characters.json`의 `avatar_url`이 `CharacterCard.tsx`에서 미사용 (이니셜만 표시)
  - `frontend/public/avatars/` 디렉터리 및 placeholder 이미지 없음
  - 수정: placeholder SVG 이미지 추가 + `next/image` 적용, 이미지 없을 때 이니셜 fallback 유지

- [x] **캐릭터 선택 화면 로딩 UI 없음** (`frontend/app/`)
  - 현재: `GET /characters` fetch 중 빈 화면
  - 수정: `app/loading.tsx` 추가 (스켈레톤 카드 3~4개)

- [x] **커스텀 404 / 에러 페이지 없음** (`frontend/app/`)
  - `app/not-found.tsx` — 잘못된 캐릭터 ID 등 404 상황
  - `app/error.tsx` — 런타임 에러 바운더리

- [x] **`frontend/.dockerignore` 없음**
  - 현재: `node_modules/`(수백 MB)가 Docker build context에 포함되어 빌드 지연
  - 수정: `.dockerignore` 추가 (`node_modules`, `.next`, `.env.local` 등 제외)

### 낮음 — 코드 품질 / 운영 개선

- [x] **CORS 설정 프로덕션 강화** (`backend/main.py`)
  - 현재: `allow_methods=["*"]`, `allow_headers=["*"]`
  - 수정: `allow_methods=["POST", "GET", "OPTIONS"]`, `allow_headers=["Content-Type"]`

- [x] **헬스체크에 MongoDB 연결 검증 포함** (`backend/main.py`)
  - 현재: `GET /health`는 앱 기동만 확인, DB 장애 감지 불가
  - 수정: `await get_db().command("ping")` 추가, 실패 시 503 반환

- [x] **`msg.content` 타입 안전성** (`backend/db/conversations.py`)
  - LangChain `BaseMessage.content`는 `str | list[dict]` Union 타입
  - `_to_dict`에서 `content`가 리스트일 경우 `str` 변환 처리 추가

- [x] **모델명 환경변수화** (`backend/graph/nodes.py`)
  - 현재: `ChatAnthropic(model="claude-sonnet-4-6")` 하드코딩
  - 수정: `os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")`으로 변경

- [x] **로깅 설정** (`backend/main.py`)
  - 현재: `logging.basicConfig` 미설정 → 배포 환경에서 로그 레벨·포맷 비일관
  - 수정: `logging.basicConfig(level=logging.INFO, format="...")` 앱 기동 시 설정

- [x] **에러 코드 상수 정의** (`backend/routers/chat.py`)
  - 현재: `"llm_error"`, `"graph_error"` 문자열 리터럴 산재
  - 수정: `backend/constants.py` 또는 `Enum`으로 정의, 프론트(`lib/api.ts`)와 동기화
