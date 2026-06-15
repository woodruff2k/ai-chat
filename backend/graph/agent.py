from langchain_core.messages import BaseMessage
from langgraph.graph import END, START, StateGraph

from graph.nodes import character_prompt_injection, llm_call
from graph.state import GraphState

_builder = StateGraph(GraphState)
_builder.add_node("character_prompt_injection", character_prompt_injection)
_builder.add_node("llm_call", llm_call)
_builder.add_edge(START, "character_prompt_injection")
_builder.add_edge("character_prompt_injection", "llm_call")
_builder.add_edge("llm_call", END)

graph = _builder.compile()


async def stream_tokens(
    messages: list[BaseMessage],
    system_prompt: str,
):
    """토큰 단위로 LLM 응답을 스트리밍한다.

    Yields:
        str: 생성된 토큰 문자열
    """
    async for chunk in graph.astream(
        {"messages": messages, "system_prompt": system_prompt},
        stream_mode="messages",
    ):
        if isinstance(chunk, tuple):
            message_chunk, metadata = chunk
            if (
                metadata.get("langgraph_node") == "llm_call"
                and hasattr(message_chunk, "content")
                and message_chunk.content
            ):
                yield message_chunk.content
