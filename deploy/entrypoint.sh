#!/bin/sh
set -e
# SQLite DATABASE_URL like sqlite:////data/app.db needs /data to exist (Render has no volume unless attached).
mkdir -p /data

cd /app/backend
export PYTHONPATH=/app/backend

nginx

exec uvicorn app.main:app --host 127.0.0.1 --port 8000
