import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta

import anthropic
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from constants import ErrorCode
from db.conversations import load_messages, save_messages
from graph.agent import stream_tokens
from limiter import limiter
from models.message import ChatRequest
from routers.characters import get_character

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

# 세션별 슬라이딩 윈도우 카운터 (인스턴스 로컬 메모리)
_session_windows: dict[str, list[datetime]] = defaultdict(list)
_SESSION_LIMIT = 10
_SESSION_WINDOW = timedelta(minutes=1)


def _check_session_limit(session_id: str) -> None:
    """세션당 분당 요청 수를 제한한다. 초과 시 429를 발생시킨다."""
    now = datetime.now()
    cutoff = now - _SESSION_WINDOW
    window = _session_windows[session_id]
    while window and window[0] < cutoff:
        window.pop(0)
    if len(window) >= _SESSION_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
            headers={"Retry-After": "60"},
        )
    window.append(now)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _generate(chat_request: ChatRequest, system_prompt: str):
    messages = await load_messages(chat_request.session_id)

    if chat_request.image:
        human_content: list[dict] = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{chat_request.image.media_type};base64,{chat_request.image.data}"
                },
            },
            {"type": "text", "text": chat_request.message},
        ]
        messages.append(HumanMessage(content=human_content))
    else:
        messages.append(HumanMessage(content=chat_request.message))

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
        await save_messages(chat_request.session_id, chat_request.character_id, messages)
    except Exception as e:
        logger.error("save_messages failed: %s", e, exc_info=True)

    yield _sse({"type": "done"})


@router.post("/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, chat_request: ChatRequest) -> StreamingResponse:
    character = get_character(chat_request.character_id)
    if not character:
        raise HTTPException(status_code=400, detail="존재하지 않는 캐릭터입니다.")

    _check_session_limit(chat_request.session_id)

    return StreamingResponse(
        _generate(chat_request, character.system_prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
