#!/bin/bash
set -e

echo "Running migrations..."
psql ${DATABASE_URL/asyncpg/} -f db/migrations/1_init.sql
psql ${DATABASE_URL/asyncpg/} -f db/migrations/2_triggers.sql  
psql ${DATABASE_URL/asyncpg/} -f db/migrations/3_ocr_fields.sql

echo "Running seed..."
python -m db.seeds.seed

echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000