from datetime import datetime

from sqlalchemy import JSON, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CompetitorData(Base):
    __tablename__ = "competitor_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(50), default="agoda", nullable=False, index=True)
    search_area: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hotel_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    current_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    availability_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hotel_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviews: Mapped[list[dict] | None] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
