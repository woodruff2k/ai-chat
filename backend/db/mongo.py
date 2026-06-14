import os

import pymongo
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient | None = None

TTL_SECONDS = 24 * 60 * 60  # 24시간


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("MongoDB client is not initialized")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    db_name = os.environ.get("MONGODB_DB", "ai_chat")
    return get_client()[db_name]


async def connect() -> None:
    global _client
    uri = os.environ["MONGODB_URI"]
    _client = AsyncIOMotorClient(uri)


async def disconnect() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def create_indexes() -> None:
    db = get_db()
    conversations = db["conversations"]

    await conversations.create_index("session_id", unique=True)
    await conversations.create_index(
        "updated_at",
        expireAfterSeconds=TTL_SECONDS,
        name="updated_at_ttl",
    )
    await conversations.create_index(
        [("session_id", pymongo.ASCENDING), ("character_id", pymongo.ASCENDING)],
        name="session_character_idx",
    )
