"""Guest app: stay timeline, folio, segment offers, dining/HK requests."""

from __future__ import annotations

import json
import logging
from collections.abc import Iterator
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.guest_experience import GuestFolioLine, RoomHousekeepingState
from app.models.pms import Booking, Guest, Room, RoomType
from app.models.property_ops import GuestNote, GuestTag, GuestTimelineEvent, Property
from app.services.guest_advisor import describe_booking_room_assignment, get_room_catalog_for_concierge

STAY_EVENTS = (
    ("stay_app_checkin_started", "checkin", "Check-in started", "Check-in in progress"),
    ("stay_app_room_ready", "room_ready", "Room ready", "Room is ready"),
    ("stay_app_in_room", "in_room", "In room", "In room"),
    ("stay_app_checkout_done", "checkout", "Checked out", "Checked out"),
)

STEP_TO_EVENT = {row[1]: row[0] for row in STAY_EVENTS}
EVENT_TO_STEP = {row[0]: row[1] for row in STAY_EVENTS}


def _today() -> date:
    return datetime.now(timezone.utc).date()


def today_iso() -> str:
    return _today().isoformat()


def get_or_create_room_housekeeping(db: Session, room_id: int) -> RoomHousekeepingState:
    return _hk_for_room(db, room_id)


def get_booking_by_ref(db: Session, booking_ref: str) -> Booking | None:
    ref = (booking_ref or "").strip()
    if not ref:
        return None
    return db.scalar(
        select(Booking)
        .options(joinedload(Booking.guest), joinedload(Booking.room).joinedload(Room.room_type))
        .where(Booking.booking_id == ref),
    )


def _hk_for_room(db: Session, room_id: int) -> RoomHousekeepingState:
    row = db.get(RoomHousekeepingState, room_id)
    if row is None:
        row = RoomHousekeepingState(room_id=room_id, status="clean", last_note=None)
        db.add(row)
        db.flush()
    return row


def _stay_events_for_guest(db: Session, guest_id: int) -> dict[str, GuestTimelineEvent]:
    types = [t[0] for t in STAY_EVENTS]
    rows = db.scalars(
        select(GuestTimelineEvent)
        .where(GuestTimelineEvent.guest_id == guest_id, GuestTimelineEvent.event_type.in_(types))
        .order_by(GuestTimelineEvent.occurred_at.asc()),
    ).all()
    # latest event per type wins for "done" set
    out: dict[str, GuestTimelineEvent] = {}
    for r in rows:
        out[r.event_type] = r
    return out


def _step_done(booking: Booking, events_by_type: dict[str, GuestTimelineEvent], event_type: str, step_key: str) -> bool:
    if step_key == "checkout":
        return event_type in events_by_type or booking.status == "checked_out"
    if step_key == "in_room":
        return event_type in events_by_type or booking.status in ("checked_in", "checked_out")
    if step_key == "room_ready":
        return event_type in events_by_type
    if step_key == "checkin":
        return event_type in events_by_type
    return False


def compute_stay_phase(booking: Booking, events_by_type: dict[str, GuestTimelineEvent]) -> tuple[str, list[dict[str, Any]]]:
    """Returns phase_key and UI steps with state done|current|upcoming."""
    steps: list[dict[str, Any]] = []
    for event_type, step_key, en, vi in STAY_EVENTS:
        done = _step_done(booking, events_by_type, event_type, step_key)
        steps.append({"key": step_key, "event_type": event_type, "label_en": en, "label_vi": vi, "state": "done" if done else "upcoming"})

    first_open = next((i for i, s in enumerate(steps) if s["state"] != "done"), None)
    if first_open is not None:
        steps[first_open]["state"] = "current"

    if all(s["state"] == "done" for s in steps):
        phase = "completed"
    elif first_open is None:
        phase = "completed"
    else:
        phase = steps[first_open]["key"]

    return phase, steps


def get_timeline_view(db: Session, booking: Booking) -> dict[str, Any]:
    events = _stay_events_for_guest(db, booking.guest_id)
    phase, steps = compute_stay_phase(booking, events)
    return {"booking_ref": booking.booking_id, "stay_phase_key": phase, "stay_steps": steps}


def build_session_payload(db: Session, booking: Booking) -> dict[str, Any]:
    guest = booking.guest
    room = booking.room
    rt = room.room_type
    prop = db.get(Property, room.property_id)
    events = _stay_events_for_guest(db, booking.guest_id)
    phase, steps = compute_stay_phase(booking, events)

    folio_rows = list(db.scalars(select(GuestFolioLine).where(GuestFolioLine.booking_id == booking.id)).all())
    extras = sum((r.amount for r in folio_rows), Decimal("0"))
    hk = _hk_for_room(db, room.id)

    return {
        "booking_ref": booking.booking_id,
        "guest_name": guest.full_name if guest else None,
        "room_number": room.room_number,
        "property_name": prop.name if prop else None,
        "check_in": booking.check_in.isoformat(),
        "check_out": booking.check_out.isoformat(),
        "booking_status": booking.status,
        "stay_phase_key": phase,
        "stay_steps": steps,
        "folio_lines_count": len(folio_rows),
        "folio_lines": [
            {
                "id": r.id,
                "category": r.category,
                "description": r.description,
                "amount": str(r.amount),
                "created_at": r.created_at.isoformat(),
            }
            for r in folio_rows
        ],
        "folio_extras_total": str(extras),
        "room_rate_total": str(booking.total_price),
        "bill_estimated_total": str((booking.total_price + extras).quantize(Decimal("0.01"))),
        "housekeeping_room_status": hk.status,
    }


def advance_timeline(db: Session, booking: Booking, step: str) -> dict[str, Any]:
    et = STEP_TO_EVENT.get(step)
    if not et:
        raise ValueError("invalid step")
    db.add(
        GuestTimelineEvent(
            guest_id=booking.guest_id,
            event_type=et,
            detail=f"Guest app: {step}",
        ),
    )
    if step == "in_room":
        booking.status = "checked_in"
    if step == "checkout":
        booking.status = "checked_out"
    db.flush()
    db.refresh(booking)
    return build_session_payload(db, booking)


def list_guest_tags(db: Session, guest_id: int) -> list[str]:
    return [r.tag for r in db.scalars(select(GuestTag).where(GuestTag.guest_id == guest_id)).all()]


def build_segment_offers(tags: list[str]) -> list[dict[str, Any]]:
    tags_l = {t.lower() for t in tags}
    offers: list[dict[str, Any]] = []
    if "family" in tags_l or any("kid" in t for t in tags_l):
        offers.append(
            {
                "id": "seg-family",
                "segment": "family",
                "title": "Family arrival pack",
                "body": "Kids welcome kit + late checkout request priority. Book kids club slot before 4 PM.",
                "cta": "Reserve kids club",
                "price_hint": "From 150,000 VND",
            },
        )
    if any(x in tags_l for x in ("romance package", "anniversary", "honeymoon")):
        offers.append(
            {
                "id": "seg-romance",
                "segment": "anniversary",
                "title": "Anniversary sparkle",
                "body": "Sparkling wine + room petals + couple spa slot (45 min).",
                "cta": "Add romance bundle",
                "price_hint": "From 890,000 VND",
            },
        )
    offers.append(
        {
            "id": "seg-default",
            "segment": "general",
            "title": "Rooftop happy hour",
            "body": "Tonight 2-for-1 cocktails 5–7 PM — seats limited.",
            "cta": "Hold two seats",
            "price_hint": "5:00–7:00 PM",
        },
    )
    return offers


def dining_request_note(payload: dict[str, Any]) -> str:
    return json.dumps({"kind": "dining_request", **payload}, ensure_ascii=False)


def housekeeping_request_note(payload: dict[str, Any]) -> str:
    return json.dumps({"kind": "housekeeping_request", **payload}, ensure_ascii=False)


def room_board_rows(db: Session, property_id: int, today: date | None = None) -> list[dict[str, Any]]:
    today = today or _today()
    rooms = db.scalars(select(Room).where(Room.property_id == property_id).order_by(Room.room_number)).all()
    rows: list[dict[str, Any]] = []
    for room in rooms:
        hk = db.get(RoomHousekeepingState, room.id)
        hk_status = hk.status if hk else "clean"
        stmt = (
            select(Booking, Guest)
            .join(Guest, Guest.id == Booking.guest_id)
            .where(
                Booking.room_id == room.id,
                Booking.status.in_(["confirmed", "checked_in"]),
                Booking.check_in <= today,
                Booking.check_out > today,
            )
        )
        hit = db.execute(stmt).first()
        guest_name = None
        booking_ref = None
        stay_state = "vacant"
        if hit:
            b, g = hit
            guest_name = g.full_name
            booking_ref = b.booking_id
            stay_state = "occupied" if b.status == "checked_in" else "reserved"
        rows.append(
            {
                "room_id": room.id,
                "room_number": room.room_number,
                "room_pms_status": room.status,
                "housekeeping_status": hk_status,
                "stay_state": stay_state,
                "guest_name": guest_name,
                "booking_ref": booking_ref,
            },
        )
    return rows


def bill_export_text(payload: dict[str, Any]) -> str:
    lines = ["--- GUEST FOLIO PREVIEW ---", f"Booking: {payload['booking_ref']}", f"Guest: {payload.get('guest_name')}"]
    lines.append(f"Room: {payload['room_number']}")
    lines.append(f"Stay: {payload['check_in']} → {payload['check_out']}")
    lines.append(f"Room package total: {payload['room_rate_total']}")
    for item in payload.get("folio_lines", []):
        lines.append(f"  + [{item['category']}] {item['description']}: {item['amount']}")
    lines.append(f"Extras subtotal: {payload['folio_extras_total']}")
    lines.append(f"Estimated bill total: {payload['bill_estimated_total']}")
    lines.append("(Demo — not a tax invoice.)")
    return "\n".join(lines)


def _concierge_heuristic_reply(message: str) -> str:
    """Offline replies when no LLM provider is configured."""
    raw = (message or "").strip()
    m = raw.lower()
    if any(k in m for k in ("wifi", "wi-fi", "internet", "mạng")):
        return (
            "Guest Wi‑Fi: connect to **AzurePearl-Guest**, open the captive portal, and accept the terms. "
            "If it does not pop up, try forgetting the network once or ask the front desk for today's access card."
        )
    if any(
        k in m
        for k in (
            "towel",
            "pillow",
            "clean",
            "housekeep",
            "dọn",
            "gối",
            "khăn",
            "buồng phòng",
            "housekeeping",
        )
    ):
        return (
            "You can request housekeeping from the **Me** tab (notes optional). "
            "For urgent turndown or extra amenities, dial **0** and the front desk will coordinate."
        )
    if any(k in m for k in ("checkout", "late", "trả phòng", "check-out", "check out")):
        return (
            "Standard checkout time is shown on your stay overview. "
            "Late checkout depends on availability — ask front desk or mention it here and they will confirm."
        )
    if any(k in m for k in ("bill", "folio", "charge", "payment", "thanh toán", "hóa đơn")):
        return (
            "Open **Me** to preview or download your folio (room package plus extras). "
            "For disputes or tax invoices, front desk can adjust after verifying charges."
        )
    if any(k in m for k in ("restaurant", "dine", "food", "room service", "nhà hàng", "ăn", "đặt món")):
        return (
            "Use the **Dine** tab for room-service style items and to send a restaurant time request. "
            "Allergies and party size are forwarded to the kitchen queue in this demo."
        )
    if any(k in m for k in ("spa", "massage")):
        return "Spa offers often appear under **Offers**; you can also tap **Book spa** on Home. Front desk can hold a slot if the app is busy."
    if any(k in m for k in ("noise", "ồn", "loud", "neighbor")):
        return "Sorry for the disturbance — please dial **0** so duty manager can quiet the floor or move you if needed."
    if any(k in m for k in ("emergency", "medical", "khẩn cấp", "cấp cứu", "911", "113")):
        return "For emergencies or medical help, call **0** from your room phone or local emergency services immediately. This chat is not monitored for life-safety."
    if any(
        k in m
        for k in (
            "upgrade",
            "nâng cấp",
            "đổi phòng",
            "room type",
            "chọn phòng",
            "so sánh phòng",
            "deluxe",
            "suite",
            "compare room",
            "which room",
            "đặt phòng",
        )
    ):
        return (
            "For **choosing or comparing room categories** with the demo price list, use Ops **Sales AI** in the browser "
            "or dial **0** for live availability. Turn the LLM on in this chat to get a short summary from the seeded "
            "room catalog only — figures are not a binding quote."
        )
    return (
        "Thanks for your message — a host can help in person 24/7 at the front desk (dial **0** from your room). "
        "This demo concierge works best for Wi‑Fi, housekeeping, dining, checkout, billing, and room-type questions "
        "(with LLM: uses catalog from the database)."
    )


def build_concierge_llm_parts(
    db: Session,
    booking: Booking,
    message: str,
    history: list[dict[str, str]],
) -> tuple[str, str, dict[str, Any]]:
    snap = build_session_payload(db, booking)
    ctx_block = {
        "guest_name": snap.get("guest_name"),
        "room_number": snap["room_number"],
        "booking_ref": snap["booking_ref"],
        "property_name": snap.get("property_name"),
        "check_in": snap["check_in"],
        "check_out": snap["check_out"],
        "housekeeping_room_status": snap.get("housekeeping_room_status"),
        "folio_extras_total": snap.get("folio_extras_total"),
    }
    room_catalog = get_room_catalog_for_concierge(db)
    current_room = describe_booking_room_assignment(booking)
    system_prompt = (
        "You are Azure Pearl's digital concierge (CSKH), powered by the hotel's configured LLM. "
        "You handle BOTH in-stay service and **room-type advice** like a reservations colleague.\n"
        "**In-stay (default):** Wi‑Fi, dining / Dine tab, spa, housekeeping, checkout timing, folio / billing, noise — "
        "ground answers in verified_guest_context (dates, folio extras, HK status). Do not invent charges not implied there.\n"
        "**Room selection / upgrade / compare:** When the guest asks to choose, compare, upgrade, or recommend a room "
        "(including for a friend or a future stay), use ONLY entries in `room_catalog` (code, display_name, demo_base_price_per_night). "
        "Never invent a room category not in that JSON list. Clearly say prices are **demo seed values**, not a tax "
        "invoice or live BAR/availability — final confirmation is front desk (dial 0) or the Ops **Sales AI** screen for a full sales script.\n"
        "Reference `current_room_assignment` when explaining what they already have vs a suggested upgrade.\n"
        "Do not aggressively pitch unrelated new hotel packages when they only ask for towels or Wi‑Fi.\n"
        "For medical or life-safety emergencies, tell them to dial 0 from the room phone.\n"
        "Replies: about 2–6 short sentences unless they ask for detail. Match the guest's language (English or Vietnamese)."
    )
    prompt = json.dumps(
        {
            "verified_guest_context": ctx_block,
            "current_room_assignment": current_room,
            "room_catalog": room_catalog,
            "catalog_note": "room_catalog.demo_base_price_per_night comes from seeded room_types; not live inventory.",
            "recent_history": history[-12:],
            "latest_guest_message": (message or "").strip(),
        },
        ensure_ascii=False,
    )
    meta = {
        "concierge_channel": "in_stay",
        "booking_ref": snap["booking_ref"],
        "room_number": snap["room_number"],
    }
    return prompt, system_prompt, meta


def concierge_chat_turn(
    db: Session,
    booking: Booking,
    message: str,
    history: list[dict[str, str]],
) -> dict[str, Any]:
    from app.services.llm import LlmUnavailableError, generate_text

    prompt, system_prompt, _meta = build_concierge_llm_parts(db, booking, message, history)
    try:
        reply, model_used = generate_text(prompt=prompt, system_prompt=system_prompt)
        text = (reply or "").strip()
        if not text:
            return {"reply": _concierge_heuristic_reply(message), "model_used": "heuristic_fallback"}
        return {"reply": text, "model_used": model_used}
    except LlmUnavailableError:
        return {"reply": _concierge_heuristic_reply(message), "model_used": "heuristic_fallback"}


def iter_concierge_chat_sse(
    db: Session,
    booking: Booking,
    message: str,
    history: list[dict[str, str]],
) -> Iterator[str]:
    """Server-Sent Events for guest concierge: streams LLM tokens; falls back to heuristics without LLM."""
    from app.services.llm import LlmUnavailableError, stream_text

    def sse(payload: dict[str, Any]) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    prompt, system_prompt, meta = build_concierge_llm_parts(db, booking, message, history)
    yield sse({"type": "meta", **meta})
    try:
        iterator, model_used = stream_text(prompt=prompt, system_prompt=system_prompt)
        yield sse({"type": "model", "model_used": model_used})
        had_chunk = False
        for chunk in iterator:
            if not chunk:
                continue
            had_chunk = True
            yield sse({"type": "chunk", "content": chunk})
        if not had_chunk:
            yield sse({"type": "chunk", "content": _concierge_heuristic_reply(message)})
    except LlmUnavailableError:
        yield sse({"type": "model", "model_used": "heuristic_fallback"})
        yield sse({"type": "chunk", "content": _concierge_heuristic_reply(message)})
    except Exception as exc:
        logger.exception("concierge_chat_stream failure booking=%s", booking.booking_id)
        yield sse({"type": "model", "model_used": "heuristic_fallback"})
        yield sse({"type": "chunk", "content": _concierge_heuristic_reply(message)})
    yield sse({"type": "done"})
