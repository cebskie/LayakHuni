# LayakHuni — Setup Guide

## The problem
The backend must be started manually. `ERR_EMPTY_RESPONSE` means nothing
is listening on port 8000 yet.

---

## Prerequisites

Install these first if you haven't:
- **Python 3.11+**: https://python.org
- **Node.js 20+**: https://nodejs.org
- **PostgreSQL 16 + PostGIS**: see below

---

## Step 1 — PostgreSQL + PostGIS

### Windows
Download & install: https://www.enterprisedb.com/downloads/postgres-postgresql-installers
During install, tick "PostGIS Bundle" in Stack Builder.

Then open pgAdmin or psql and run:
```sql
CREATE DATABASE real_estate;
\c real_estate
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### macOS
```bash
brew install postgresql@16 postgis
brew services start postgresql@16
psql postgres -c "CREATE DATABASE real_estate;"
psql real_estate -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql real_estate -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

### Linux (Ubuntu/Debian)
```bash
sudo apt install postgresql postgresql-contrib postgis
sudo -u postgres psql -c "CREATE DATABASE real_estate;"
sudo -u postgres psql real_estate -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql real_estate -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

---

## Step 2 — Run SQL Migrations

```bash
# From the layakhuni/ folder:
psql -U postgres -d real_estate -f backend/db/migrations/1_init.sql
psql -U postgres -d real_estate -f backend/db/migrations/2_triggers.sql
```

---

## Step 3 — Backend

```bash
cd layakhuni/backend

# Create virtual environment
python3 -m venv venv

# Activate (Mac/Linux):
source venv/bin/activate
# Activate (Windows PowerShell):
# venv\Scripts\Activate.ps1

# Install packages
pip install -r requirements.txt

# Edit .env if needed (default password is AdminWU*#)
# DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/real_estate

# Seed dummy data (12 properties, 7 developers, 15 Indonesian cities)
python -m db.seeds.seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
✅ LayakHuni API started
```

Visit: http://localhost:8000/docs ← Swagger UI
Visit: http://localhost:8000/      ← Health check

---

## Step 4 — Frontend

Open a **second terminal**:

```bash
cd layakhuni/frontend

npm install
npm run dev
```

Visit: http://localhost:5173

---

## Troubleshooting

### "password authentication failed for user postgres"
Edit `backend/.env` and change the password in `DATABASE_URL` to match your
Postgres installation password.

### "ModuleNotFoundError: No module named 'app'"
Make sure you're running uvicorn from inside the `backend/` directory:
```bash
cd layakhuni/backend
uvicorn app.main:app --reload --port 8000
```

### "could not connect to server" (database)
PostgreSQL isn't running. Start it:
- macOS: `brew services start postgresql@16`
- Windows: Open Services app → start "postgresql-x64-16"
- Linux: `sudo systemctl start postgresql`

### PostGIS extension not found
```sql
-- Run in psql as superuser:
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## Default Accounts After Seeding

| Role | Email | Password |
|------|-------|----------|
| Customer | (check seed output) | `password123` |
| Developer | dev1@griya.co.id | `password123` |

> Note: After running `seed.py`, check the terminal output for the exact emails generated.
