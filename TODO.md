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

---

## 13. 보안 검토

### 해당 없음 / 이미 완료

| 항목 | 판단 | 근거 |
|---|---|---|
| CSRF 보호 | **해당 없음** | 쿠키 기반 인증 미사용. `session_id`는 `sessionStorage` → JSON body로 전송. 브라우저가 자동으로 첨부하는 자격증명(쿠키) 없음 |
| 입력값 새니타이제이션 | **이미 완료** | `session_id` UUID 패턴 검증, `message` max_length=2000 (Pydantic), `character_id` 고정 목록 매칭으로 허용 외 값 400 처리. 프론트는 React JSX(`{content}`)로 렌더링하므로 HTML 이스케이프 자동 적용 (`dangerouslySetInnerHTML` 미사용 확인) |
| API 인증 | **의도적 비구현** | CLAUDE.md 명시적 제외: "인증 없이 누구나 사용 가능" — 공개 엔터테인먼트 서비스 특성 |
| SQL 주입 | **해당 없음** | SQL 미사용 (MongoDB). NoSQL 주입은 Pydantic 타입 강제(str) + UUID 패턴 검증으로 파라미터 바인딩 보장. 시스템 프롬프트는 서버 파일에서만 로드 (클라이언트 입력 미사용) |

### 미구현 — 추가 필요

- [x] **HTTP 보안 헤더 설정**

  **프론트엔드** (`frontend/next.config.ts` — `headers()` 추가):
  - `X-Frame-Options: DENY` — 클릭재킹 방지
  - `X-Content-Type-Options: nosniff` — MIME 타입 스니핑 방지
  - `Referrer-Policy: strict-origin-when-cross-origin` — 레퍼러 정보 최소화
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` — 불필요한 브라우저 API 차단
  - `Content-Security-Policy` — Next.js 인라인 스크립트 특성상 nonce 방식 또는 최소한 `default-src 'self'` + `connect-src [백엔드 URL]` 설정

  **백엔드** (`backend/main.py` — HTTP 미들웨어 추가):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - API 서버이므로 CSP는 불필요

---

## 14. 레이트 제한 및 DoS 대책

### 현재 상태

Cloud Run 인프라 레벨에서 자연적 상한이 존재함:
- `concurrency=10` per instance × `max-instances=2` → 동시 SSE 연결 최대 **20개**
- 초과 요청은 Cloud Run이 자동으로 503 반환

앱 레벨 rate limiting은 **전혀 없음** (코드·의존성 모두 미존재).

### 구현 전 필수 이해: In-Memory 방식의 한계

`slowapi`(FastAPI 표준 rate limiting 라이브러리)의 기본 저장소는 **인스턴스 로컬 메모리**:
- 인스턴스 재시작 시 카운터 초기화
- max-instances=2 환경에서 **실제 글로벌 허용량 = 설정값 × 2** (각 인스턴스가 독립 카운팅)
- 예: IP당 20 req/min 설정 → 운 나쁜 경우 40 req/min까지 통과 가능

진정한 글로벌 rate limiting을 위해서는 **Redis (Cloud Memorystore)** 필요 — 추가 비용·운영 복잡도 수반.
이 앱의 소규모 트래픽(동시 5~10명 기준)에서는 in-memory 방식이 충분히 실용적.

### 미구현 — 추가 필요

- [x] **`slowapi` 의존성 추가 및 기본 설정** (`backend/`)
  ```
  uv add slowapi
  ```
  - `Limiter` 초기화: `key_func=get_remote_address` (IP 기반 기본값)
  - Cloud Run 프록시 헤더 처리: `request.headers.get("X-Forwarded-For")` 첫 번째 IP 추출
    (`request.client.host`는 Cloud Run LB IP이므로 사용 불가)
  - `app.state.limiter` 등록, `_rate_limit_exceeded_handler` 전역 예외 핸들러 등록

- [x] **IP별 레이트 제한** (`backend/routers/`)
  - `POST /chat/stream`: **20 req/min per IP** — LLM 호출 비용 고려
  - `GET /characters`: **60 req/min per IP** — 가벼운 엔드포인트
  - `GET /health`: 제한 없음 (모니터링 용도)
  - 초과 시 `429 Too Many Requests` + `Retry-After` 헤더 반환

- [x] **세션별 레이트 제한** (`backend/routers/chat.py`)
  - `POST /chat/stream`: **10 req/min per session_id**
  - IP 제한과 독립 적용 (둘 다 초과해야 차단이 아니라, 하나라도 초과 시 차단)
  - `key_func`을 커스텀 함수로: `request.json()`의 `session_id` 추출

  > **주의**: `session_id` 기반 제한은 `request.json()` 파싱이 필요하므로  
  > Pydantic 검증 전 단계에서 별도 처리 필요. 구현 복잡도 증가.  
  > IP 제한만으로도 충분하면 세션 제한은 생략 가능.

- [x] **레이트 제한 오류 처리**
  - **백엔드**: `slowapi`의 기본 429 응답을 JSON 포맷으로 통일
    ```json
    {"detail": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", "retry_after": 60}
    ```
  - `/chat/stream`은 StreamingResponse 시작 *전*에 rate limit 검사가 이루어지므로  
    일반 JSON 429 응답으로 처리 가능 (SSE 스트림 내부에서 처리할 필요 없음)
  - **프론트엔드** (`frontend/lib/api.ts`): HTTP 429 수신 시 `onError('rate_limit')` 호출
  - **프론트엔드** (`frontend/components/ChatWindow.tsx`): `rate_limit` 코드 수신 시  
    "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." 메시지 표시 (기존 `ERROR_MESSAGE`와 구분)

### 이후 고려사항 (선택)

- **Cloud Armor**: Google Cloud 레벨 WAF + rate limiting. 앱 코드 변경 없이 IP별 제한 적용 가능. 소규모 트래픽에서는 비용 대비 효과 낮음.
- **Redis (Cloud Memorystore)**: 인스턴스 간 공유 카운터. 글로벌 정확도 필요 시 도입. 월 ~$30 추가 비용.
- **`max-instances` 조정**: 트래픽 증가 시 인스턴스 수 확대 전 rate limit 설정 재검토 필요.
