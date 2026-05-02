from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.marketing import PromoEmailRequest, PromoEmailResponse
from app.services.marketing import generate_promo_email

router = APIRouter(prefix="/marketing", tags=["marketing"])


@router.post("/generate-promo-email", response_model=PromoEmailResponse)
def generate_promo_email_endpoint(payload: PromoEmailRequest, db: Session = Depends(get_db)) -> PromoEmailResponse:
    subject, email_body, model_used = generate_promo_email(payload, db=db)
    return PromoEmailResponse(
        message=f"Promo email generated for booking {payload.booking_id}.",
        subject=subject,
        email_body=email_body,
        model_used=model_used,
    )
