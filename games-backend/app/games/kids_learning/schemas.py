from datetime import datetime

from pydantic import BaseModel, Field


class ProgressIn(BaseModel):
    mode: str = Field(max_length=32)
    level: str = Field(max_length=32)
    result: int = Field(ge=0, le=3)


class ProgressOut(ProgressIn):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class LevelBest(BaseModel):
    """Лучший результат по уровню — то, что рисуем на карте (звёзды)."""

    mode: str
    level: str
    best: int
    attempts: int
