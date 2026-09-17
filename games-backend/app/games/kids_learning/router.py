from fastapi import APIRouter, Depends
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ...database import get_db
from .models import Progress
from .schemas import LevelBest, ProgressIn, ProgressOut

router = APIRouter()


@router.post("/progress", response_model=ProgressOut, status_code=201)
def save_progress(data: ProgressIn, db: Session = Depends(get_db)):
    row = Progress(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/progress", response_model=list[ProgressOut])
def list_progress(mode: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Progress).order_by(Progress.created_at.desc())
    if mode:
        stmt = stmt.where(Progress.mode == mode)
    return db.scalars(stmt).all()


@router.get("/progress/summary", response_model=list[LevelBest])
def progress_summary(db: Session = Depends(get_db)):
    """Лучший результат и число попыток по каждому (режим, уровень)."""
    stmt = (
        select(
            Progress.mode,
            Progress.level,
            func.max(Progress.result).label("best"),
            func.count().label("attempts"),
        )
        .group_by(Progress.mode, Progress.level)
    )
    return [
        LevelBest(mode=m, level=l, best=b, attempts=a)
        for m, l, b, a in db.execute(stmt).all()
    ]


@router.delete("/progress", status_code=204)
def clear_progress(db: Session = Depends(get_db)):
    """Сброс всего прогресса (админ-панель)."""
    db.execute(delete(Progress))
    db.commit()
