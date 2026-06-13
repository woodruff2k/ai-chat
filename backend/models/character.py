from pydantic import BaseModel


class CharacterInternal(BaseModel):
    """시스템 프롬프트 포함 — 서버 내부 전용."""

    id: str
    name: str
    description: str
    avatar_url: str
    tags: list[str]
    system_prompt: str


class CharacterPublic(BaseModel):
    """클라이언트 응답용 — 시스템 프롬프트 미포함."""

    id: str
    name: str
    description: str
    avatar_url: str
    tags: list[str]
