from __future__ import annotations

from datetime import date

from pydantic import BaseModel, EmailStr, Field


class NpsSubmit(BaseModel):
    booking_ref: str = Field(..., min_length=3)
    stars: int = Field(..., ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class AnonymousFeedbackCreate(BaseModel):
    message: str = Field(..., min_length=3, max_length=4000)
    area_name: str | None = Field(default=None, max_length=80)


class FolioAuditCreate(BaseModel):
    booking_ref: str = Field(..., min_length=3)
    actor_label: str = Field(default="Guest self-service", max_length=120)


class AppAnalyticsEventCreate(BaseModel):
    event_key: str = Field(..., min_length=2, max_length=64)
    booking_ref: str | None = Field(default=None, min_length=3)
    duration_ms: int | None = Field(default=None, ge=0, le=86_400_000)


class VoucherRedeem(BaseModel):
    booking_ref: str = Field(..., min_length=3)
    code: str = Field(..., min_length=2, max_length=40)


class BookingInquiryCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    check_in: date
    check_out: date
    guests: int = Field(default=2, ge=1, le=20)
    room_pref: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=2000)
    area_name: str = Field(default="Nha Trang", max_length=80)


class PinnedCompetitorUpdate(BaseModel):
    competitor_name: str = Field(..., min_length=2, max_length=160)
    area_name: str = Field(default="Nha Trang", max_length=80)
    price_hint_vnd: int = Field(default=0, ge=0)
    note: str | None = Field(default=None, max_length=400)
