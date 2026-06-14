import os

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

from graph.state import GraphState

llm = ChatAnthropic(model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"))


async def character_prompt_injection(state: GraphState) -> dict:
    """캐릭터 시스템 프롬프트를 메시지 맨 앞에 주입한다.

    이미 SystemMessage가 있으면 교체하고, 없으면 prepend한다.
    """
    system_message = SystemMessage(content=state["system_prompt"])
    messages = list(state["messages"])

    if messages and isinstance(messages[0], SystemMessage):
        messages[0] = system_message
    else:
        messages = [system_message] + messages

    return {"messages": messages}


async def llm_call(state: GraphState) -> dict:
    """Claude를 호출하고 응답을 메시지 목록에 추가한다."""
    response = await llm.ainvoke(state["messages"])
    return {"messages": [response]}
