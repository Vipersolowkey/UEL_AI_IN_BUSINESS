from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.guest_experience import GuestFolioLine, RoomHousekeepingState
from app.models.property_ops import GuestNote, GuestTimelineEvent, Property
from app.schemas.guest_app import (
    ConciergeChatRequest,
    ConciergeChatResponse,
    DiningRequestCreate,
    FolioLineCreate,
    HousekeepingRequestCreate,
    TimelineStepCreate,
)
from app.schemas.guest_engagement import (
    AnonymousFeedbackCreate,
    AppAnalyticsEventCreate,
    BookingInquiryCreate,
    FolioAuditCreate,
    NpsSubmit,
    VoucherRedeem,
)
from app.services import guest_app_service as gs
from app.services import guest_engagement_service as ge

router = APIRouter(prefix="/guest-app", tags=["guest-app"])


@router.get("/session")
def guest_app_session(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return gs.build_session_payload(db, booking)


@router.get("/timeline")
def guest_app_timeline(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return gs.get_timeline_view(db, booking)


@router.post("/timeline/step")
def guest_app_timeline_step(payload: TimelineStepCreate, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    try:
        out = gs.advance_timeline(db, booking, payload.step)
        db.commit()
        return out
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/concierge-chat", response_model=ConciergeChatResponse)
def guest_app_concierge_chat(payload: ConciergeChatRequest, db: Session = Depends(get_db)) -> ConciergeChatResponse:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    hist = [m.model_dump() for m in payload.history]
    out = gs.concierge_chat_turn(db, booking, payload.message, hist)
    return ConciergeChatResponse(**out)


@router.post("/concierge-chat/stream")
def guest_app_concierge_chat_stream(
    payload: ConciergeChatRequest,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    hist = [m.model_dump() for m in payload.history]
    return StreamingResponse(
        gs.iter_concierge_chat_sse(db, booking, payload.message, hist),
        media_type="text/event-stream",
    )


@router.get("/offers")
def guest_app_offers(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    tags = gs.list_guest_tags(db, booking.guest_id)
    return {"booking_ref": booking.booking_id, "tags": tags, "offers": gs.build_segment_offers(tags)}


@router.post("/dining-request")
def guest_app_dining_request(payload: DiningRequestCreate, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    body = gs.dining_request_note(
        {
            "party_size": payload.party_size,
            "slot_time": payload.slot_time,
            "allergies": payload.allergies,
            "notes": payload.notes,
            "booking_ref": payload.booking_ref,
        },
    )
    db.add(GuestNote(guest_id=booking.guest_id, body=body, author_label="Guest app"))
    db.add(
        GuestTimelineEvent(
            guest_id=booking.guest_id,
            event_type="dining_request",
            detail=f"Dining request queued: {payload.slot_time} for {payload.party_size} pax.",
        ),
    )
    db.commit()
    return {"ok": True, "message": "Restaurant queue received your request."}


@router.post("/housekeeping-request")
def guest_app_housekeeping_request(payload: HousekeepingRequestCreate, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    room = booking.room
    body = gs.housekeeping_request_note(
        {"scope": payload.scope, "notes": payload.notes, "booking_ref": payload.booking_ref, "room": room.room_number},
    )
    db.add(GuestNote(guest_id=booking.guest_id, body=body, author_label="Guest app"))
    hk = gs.get_or_create_room_housekeeping(db, room.id)
    hk.status = "in_progress"
    hk.last_note = payload.notes or f"{payload.scope} requested"
    hk.updated_at = datetime.now(timezone.utc)
    db.add(
        GuestTimelineEvent(
            guest_id=booking.guest_id,
            event_type="housekeeping_request",
            detail=f"HK {payload.scope} for room {room.room_number}",
        ),
    )
    db.commit()
    return {"ok": True, "message": "Housekeeping has been notified.", "room_housekeeping_status": hk.status}


@router.get("/rooms/board")
def guest_app_room_board(
    property_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
) -> dict:
    rows = gs.room_board_rows(db, property_id)
    return {"property_id": property_id, "as_of": gs.today_iso(), "rooms": rows}


@router.get("/bill-preview")
def guest_app_bill_preview(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    ge.log_folio_audit(db, booking.booking_id, "Guest self-service", "bill_preview_json")
    return gs.build_session_payload(db, booking)


@router.get("/bill-export")
def guest_app_bill_export(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> Response:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    ge.log_folio_audit(db, booking.booking_id, "Guest self-service", "bill_export_txt")
    payload = gs.build_session_payload(db, booking)
    text = gs.bill_export_text(payload)
    return Response(content=text, media_type="text/plain; charset=utf-8")


@router.post("/folio-line")
def guest_app_folio_line(payload: FolioLineCreate, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    line = GuestFolioLine(
        booking_id=booking.id,
        category=payload.category,
        description=payload.description,
        amount=payload.amount,
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    return {"id": line.id, "category": line.category, "description": line.description, "amount": str(line.amount)}


@router.post("/nps")
def guest_app_nps_submit(payload: NpsSubmit, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    prop = db.get(Property, booking.room.property_id) if booking.room else None
    area = prop.area_name if prop else "Nha Trang"
    return ge.submit_nps(db, payload.booking_ref, payload.stars, payload.comment, area_name=area)


@router.post("/feedback-anonymous")
def guest_app_feedback_anonymous(payload: AnonymousFeedbackCreate, db: Session = Depends(get_db)) -> dict:
    return ge.submit_anonymous_feedback(db, payload.message, payload.area_name)


@router.post("/audit/folio-view")
def guest_app_audit_folio(payload: FolioAuditCreate, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    ge.log_folio_audit(db, payload.booking_ref, payload.actor_label, "manual_folio_view")
    return {"ok": True}


@router.post("/analytics/event")
def guest_app_analytics_event(payload: AppAnalyticsEventCreate, db: Session = Depends(get_db)) -> dict:
    if payload.booking_ref:
        booking = gs.get_booking_by_ref(db, payload.booking_ref)
        if booking is None:
            raise HTTPException(status_code=404, detail="Booking not found.")
    ge.log_app_event(db, payload.event_key, payload.booking_ref, payload.duration_ms)
    return {"ok": True}


@router.get("/first-timer-guide")
def guest_app_first_timer(booking_ref: str = Query(..., min_length=3), db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return ge.first_timer_guide(db, booking)


@router.get("/time-upsells")
def guest_app_time_upsells() -> dict:
    return ge.time_based_upsells()


@router.get("/pricing-scenarios")
def guest_app_pricing_scenarios() -> dict:
    return ge.pricing_scenarios_mock()


@router.get("/vouchers")
def guest_app_vouchers(db: Session = Depends(get_db)) -> dict:
    return {"vouchers": ge.list_vouchers(db)}


@router.post("/voucher/redeem")
def guest_app_voucher_redeem(payload: VoucherRedeem, db: Session = Depends(get_db)) -> dict:
    booking = gs.get_booking_by_ref(db, payload.booking_ref)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    out = ge.redeem_voucher(db, payload.code, payload.booking_ref)
    if not out.get("ok"):
        raise HTTPException(status_code=400, detail=out.get("message", "Redeem failed."))
    return out


@router.post("/booking-inquiry")
def guest_app_booking_inquiry(payload: BookingInquiryCreate, db: Session = Depends(get_db)) -> dict:
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in.")
    return ge.create_inquiry(db, payload.model_dump())
