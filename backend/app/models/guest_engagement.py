"""Guest engagement: NPS, feedback, audits, promos, analytics (demo data)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class NpsSurvey(Base):
    __tablename__ = "nps_surveys"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    area_name: Mapped[str] = mapped_column(String(80), nullable=False, default="Nha Trang")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AnonymousFeedback(Base):
    __tablename__ = "anonymous_feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    area_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class GuestAuditLog(Base):
    """Demo: who accessed guest folio / sensitive views."""

    __tablename__ = "guest_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_label: Mapped[str] = mapped_column(String(120), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PromoVoucher(Base):
    __tablename__ = "promo_vouchers"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expires_on: Mapped[date] = mapped_column(Date, nullable=False)
    discount_label: Mapped[str] = mapped_column(String(80), nullable=False)


class LocalMarketEvent(Base):
    __tablename__ = "local_market_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_name: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    ends_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    demand_note: Mapped[str] = mapped_column(String(400), nullable=False)
    expected_lift_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=15)


class AppUsageEvent(Base):
    __tablename__ = "app_usage_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    booking_ref: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ServiceSlaLog(Base):
    """Fulfilment time for dining / HK style requests (demo)."""

    __tablename__ = "service_sla_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    booking_ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_minutes: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)


class BookingInquiry(Base):
    """New guest — lead form (not a confirmed booking)."""

    __tablename__ = "booking_inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    guests: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    room_pref: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    area_name: Mapped[str] = mapped_column(String(80), nullable=False, default="Nha Trang")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PinnedCompetitor(Base):
    """Single-row pin for Overview sidebar (id=1)."""

    __tablename__ = "pinned_competitors"

    id: Mapped[int] = mapped_column(primary_key=True)
    competitor_name: Mapped[str] = mapped_column(String(160), nullable=False)
    area_name: Mapped[str] = mapped_column(String(80), nullable=False)
    price_hint_vnd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    note: Mapped[str | None] = mapped_column(String(400), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
