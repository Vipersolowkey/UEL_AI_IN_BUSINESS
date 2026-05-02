from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.competitor_data import CompetitorData


def _to_decimal(value) -> Decimal | None:
    if value in (None, "", False):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _build_reviews(top_reviews: list[str] | None) -> list[dict]:
    reviews: list[dict] = []
    for comment in top_reviews or []:
        if not comment:
            continue
        reviews.append({"reviewer": None, "review_date": None, "comment": str(comment).strip()})
    return reviews


def _infer_source(path: Path) -> str:
    name = path.stem.lower()
    if "agoda" in name:
        return "agoda_json_import"
    if "booking" in name:
        return "booking_json_import"
    return "competitor_json_import"


def _normalize_availability(value) -> tuple[str, dict]:
    metadata: dict = {}
    if isinstance(value, bool):
        return ("available" if value else "unavailable"), metadata
    if isinstance(value, list):
        metadata["availability_items"] = value
        return ("available" if value else "unavailable"), metadata
    if isinstance(value, dict):
        metadata["availability_details"] = value
        return "available", metadata
    if value is None:
        return "unknown", metadata
    return str(value).strip(), metadata


def load_competitor_records_from_json(json_path: str | Path) -> list[dict]:
    path = Path(json_path)
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    if not isinstance(payload, list):
        raise ValueError("Expected competitor JSON to be a list of hotel objects.")

    source_name = _infer_source(path)

    records: list[dict] = []
    for item in payload:
        if not isinstance(item, dict):
            continue

        hotel_name = str(item.get("title") or "").strip()
        if not hotel_name:
            continue

        city = str(item.get("city") or "").strip()
        country = str(item.get("country") or "").strip()
        search_area = city or country or "Unknown"

        current_price = None
        currency = None

        if isinstance(item.get("price"), dict):
            price_obj = item["price"]
            current_price = _to_decimal(price_obj.get("value"))
            currency = price_obj.get("currency")
        elif "display_price" in item:
            current_price = _to_decimal(item.get("display_price"))
        elif "price" in item and not isinstance(item.get("price"), (dict, list)):
            current_price = _to_decimal(item.get("price"))

        availability_status, availability_metadata = _normalize_availability(item.get("availability"))

        reviews = _build_reviews(item.get("top_reviews"))

        metadata = {
            "city": city or None,
            "country": country or None,
            "review_score": item.get("review_score"),
            "number_of_reviews": item.get("number_of_reviews"),
            "rooms_available": item.get("rooms_available"),
        }
        metadata.update(availability_metadata)

        if reviews and reviews[0].get("comment"):
            reviews[0]["metadata"] = metadata
        elif metadata:
            reviews.append({"reviewer": None, "review_date": None, "comment": None, "metadata": metadata})

        records.append(
            {
                "source": source_name,
                "search_area": search_area,
                "hotel_name": hotel_name,
                "current_price": current_price,
                "currency": currency,
                "availability_status": availability_status,
                "hotel_url": item.get("url"),
                "reviews": reviews,
            }
        )

    return records


def import_competitor_json(
    db: Session,
    json_path: str | Path,
    replace_existing: bool = True,
) -> int:
    records = load_competitor_records_from_json(json_path)

    if replace_existing:
        db.query(CompetitorData).delete()

    for record in records:
        db.add(CompetitorData(**record))

    db.commit()
    return len(records)


def import_multiple_competitor_json_files(
    db: Session,
    json_paths: list[str | Path],
    replace_existing: bool = True,
) -> int:
    if replace_existing:
        db.query(CompetitorData).delete()

    total_imported = 0
    for json_path in json_paths:
        records = load_competitor_records_from_json(json_path)
        for record in records:
            db.add(CompetitorData(**record))
        total_imported += len(records)

    db.commit()
    return total_imported
