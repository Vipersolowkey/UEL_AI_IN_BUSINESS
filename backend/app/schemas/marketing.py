from decimal import Decimal

from pydantic import BaseModel, EmailStr


class PromoEmailRequest(BaseModel):
    booking_id: str
    guest_name: str
    guest_email: EmailStr
    room_type: str
    stay_dates: str
    booked_price: Decimal
    competitor_price: Decimal | None = None
    risk_level: str
    area_name: str = "Nha Trang"


class PromoEmailResponse(BaseModel):
    message: str
    subject: str
    email_body: str
    model_used: str
