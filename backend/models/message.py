from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )
    character_id: str
    message: str = Field(max_length=2000)
