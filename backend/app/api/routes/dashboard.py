from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analytics import MonthlyRevenueSummary
from app.models.pms import Booking, Guest, Room, RoomType
from app.schemas.dashboard import CancellationAlert, DashboardResponse, MonthlyRevenueCard
from app.services.predictive import predict_cancellation_risk


def get_dashboard_payload(db: Session, area_name: str = "Nha Trang") -> DashboardResponse:
    latest_month = db.scalar(
        select(MonthlyRevenueSummary).order_by(MonthlyRevenueSummary.year.desc(), MonthlyRevenueSummary.id.desc())
    )
    if latest_month is None:
        monthly_revenue = MonthlyRevenueCard(
            month_label="No data",
            total_revenue=0,
            average_adr=0,
            average_stay_nights=0,
            growth_percent=0,
        )
    else:
        previous_month = db.scalar(
            select(MonthlyRevenueSummary)
            .where(MonthlyRevenueSummary.id != latest_month.id)
            .order_by(MonthlyRevenueSummary.year.desc(), MonthlyRevenueSummary.id.desc())
        )
        growth_percent = 0
        if previous_month and previous_month.total_estimated_revenue:
            growth_percent = (
                (latest_month.total_estimated_revenue - previous_month.total_estimated_revenue)
                / previous_month.total_estimated_revenue
            ) * 100
            growth_percent = Decimal(growth_percent).quantize(Decimal("0.01"))

        monthly_revenue = MonthlyRevenueCard(
            month_label=f"{latest_month.month_name} {latest_month.year}",
            total_revenue=latest_month.total_estimated_revenue,
            average_adr=latest_month.avg_adr,
            average_stay_nights=latest_month.avg_stay_nights,
            growth_percent=growth_percent,
        )

    stmt = (
        select(Booking, Guest, RoomType)
        .join(Guest, Guest.id == Booking.guest_id)
        .join(Room, Room.id == Booking.room_id)
        .join(RoomType, RoomType.id == Room.room_type_id)
        .order_by(Booking.check_in.desc())
        .limit(30)
    )

    alerts: list[CancellationAlert] = []
    for booking, guest, room_type in db.execute(stmt).all():
        prediction = predict_cancellation_risk(
            {
                "room_id": booking.room_id,
                "check_in": booking.check_in,
                "check_out": booking.check_out,
                "total_price": booking.total_price,
            },
            db=db,
            area_name=area_name,
        )
        if prediction["cancellation_risk"] != "HIGH":
            continue

        alerts.append(
            CancellationAlert(
                booking_id=booking.booking_id,
                guest_name=guest.full_name or f"Guest {guest.id}",
                guest_email=guest.email or f"guest{guest.id}@example.com",
                room_type=room_type.name,
                stay_dates=f"{booking.check_in.isoformat()} to {booking.check_out.isoformat()}",
                booked_price=booking.total_price,
                competitor_price=prediction.get("competitor_avg_nightly_rate"),
                risk=prediction["cancellation_risk"],
            )
        )

    return DashboardResponse(monthly_revenue=monthly_revenue, alerts=alerts[:10])
