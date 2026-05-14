from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.guest_engagement import (
    AnonymousFeedback,
    AppUsageEvent,
    BookingInquiry,
    GuestAuditLog,
    LocalMarketEvent,
    NpsSurvey,
    PinnedCompetitor,
    PromoVoucher,
    ServiceSlaLog,
)
from app.models.pms import Booking
from app.services import guest_app_service as gs


def _week_bounds_utc() -> tuple[datetime, datetime]:
    today = datetime.now(timezone.utc).date()
    wd = today.isoweekday()
    monday = today - timedelta(days=wd - 1)
    start = datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc)
    end = start + timedelta(days=7)
    return start, end


def submit_nps(db: Session, booking_ref: str, stars: int, comment: str | None, area_name: str = "Nha Trang") -> dict:
    row = NpsSurvey(booking_ref=booking_ref.strip(), stars=stars, comment=(comment or "").strip() or None, area_name=area_name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "id": row.id}


def nps_week_summary(db: Session) -> dict:
    start, end = _week_bounds_utc()
    rows = db.scalars(select(NpsSurvey).where(NpsSurvey.created_at >= start, NpsSurvey.created_at < end)).all()
    if not rows:
        return {
            "week_label": f"{start.date().isoformat()} → {(end - timedelta(days=1)).date().isoformat()}",
            "response_count": 0,
            "avg_stars": None,
            "nps_score": None,
            "promoters": 0,
            "passives": 0,
            "detractors": 0,
        }
    scores = [r.stars for r in rows]
    avg = sum(scores) / len(scores)
    # Map 1–5 stars to NPS-style buckets: 5 = promoter, 4 = passive, ≤3 = detractor (demo simplification)
    promoters = sum(1 for s in scores if s >= 5)
    passives = sum(1 for s in scores if s == 4)
    detractors = sum(1 for s in scores if s <= 3)
    nps = int(round((promoters - detractors) / len(scores) * 100))
    return {
        "week_label": f"{start.date().isoformat()} → {(end - timedelta(days=1)).date().isoformat()}",
        "response_count": len(rows),
        "avg_stars": round(avg, 2),
        "nps_score": nps,
        "promoters": promoters,
        "passives": passives,
        "detractors": detractors,
    }


def submit_anonymous_feedback(db: Session, message: str, area_name: str | None) -> dict:
    db.add(AnonymousFeedback(message=message.strip(), area_name=area_name.strip() if area_name else None))
    db.commit()
    return {"ok": True, "message": "Thank you — ops will review without storing your name."}


def log_folio_audit(db: Session, booking_ref: str, actor_label: str, detail: str | None = None) -> None:
    db.add(
        GuestAuditLog(
            booking_ref=booking_ref.strip(),
            action="folio_view",
            actor_label=actor_label[:120],
            detail=detail,
        ),
    )
    db.commit()


def log_app_event(db: Session, event_key: str, booking_ref: str | None, duration_ms: int | None) -> None:
    db.add(
        AppUsageEvent(
            event_key=event_key[:64],
            booking_ref=booking_ref.strip() if booking_ref else None,
            duration_ms=duration_ms,
        ),
    )
    db.commit()


def first_timer_guide(db: Session, booking: Booking) -> dict:
    tags = {t.lower() for t in gs.list_guest_tags(db, booking.guest_id)}
    segment = "business" if any(x in tags for x in ("business", "corporate", "work")) else "family"
    if "family" in tags or "kids" in str(tags):
        segment = "family"
    guides = {
        "family": {
            "segment": "family",
            "title": "First time in the city — family pace",
            "food": [
                {"name": "Beachfront brunch strip", "why": "Kid-friendly menus before 11 AM; high chairs common."},
                {"name": "Night market (Thu–Sun)", "why": "Street snacks + live music; go early to beat crowds."},
            ],
            "sights": [
                {"name": "Hon Mun marine park (half-day)", "why": "Snorkel + glass boat; book morning slots for calmer water."},
                {"name": "Po Nagar Cham towers", "why": "45 min cultural stop between beach and downtown."},
            ],
        },
        "business": {
            "segment": "business",
            "title": "First time — tight schedule",
            "food": [
                {"name": "Hotel club lounge breakfast", "why": "Fast protein + coffee; receipt-friendly for expense."},
                {"name": "Rooftop bar (walking distance)", "why": "One drink debrief; quieter on Tue/Wed."},
            ],
            "sights": [
                {"name": "Sunrise boardwalk jog", "why": "30 min loop near the hub; good before first meeting."},
                {"name": "Central co-working cafés", "why": "Backup Wi‑Fi + printing if you step out."},
            ],
        },
    }
    return {"booking_ref": booking.booking_id, **guides[segment]}


def time_based_upsells(hour_local: int | None = None) -> dict:
    h = hour_local if hour_local is not None else datetime.now().hour
    if 5 <= h < 11:
        bucket = "morning"
        picks = [
            {"id": "ups-breakfast", "title": "Breakfast bundle", "body": "Add buffet + coffee to-go for early departures.", "channel": "rule"},
            {"id": "ups-pool", "title": "Quiet pool hour", "body": "Adults-only lap lane 7–9 AM — limited passes.", "channel": "rule"},
        ]
    elif 11 <= h < 17:
        bucket = "afternoon"
        picks = [
            {"id": "ups-spa", "title": "Spa express", "body": "45-min shoulder release — slots open 2–5 PM.", "channel": "rule"},
            {"id": "ups-tea", "title": "Afternoon tea set", "body": "Pastries + sparkling for two on the terrace.", "channel": "rule"},
        ]
    else:
        bucket = "evening"
        picks = [
            {"id": "ups-roomsvc", "title": "Room service night menu", "body": "Chef’s late plate until 11 PM; allergy notes forwarded.", "channel": "rule"},
            {"id": "ups-bar", "title": "Nightcap flight", "body": "Three tasting pours at the lobby bar.", "channel": "rule"},
        ]
    return {"local_hour_used": h, "bucket": bucket, "upsells": picks}


def pricing_scenarios_mock() -> dict:
    return {
        "currency": "VND",
        "scenarios": [
            {
                "id": "early_long",
                "label": "Book early + stay 4+ nights",
                "occupancy_lift_pct": 12,
                "estimated_profit_index": 118,
                "notes": "Lower acquisition cost; housekeeping bundled efficiently.",
            },
            {
                "id": "walk_in",
                "label": "Walk-in / last room",
                "occupancy_lift_pct": 3,
                "estimated_profit_index": 92,
                "notes": "Higher OTA fee risk; upsell attach rate lower in demo model.",
            },
        ],
        "disclaimer": "Mock indices for demo — not audited financial advice.",
    }


def mock_price_heatmap() -> dict:
    zones = [
        {"zone": "Tran Phu beachfront", "median_adr_vnd": 2_450_000, "heat": 0.92},
        {"zone": "City center", "median_adr_vnd": 1_780_000, "heat": 0.74},
        {"zone": "Hon Tre cable area", "median_adr_vnd": 3_100_000, "heat": 0.88},
        {"zone": "Airport corridor", "median_adr_vnd": 920_000, "heat": 0.41},
        {"zone": "North bay villas", "median_adr_vnd": 4_200_000, "heat": 0.65},
        {"zone": "University district", "median_adr_vnd": 680_000, "heat": 0.36},
    ]
    return {"area": "Nha Trang", "as_of": date.today().isoformat(), "zones": zones, "note": "Seeded competitor blend + synthetic spread."}


def list_vouchers(db: Session) -> list[dict]:
    today = date.today()
    rows = db.scalars(select(PromoVoucher).where(PromoVoucher.expires_on >= today).order_by(PromoVoucher.expires_on)).all()
    return [
        {
            "code": r.code,
            "title": r.title,
            "remaining": max(0, r.max_uses - r.used_count),
            "expires_on": r.expires_on.isoformat(),
            "discount_label": r.discount_label,
        }
        for r in rows
    ]


def redeem_voucher(db: Session, code: str, booking_ref: str) -> dict:
    c = (code or "").strip().upper()
    row = db.scalar(select(PromoVoucher).where(PromoVoucher.code == c))
    if row is None:
        return {"ok": False, "message": "Code not found."}
    if row.expires_on < date.today():
        return {"ok": False, "message": "Code expired."}
    if row.used_count >= row.max_uses:
        return {"ok": False, "message": "Code fully redeemed."}
    row.used_count += 1
    db.add(
        GuestAuditLog(
            booking_ref=booking_ref.strip(),
            action="voucher_redeem",
            actor_label="Guest app",
            detail=json.dumps({"code": c, "title": row.title}, ensure_ascii=False),
        ),
    )
    db.commit()
    return {"ok": True, "message": f"Applied {row.title} to booking {booking_ref} (demo).", "remaining": row.max_uses - row.used_count}


def create_inquiry(db: Session, payload: dict) -> dict:
    row = BookingInquiry(
        full_name=payload["full_name"],
        email=str(payload["email"]),
        check_in=payload["check_in"],
        check_out=payload["check_out"],
        guests=int(payload["guests"]),
        room_pref=payload.get("room_pref"),
        notes=payload.get("notes"),
        area_name=payload.get("area_name") or "Nha Trang",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "inquiry_id": row.id, "message": "Thanks — reservations will email you within 24h (demo)."}


def list_local_events(db: Session, area: str = "Nha Trang", days: int = 45) -> list[dict]:
    end = date.today() + timedelta(days=days)
    rows = db.scalars(
        select(LocalMarketEvent)
        .where(LocalMarketEvent.area_name == area, LocalMarketEvent.event_date <= end)
        .order_by(LocalMarketEvent.event_date),
    ).all()
    return [
        {
            "title": r.title,
            "event_date": r.event_date.isoformat(),
            "ends_on": r.ends_on.isoformat() if r.ends_on else None,
            "demand_note": r.demand_note,
            "expected_lift_pct": r.expected_lift_pct,
        }
        for r in rows
    ]


def get_pinned_competitor(db: Session) -> dict:
    row = db.get(PinnedCompetitor, 1)
    if row is None:
        return {
            "competitor_name": "Seaside Haven Resort",
            "area_name": "Nha Trang",
            "price_hint_vnd": 2_190_000,
            "note": "Pin a property in Ops dashboard.",
        }
    return {
        "competitor_name": row.competitor_name,
        "area_name": row.area_name,
        "price_hint_vnd": row.price_hint_vnd,
        "note": row.note,
    }


def set_pinned_competitor(db: Session, data: dict) -> dict:
    row = db.get(PinnedCompetitor, 1)
    if row is None:
        row = PinnedCompetitor(id=1)
        db.add(row)
    row.competitor_name = data["competitor_name"]
    row.area_name = data.get("area_name") or "Nha Trang"
    row.price_hint_vnd = int(data.get("price_hint_vnd") or 0)
    row.note = data.get("note")
    db.commit()
    return get_pinned_competitor(db)


def app_usage_summary(db: Session) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    total = db.scalar(select(func.count()).select_from(AppUsageEvent).where(AppUsageEvent.created_at >= since)) or 0
    stmt = (
        select(AppUsageEvent.event_key, func.count())
        .where(AppUsageEvent.created_at >= since)
        .group_by(AppUsageEvent.event_key)
        .order_by(func.count().desc())
        .limit(12)
    )
    by_key = {row[0]: int(row[1]) for row in db.execute(stmt).all()}
    sessions = db.scalar(
        select(func.count())
        .select_from(AppUsageEvent)
        .where(AppUsageEvent.created_at >= since, AppUsageEvent.event_key == "screen_view"),
    ) or 0
    return {"window_days": 7, "events_total": int(total), "screen_views": int(sessions), "top_event_keys": by_key}


def service_sla_summary(db: Session) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=14)
    rows = db.scalars(select(ServiceSlaLog).where(ServiceSlaLog.requested_at >= since)).all()
    if not rows:
        return {"window_days": 14, "samples": 0, "by_service": {}}
    by_svc: dict[str, list[float]] = {}
    for r in rows:
        if r.response_minutes is None:
            continue
        by_svc.setdefault(r.service_type, []).append(float(r.response_minutes))
    out = {}
    for k, vals in by_svc.items():
        out[k] = {"avg_minutes": round(sum(vals) / len(vals), 1), "count": len(vals)}
    return {"window_days": 14, "samples": len(rows), "by_service": out}


def recent_audit_tail(db: Session, limit: int = 25) -> list[dict]:
    rows = db.scalars(select(GuestAuditLog).order_by(GuestAuditLog.created_at.desc()).limit(limit)).all()
    return [
        {
            "booking_ref": r.booking_ref,
            "action": r.action,
            "actor_label": r.actor_label,
            "detail": r.detail,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


def experience_insights_pack(db: Session) -> dict:
    return {
        "nps_week": nps_week_summary(db),
        "app_usage": app_usage_summary(db),
        "service_sla": service_sla_summary(db),
        "heatmap": mock_price_heatmap(),
        "pricing_scenarios": pricing_scenarios_mock(),
        "local_events": list_local_events(db),
        "pinned_competitor": get_pinned_competitor(db),
        "recent_audits": recent_audit_tail(db, 20),
        "anonymous_feedback_count_7d": db.scalar(
            select(func.count()).select_from(AnonymousFeedback).where(
                AnonymousFeedback.created_at >= datetime.now(timezone.utc) - timedelta(days=7),
            ),
        )
        or 0,
    }
