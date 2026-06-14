from datetime import datetime, timezone

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from db.mongo import get_db


def _to_langchain(msg: dict) -> BaseMessage:
    if msg["role"] == "user":
        return HumanMessage(content=msg["content"])
    return AIMessage(content=msg["content"])


def _to_dict(msg: BaseMessage) -> dict:
    role = "user" if isinstance(msg, HumanMessage) else "assistant"
    content = msg.content
    if isinstance(content, list):
        content = "".join(
            part.get("text", "") for part in content if isinstance(part, dict)
        )
    return {"role": role, "content": str(content)}


async def load_messages(session_id: str) -> list[BaseMessage]:
    """session_id로 기존 대화 기록을 로드한다. 없으면 빈 리스트 반환."""
    doc = await get_db()["conversations"].find_one(
        {"session_id": session_id},
        {"messages": 1},
    )
    if not doc:
        return []
    return [_to_langchain(m) for m in doc.get("messages", [])]


async def save_messages(
    session_id: str,
    character_id: str,
    messages: list[BaseMessage],
) -> None:
    """대화 기록을 MongoDB에 upsert한다. 시스템 메시지는 제외하고 저장한다."""
    from langchain_core.messages import SystemMessage

    now = datetime.now(timezone.utc)
    raw = [_to_dict(m) for m in messages if not isinstance(m, SystemMessage)]

    await get_db()["conversations"].update_one(
        {"session_id": session_id},
        {
            "$set": {
                "character_id": character_id,
                "messages": raw,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
