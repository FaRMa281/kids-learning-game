from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ...database import Base


class Progress(Base):
    """Одна запись = одно прохождение уровня."""

    __tablename__ = "kids_learning_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mode: Mapped[str] = mapped_column(String(32), index=True)   # letters, numbers, ...
    level: Mapped[str] = mapped_column(String(32), index=True)  # ru-easy, en-hard, ...
    result: Mapped[int] = mapped_column(Integer)                # звёзды 0..3
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
