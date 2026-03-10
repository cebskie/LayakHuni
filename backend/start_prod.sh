#!/bin/bash
set -e

echo "Running migrations..."
python -c "
import asyncio
import os
import asyncpg

async def migrate():
    url = os.environ['DATABASE_URL'].replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url)
    for f in ['db/migrations/1_init.sql', 'db/migrations/2_triggers.sql', 'db/migrations/3_ocr_fields.sql']:
        with open(f) as file:
            sql = file.read()
        await conn.execute(sql)
        print(f'✅ {f} done')
    await conn.close()

asyncio.run(migrate())
"

echo "Running seed..."
python -m db.seeds.seed

echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000