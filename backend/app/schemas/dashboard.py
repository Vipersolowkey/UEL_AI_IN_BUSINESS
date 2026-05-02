from decimal import Decimal

from pydantic import BaseModel, EmailStr


class MonthlyRevenueCard(BaseModel):
    month_label: str
    total_revenue: Decimal
    average_adr: Decimal
    average_stay_nights: Decimal
    growth_percent: Decimal


class CancellationAlert(BaseModel):
    booking_id: str
    guest_name: str
    guest_email: EmailStr
    room_type: str
    stay_dates: str
    booked_price: Decimal
    competitor_price: Decimal | None
    risk: str


class DashboardResponse(BaseModel):
    monthly_revenue: MonthlyRevenueCard
    alerts: list[CancellationAlert]
