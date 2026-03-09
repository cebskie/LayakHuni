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
    for f in ['db/migrations/1_init.sql','db/migrations/2_triggers.sql','db/migrations/3_ocr_fields.sql']:
        with open(f) as file:
            sql = file.read()
        async with engine.connect() as conn:
            await conn.execute(text(sql))
            await conn.commit()
    await engine.dispose()

asyncio.run(migrate())
"

echo "Running seed..."
python -m db.seeds.seed

echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000