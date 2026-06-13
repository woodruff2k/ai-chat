import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

from models.character import CharacterInternal, CharacterPublic

router = APIRouter(prefix="/characters", tags=["characters"])

_DATA_PATH = Path(__file__).parent.parent / "data" / "characters.json"


@lru_cache(maxsize=1)
def _load_characters() -> list[CharacterInternal]:
    with _DATA_PATH.open(encoding="utf-8") as f:
        return [CharacterInternal(**c) for c in json.load(f)]


def get_character(character_id: str) -> CharacterInternal | None:
    return next((c for c in _load_characters() if c.id == character_id), None)


@router.get("", response_model=list[CharacterPublic])
async def list_characters() -> list[CharacterPublic]:
    return [CharacterPublic(**c.model_dump()) for c in _load_characters()]
