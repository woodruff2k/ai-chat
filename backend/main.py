import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.mongo import connect, create_indexes, disconnect
from routers import characters

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    await create_indexes()
    yield
    await disconnect()


app = FastAPI(title="AI Character Chat API", lifespan=lifespan)

_allowed_origins = [
    "http://localhost:3000",
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


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
