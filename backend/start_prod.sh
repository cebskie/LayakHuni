#!/bin/bash
set -e

echo "Running migrations..."
python -c "
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    engine = create_async_engine(os.environ['DATABASE_URL'])
    async with engine.begin() as conn:
        with open('db/migrations/1_init.sql') as f:
            await conn.execute(text(f.read()))
        with open('db/migrations/2_triggers.sql') as f:
            await conn.execute(text(f.read()))
        with open('db/migrations/3_ocr_fields.sql') as f:
            await conn.execute(text(f.read()))
    await engine.dispose()

asyncio.run(migrate())
"

echo "Running seed..."
python -m db.seeds.seed

echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
