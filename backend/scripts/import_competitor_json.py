from __future__ import annotations

import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import Base, SessionLocal, engine
from app.services.competitor_import import import_multiple_competitor_json_files


DEFAULT_JSON_PATHS = [
    Path(r"C:\Users\Vinh\Downloads\Agoda Properties Listings.json"),
    Path(r"C:\Users\Vinh\Downloads\Booking Hotel Listings .json"),
]


def discover_default_json_paths() -> list[Path]:
    downloads_dir = Path(r"C:\Users\Vinh\Downloads")
    if not downloads_dir.exists():
        return DEFAULT_JSON_PATHS

    candidates = list(downloads_dir.glob("*.json"))

    def find_first(patterns: list[str]) -> Path | None:
        for candidate in candidates:
            lowered = candidate.name.lower()
            if all(pattern in lowered for pattern in patterns):
                return candidate
        return None

    agoda = find_first(["agoda", "listing"])
    booking = find_first(["booking", "listing"])

    resolved: list[Path] = []
    if agoda is not None:
        resolved.append(agoda)
    if booking is not None:
        resolved.append(booking)

    return resolved or DEFAULT_JSON_PATHS


def main() -> None:
    json_paths = [Path(arg) for arg in sys.argv[1:]] if len(sys.argv) > 1 else discover_default_json_paths()

    missing_paths = [path for path in json_paths if not path.exists()]
    if missing_paths:
        missing = ", ".join(str(path) for path in missing_paths)
        raise FileNotFoundError(f"Competitor JSON file not found: {missing}")

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        imported = import_multiple_competitor_json_files(
            db=db,
            json_paths=json_paths,
            replace_existing=True,
        )

    print(f"Imported {imported} competitor records from {len(json_paths)} JSON files")


if __name__ == "__main__":
    main()
