from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MonthlyRevenueSummary(Base):
    __tablename__ = "monthly_revenue_summary"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    month_name: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    total_estimated_revenue: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    avg_adr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    avg_stay_nights: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CancellationSummary(Base):
    __tablename__ = "cancellation_summary"

    id: Mapped[int] = mapped_column(primary_key=True)
    hotel: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    market_segment: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    deposit_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    total_bookings: Mapped[int] = mapped_column(Integer, nullable=False)
    canceled_bookings: Mapped[int] = mapped_column(Integer, nullable=False)
    cancellation_rate_pct: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)


class CountrySummary(Base):
    __tablename__ = "country_summary"

    id: Mapped[int] = mapped_column(primary_key=True)
    country: Mapped[str] = mapped_column(String(3), nullable=False, index=True, unique=True)
    total_bookings: Mapped[int] = mapped_column(Integer, nullable=False)
    successful_bookings: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_adr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
