from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.ai import CompetitorInsightRequest
from app.schemas.marketing import PromoEmailRequest
from app.services.competitor_ai import generate_competitor_insight
from app.services.llm import LlmUnavailableError, generate_text


def _fallback_promo_email(payload: PromoEmailRequest, strategic_summary: str) -> tuple[str, str, str]:
    discount = "12%"
    competitor_line = ""
    if payload.competitor_price is not None:
        competitor_line = (
            f"We noticed similar options in the market are currently around ${payload.competitor_price}.\n\n"
        )

    subject = f"An exclusive offer for your stay, {payload.guest_name}"
    email_body = (
        f"Hi {payload.guest_name},\n\n"
        f"Thank you for choosing our hotel for your upcoming {payload.room_type} stay ({payload.stay_dates}).\n\n"
        f"{competitor_line}"
        f"We would love to keep your reservation with us, so we prepared a special {discount} loyalty offer "
        f"for booking {payload.booking_id}.\n\n"
        f"Your current booking total: ${payload.booked_price}\n"
        f"Why stay with us: {strategic_summary}\n\n"
        f"Offer: Apply code STAYWITHUS12 within 48 hours to secure your updated rate.\n\n"
        f"Reply to this email if you would like our team to apply the offer for you.\n\n"
        f"Warm regards,\nRevenue & Guest Experience Team"
    )
    return subject, email_body, "template_fallback"


def generate_promo_email(payload: PromoEmailRequest, db: Session) -> tuple[str, str, str]:
    insight = generate_competitor_insight(
        db=db,
        payload=CompetitorInsightRequest(area_name=payload.area_name, max_hotels=6, max_reviews_per_hotel=2),
    )
    strategic_summary = insight["strategic_summary"]

    prompt = (
        "Write a short promotional retention email for a hotel guest.\n"
        f"Guest name: {payload.guest_name}\n"
        f"Room type: {payload.room_type}\n"
        f"Stay dates: {payload.stay_dates}\n"
        f"Booked price: {payload.booked_price}\n"
        f"Competitor price: {payload.competitor_price}\n"
        f"Risk level: {payload.risk_level}\n"
        f"Market insight: {strategic_summary}\n"
        "Output exactly two sections:\n"
        "SUBJECT: <text>\n"
        "BODY: <text>"
    )
    system_prompt = (
        "You are a hotel CRM and revenue marketing assistant. "
        "Write concise, persuasive, professional retention emails. "
        "Do not use markdown."
    )

    try:
        result, model_used = generate_text(prompt=prompt, system_prompt=system_prompt)
        subject = ""
        body = ""
        for line in result.splitlines():
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "", 1).strip()
            elif line.startswith("BODY:"):
                body = line.replace("BODY:", "", 1).strip()
            elif body:
                body = f"{body}\n{line}".strip()

        if subject and body:
            return subject, body, model_used
    except LlmUnavailableError:
        pass

    return _fallback_promo_email(payload, strategic_summary)
