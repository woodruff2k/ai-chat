import json

import anthropic
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from db.conversations import load_messages, save_messages
from graph.agent import stream_tokens
from models.message import ChatRequest
from routers.characters import get_character

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _generate(request: ChatRequest, system_prompt: str):
    messages = await load_messages(request.session_id)
    messages.append(HumanMessage(content=request.message))

    full_response = ""
    try:
        async for token in stream_tokens(messages, system_prompt):
            full_response += token
            yield _sse({"type": "token", "content": token})
    except anthropic.APIError:
        yield _sse({"type": "error", "code": "llm_error"})
        return
    except Exception:
        yield _sse({"type": "error", "code": "graph_error"})
        return

    from langchain_core.messages import AIMessage

    messages.append(AIMessage(content=full_response))
    await save_messages(request.session_id, request.character_id, messages)

    yield _sse({"type": "done"})


@router.post("/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    character = get_character(request.character_id)
    if not character:
        raise HTTPException(status_code=400, detail="존재하지 않는 캐릭터입니다.")

    return StreamingResponse(
        _generate(request, character.system_prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
