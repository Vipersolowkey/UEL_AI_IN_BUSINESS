from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.predictive import (
    CancellationPredictionRequest,
    CancellationPredictionResponse,
    DynamicPriceResponse,
)
from app.services.predictive import calculate_dynamic_price, predict_cancellation_risk

router = APIRouter(prefix="/predictive", tags=["predictive"])


@router.get("/dynamic-price", response_model=DynamicPriceResponse)
def get_dynamic_price(
    room_id: int = Query(...),
    target_date: date = Query(...),
    db: Session = Depends(get_db),
) -> DynamicPriceResponse:
    return DynamicPriceResponse(
        room_id=room_id,
        target_date=target_date,
        recommended_price=calculate_dynamic_price(room_id=room_id, target_date=target_date, db=db),
    )


@router.post("/cancellation-risk", response_model=CancellationPredictionResponse)
def get_cancellation_risk(
    payload: CancellationPredictionRequest,
    db: Session = Depends(get_db),
) -> CancellationPredictionResponse:
    return CancellationPredictionResponse(**predict_cancellation_risk(payload.model_dump(), db=db))
