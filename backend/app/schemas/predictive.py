from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class DynamicPriceResponse(BaseModel):
    room_id: int
    target_date: date
    recommended_price: Decimal


class CancellationPredictionRequest(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    total_price: Decimal


class CancellationPredictionResponse(BaseModel):
    cancellation_risk: str
    reason: str
    room_id: int | None = None
    booked_nightly_rate: Decimal | None = None
    competitor_avg_nightly_rate: Decimal | None = None
    price_gap_ratio: Decimal | None = None
    occupancy_rate: Decimal | None = None
