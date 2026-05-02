# Hotel Management & Analytics Product

## What is included

- FastAPI backend with:
  - PMS models: guests, room types, rooms, bookings
  - Analytics models: monthly revenue, cancellation summary, country summary
  - Competitor intelligence model for imported external data
  - Predictive pricing and cancellation-risk APIs
  - Promo email generation endpoint
- React + Vite + Tailwind frontend with:
  - Revenue summary card
  - High cancellation-risk alert list
  - Promo email generation action

## Backend run

```powershell
cd "D:\du lich"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
$env:PYTHONPATH="D:\du lich\backend"
python backend\scripts\seed_db.py
uvicorn app.main:app --reload --app-dir backend
```

## Frontend run

```powershell
cd "D:\du lich\frontend"
npm install
npm run dev
```

## Important environment values

- `DATABASE_URL`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_API_KEY`
- `OLLAMA_MODEL`
- `CORS_ORIGINS`

## Main API endpoints

- `GET /health`
- `GET /api/v1/dashboard`
- `POST /api/v1/ai/competitor-insights`
- `GET /api/v1/predictive/dynamic-price?room_id=1&target_date=2026-05-01`
- `POST /api/v1/predictive/cancellation-risk`
- `POST /api/v1/marketing/generate-promo-email`
