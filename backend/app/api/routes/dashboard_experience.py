from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.guest_engagement import PinnedCompetitorUpdate
from app.services import guest_engagement_service as ges

router = APIRouter(prefix="/dashboard", tags=["dashboard-experience"])


@router.get("/experience-insights")
def experience_insights(db: Session = Depends(get_db)) -> dict:
    return ges.experience_insights_pack(db)


@router.get("/pinned-competitor")
def get_pinned(db: Session = Depends(get_db)) -> dict:
    return ges.get_pinned_competitor(db)


@router.put("/pinned-competitor")
def put_pinned(payload: PinnedCompetitorUpdate, db: Session = Depends(get_db)) -> dict:
    return ges.set_pinned_competitor(db, payload.model_dump())
