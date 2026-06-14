from dotenv import load_dotenv

load_dotenv()  # 모듈 레벨 초기화(ChatAnthropic 등)에 env var이 반영되려면 import 전에 호출해야 함

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.mongo import connect, create_indexes, disconnect
from routers import characters, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    await create_indexes()
    yield
    await disconnect()


app = FastAPI(title="AI Character Chat API", lifespan=lifespan)

_allowed_origins = [
    "http://localhost:3000",
    "https://ai-chat-frontend-370670066576.asia-northeast3.run.app",
]
_extra_origin = os.environ.get("FRONTEND_URL")
if _extra_origin:
    _allowed_origins.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(characters.router)
app.include_router(chat.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
