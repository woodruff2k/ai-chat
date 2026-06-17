# AI Character Chat — CLAUDE.md

## 프로젝트 개요

일반 소비자(B2C) 대상 AI 캐릭터 대화 웹 애플리케이션.
운영자가 미리 정의한 캐릭터를 선택해 Claude 모델과 스트리밍 대화를 즐기는 엔터테인먼트 서비스.

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | Next.js 15 (App Router) + React 19 |
| UI 스타일링 | Tailwind CSS + shadcn/ui |
| 백엔드 | FastAPI (Python 3.12+) |
| AI 프레임워크 | LangGraph |
| AI 모델 | Claude (claude-sonnet-4-6) |
| 데이터베이스 | MongoDB (Atlas) |
| 배포 | Google Cloud Run (프론트엔드 + 백엔드) |

## 아키텍처

```
┌─────────────────┐     SSE / Streaming      ┌──────────────────────┐
│  Next.js App    │ ────────────────────────► │  FastAPI Backend     │
│  (App Router)   │                           │                      │
│  sessionStorage │ ◄──── Streaming Tokens ── │  LangGraph Agent     │
│  (session_id)   │                           │   └─ Claude API      │
└─────────────────┘                           └──────────┬───────────┘
                                                         │
                                                  ┌──────▼───────┐
                                                  │   MongoDB    │
                                                  │  (대화 기록) │
                                                  └──────────────┘
```

### 데이터 흐름

1. 사용자가 캐릭터를 선택하면 프론트에서 `session_id` 생성 (sessionStorage 저장)
2. 메시지 전송 시 FastAPI로 POST 요청 (`session_id` 포함)
3. FastAPI → LangGraph 그래프 실행 → Claude API 호출
4. SSE(Server-Sent Events)로 스트리밍 토큰을 프론트에 전달
5. 대화 기록은 MongoDB에 `session_id` 기준으로 저장 (Cloud Run 다중 인스턴스 대응)
6. 브라우저 탭을 닫으면 sessionStorage의 `session_id` 소멸 → 사실상 이력 접근 불가
7. MongoDB TTL 인덱스(`updated_at`, 24시간)로 오래된 문서 자동 삭제

## 디렉터리 구조

```
ai-chat/
├── frontend/                  # Next.js App Router
│   ├── app/
│   │   ├── page.tsx           # 캐릭터 선택 화면
│   │   ├── chat/[characterId]/
│   │   │   └── page.tsx       # 대화 화면
│   │   └── layout.tsx
│   ├── components/
│   │   ├── CharacterCard.tsx
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   └── lib/
│       └── api.ts             # 백엔드 API 클라이언트
│
├── backend/                   # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── characters.py      # GET /characters
│   │   └── chat.py            # POST /chat/stream
│   ├── graph/
│   │   ├── agent.py           # LangGraph 그래프 정의
│   │   └── nodes.py           # 그래프 노드 (캐릭터 프롬프트 주입 등)
│   ├── models/
│   │   ├── character.py       # 캐릭터 Pydantic 모델
│   │   └── message.py         # 메시지 Pydantic 모델
│   ├── db/
│   │   └── mongo.py           # MongoDB 비동기 연결 및 CRUD (motor)
│   └── data/
│       └── characters.json    # 캐릭터 정의 데이터
│
└── CLAUDE.md
```

## 주요 기능

### 캐릭터 시스템
- 운영자가 `characters.json`에 캐릭터를 정의 (이름, 설명, 프로필 이미지, 시스템 프롬프트, 성격 태그)
- 캐릭터 이름, 설정은 특별히 정해진 것 없음 — 개발 시 임시 더미 캐릭터로 구현
- 프론트 홈에서 캐릭터 카드 목록 표시
- 캐릭터 선택 시 해당 캐릭터의 시스템 프롬프트로 LangGraph 그래프 초기화

### 대화 화면
- 인증 없이 누구나 사용 가능 (`session_id`는 클라이언트에서 UUID로 생성, sessionStorage 저장)
- Claude 응답을 SSE로 수신해 타이핑 애니메이션으로 표시
- 대화 기록은 MongoDB에 저장하되 세션 중에만 접근 가능 (탭 닫기 시 session_id 소멸)
- MongoDB TTL 인덱스(24시간)로 오래된 대화 자동 삭제

### 스트리밍
- 백엔드: FastAPI `StreamingResponse` + SSE 포맷
- 프론트: `fetch` API의 `ReadableStream`으로 소비
- LangGraph `.astream_events()` 사용해 토큰 단위 스트리밍

## API 명세

### `GET /characters`
캐릭터 목록 반환.

```json
[
  {
    "id": "aria",
    "name": "아리아",
    "description": "밝고 유쾌한 AI 친구",
    "tags": ["친구", "유머", "활발"],
    "avatar_url": "/avatars/aria.png"
  }
]
```

### `POST /chat/stream`
스트리밍 대화 요청.

**Request Body**
```json
{
  "session_id": "uuid-v4",
  "character_id": "aria",
  "message": "안녕!"
}
```

**Response**: `text/event-stream`
```
data: {"type": "token", "content": "안"}
data: {"type": "token", "content": "녕"}
data: {"type": "done"}
```

## MongoDB 스키마

### `conversations` 컬렉션
```json
{
  "_id": "ObjectId",
  "session_id": "uuid-v4",
  "character_id": "aria",
  "messages": [
    {"role": "user", "content": "안녕!", "timestamp": "ISO8601"},
    {"role": "assistant", "content": "안녕하세요!", "timestamp": "ISO8601"}
  ],
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

인덱스:
- `session_id` (unique)
- `updated_at` TTL 인덱스 (24시간) — 오래된 세션 자동 삭제

## 캐릭터 데이터 구조 (`characters.json`)

```json
[
  {
    "id": "character-01",
    "name": "캐릭터 이름 (미정)",
    "description": "캐릭터 설명 (미정)",
    "avatar_url": "/avatars/placeholder.png",
    "tags": ["태그1", "태그2"],
    "system_prompt": "캐릭터 시스템 프롬프트 (미정)"
  }
]
```

> 캐릭터 이름, 설정, 시스템 프롬프트는 추후 운영자가 직접 작성. 개발 단계에서는 더미 데이터로 대체.

## LangGraph 그래프 구조

```
[START] → character_prompt_injection → llm_call → [END]
```

- `character_prompt_injection`: 선택된 캐릭터의 시스템 프롬프트를 상태에 주입
- `llm_call`: Claude API 호출 및 스트리밍 토큰 생성
- 대화 기록은 MongoDB에서 `session_id` 기준으로 로드해 LangGraph 상태에 주입
- 세션 중 메시지 수 제한 없음 (전체 대화 기록을 컨텍스트로 유지)

## 환경 변수

### 백엔드 (`backend/.env`)
```
ANTHROPIC_API_KEY=
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://<frontend-cloud-run-url>
```

### 프론트엔드 (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 개발 실행

```bash
# 백엔드
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 프론트엔드
cd frontend
npm install
npm run dev
```

## 배포 (Google Cloud)

- **프론트엔드**: Google Cloud Run (`next build` + Docker 컨테이너, `frontend/Dockerfile`)
- **백엔드**: Google Cloud Run (Docker 컨테이너, `backend/Dockerfile`)
- **MongoDB**: MongoDB Atlas (Google Cloud 리전 일치 권장)
- **환경 변수**: Google Cloud Secret Manager로 관리
- **컨테이너 레지스트리**: Google Artifact Registry

### 배포 절차

#### 1. 사전 준비
```bash
# gcloud CLI 로그인 및 프로젝트 설정
gcloud auth login
gcloud config set project [PROJECT_ID]

# Artifact Registry 저장소 생성
gcloud artifacts repositories create ai-chat \
  --repository-format=docker \
  --location=asia-northeast3

# Docker 인증
gcloud auth configure-docker asia-northeast3-docker.pkg.dev
```

#### 2. Secret Manager 환경 변수 등록
```bash
echo -n "your-anthropic-api-key" | \
  gcloud secrets create ANTHROPIC_API_KEY --data-file=-

echo -n "mongodb+srv://..." | \
  gcloud secrets create MONGODB_URI --data-file=-
```

#### 3. 백엔드 빌드 & 배포
```bash
# 이미지 빌드 & 푸시
docker build -t asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/backend:latest ./backend
docker push asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/backend:latest

# Cloud Run 배포
gcloud run deploy ai-chat-backend \
  --image asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/backend:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 2 \
  --concurrency 10 \
  --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest
```

#### 4. 프론트엔드 빌드 & 배포
```bash
# 백엔드 URL 확인 후 환경 변수 설정
# (백엔드 배포 완료 후 발급된 Cloud Run URL 사용)

# 이미지 빌드 & 푸시
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://[BACKEND_CLOUD_RUN_URL] \
  -t asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/frontend:latest ./frontend
docker push asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/frontend:latest

# Cloud Run 배포
gcloud run deploy ai-chat-frontend \
  --image asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/frontend:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 2
```

#### 5. CORS 설정
백엔드 FastAPI에서 프론트엔드 Cloud Run 도메인을 허용해야 함.
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://[FRONTEND_CLOUD_RUN_URL]"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Cloud Run 스케일링 설정
동시 접속 5~10명 소규모 트래픽 기준.

| 항목 | 프론트엔드 | 백엔드 |
|---|---|---|
| 최소 인스턴스 | 0 (cold start 허용) | 0 (cold start 허용) |
| 최대 인스턴스 | 2 | 2 |
| 인스턴스당 동시 요청 | 80 (기본값) | 10 (SSE 스트리밍 커넥션 고려) |
| 메모리 | 512Mi | 1Gi |
| CPU | 1 | 1 |

> 트래픽 증가 시 최대 인스턴스 수만 조정하면 됨.

## UI/UX 디자인 가이드라인

### 테마: 비즈니스 스타일
- **컬러 팔레트**
  - Primary: `#1E293B` (Slate 800) — 주요 배경, 헤더
  - Secondary: `#334155` (Slate 700) — 카드, 패널 배경
  - Accent: `#3B82F6` (Blue 500) — 버튼, 강조 요소
  - Text: `#F8FAFC` (Slate 50) / `#94A3B8` (Slate 400) — 본문 / 서브텍스트
  - Surface: `#0F172A` (Slate 900) — 페이지 최상위 배경
- **타이포그래피**: Inter 또는 Pretendard 폰트, 깔끔한 sans-serif
- **레이아웃**: 여백을 충분히 확보한 카드 기반 그리드, 그림자 최소화
- **아이콘**: Lucide React (선 굵기 일관성 유지)

### UI 컴포넌트 스타일
- **캐릭터 카드**: 다크 배경 위 프로필 이미지 + 이름 + 태그 뱃지, 호버 시 미세한 테두리 강조
- **채팅 버블**: 사용자 메시지는 Accent Blue, AI 응답은 Slate 700
- **입력창**: 하단 고정, 둥근 모서리, 전송 버튼에 Accent 색상
- **헤더**: 선택된 캐릭터 아바타 + 이름 표시, 미니멀한 구성

### 반응형 디자인
- **브레이크포인트** (Tailwind 기준)
  - `sm` 640px — 모바일 세로
  - `md` 768px — 태블릿
  - `lg` 1024px — 데스크톱
- **캐릭터 선택 화면**: 모바일 1열 → 태블릿 2열 → 데스크톱 3~4열 그리드
- **채팅 화면**: 모바일 전체 너비 / 데스크톱 중앙 정렬 최대 너비 `max-w-2xl`
- **입력창**: 모바일에서 소프트 키보드 올라올 때 레이아웃 밀림 방지 (`dvh` 단위 사용)
- 터치 타겟 최소 44×44px 준수

### UI 라이브러리
- Tailwind CSS (다크 모드 기본)
- shadcn/ui 컴포넌트 활용

## 에러 처리

### 백엔드
| 상황 | 처리 방식 |
|---|---|
| Claude API 오류 (rate limit, timeout) | SSE로 `{"type": "error", "code": "llm_error"}` 전송 후 스트림 종료 |
| MongoDB 연결 실패 | 500 응답, 대화 기록 없이 진행 불가 |
| 존재하지 않는 `character_id` | 400 응답 |
| LangGraph 실행 오류 | SSE로 `{"type": "error", "code": "graph_error"}` 전송 후 스트림 종료 |

### 프론트엔드
| 상황 | 처리 방식 |
|---|---|
| SSE 연결 끊김 | 재시도 없이 에러 메시지 채팅창에 표시 |
| 백엔드 에러 수신 (`type: error`) | "응답 중 오류가 발생했습니다. 다시 시도해 주세요." 메시지 표시 |
| 네트워크 오류 | 동일한 에러 메시지 표시 |
| 캐릭터 목록 로딩 실패 | 빈 목록 대신 에러 상태 UI 표시 |

### 공통 원칙
- 에러 메시지에 내부 구현 정보(스택 트레이스, DB 쿼리 등) 노출 금지
- 사용자에게 보여주는 메시지는 한국어로 통일
- 재시도 로직은 구현하지 않음 (사용자가 직접 재전송)

## 개발 가이드라인

- 백엔드 Python 코드는 `ruff` 린터 사용
- 프론트엔드는 TypeScript strict 모드
- 컴포넌트는 Server Component 우선, 스트리밍/인터랙션 필요 시 `"use client"` 추가
- API 응답 타입은 프론트와 백엔드 모두 명시적으로 정의
- 시스템 프롬프트는 절대 클라이언트에 노출하지 않음 (백엔드에서만 관리)
- 과거 대화 검색/참조 기능은 제공하지 않음 (세션 내 연속 대화만 지원)
- 단계별 릴리스 계획 및 기능 우선순위 없음 — 전체 기능을 한 번에 구현
- 예산 및 API 이용 요금 제한 없음 — 비용 최적화보다 기능 완성도와 UX를 우선

### 구현 범위 외 기능 (구현 금지)
- 사용자 인증 / 회원가입
- 다국어 지원 (한국어 단일 언어)
- 음성 입력 / 음성 출력 (TTS/STT)
- SSE 스트리밍은 프론트에서 FastAPI로 직접 `fetch` 요청 — Next.js API Route를 중간에 두면 버퍼링으로 실시간성이 깨지므로 금지
