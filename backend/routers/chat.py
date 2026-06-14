import json
import logging

import anthropic
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from constants import ErrorCode
from db.conversations import load_messages, save_messages
from graph.agent import stream_tokens
from models.message import ChatRequest
from routers.characters import get_character

logger = logging.getLogger(__name__)
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
    except anthropic.APIError as e:
        logger.error("llm_error: %s", e)
        yield _sse({"type": "error", "code": ErrorCode.LLM_ERROR})
        return
    except Exception as e:
        logger.error("graph_error: %s", e, exc_info=True)
        yield _sse({"type": "error", "code": ErrorCode.GRAPH_ERROR})
        return

    messages.append(AIMessage(content=full_response))
    try:
        await save_messages(request.session_id, request.character_id, messages)
    except Exception as e:
        logger.error("save_messages failed: %s", e, exc_info=True)

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
