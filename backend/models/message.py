import base64
from typing import Literal

from pydantic import BaseModel, Field, model_validator

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB

_MAGIC_BYTES: dict[str, bytes] = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/gif": b"GIF8",
    "image/webp": b"RIFF",
}


def _check_image_magic(data: bytes, media_type: str) -> bool:
    magic = _MAGIC_BYTES.get(media_type)
    if not magic:
        return False
    if not data.startswith(magic):
        return False
    if media_type == "image/webp" and data[8:12] != b"WEBP":
        return False
    return True


class ImageData(BaseModel):
    data: str
    media_type: Literal["image/jpeg", "image/png", "image/gif", "image/webp"]

    @model_validator(mode="after")
    def validate_image(self) -> "ImageData":
        try:
            decoded = base64.b64decode(self.data, validate=True)
        except Exception:
            raise ValueError("유효하지 않은 Base64 인코딩입니다.")
        if len(decoded) > MAX_IMAGE_BYTES:
            raise ValueError("이미지 크기는 5MB를 초과할 수 없습니다.")
        if not _check_image_magic(decoded, self.media_type):
            raise ValueError("이미지 포맷이 선언된 MIME 타입과 일치하지 않습니다.")
        return self


class ChatRequest(BaseModel):
    session_id: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )
    character_id: str
    message: str = Field(max_length=2000)
    image: ImageData | None = None

    @model_validator(mode="after")
    def validate_content(self) -> "ChatRequest":
        if not self.message.strip() and not self.image:
            raise ValueError("메시지 또는 이미지 중 하나는 필요합니다.")
        return self
