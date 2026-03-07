# LayakHuni — Platform Properti Berbasis AI 🏠

Platform e-commerce properti Indonesia dengan verifikasi dokumen AI, intelligent geotagging, dan data explorer dashboard.

## 📁 Struktur Proyek

```
layakhuni/
├── backend/                    # FastAPI + PostgreSQL/PostGIS
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py     # Async SQLAlchemy + PostGIS
│   │   │   ├── security.py     # JWT auth, bcrypt
│   │   │   └── deps.py         # FastAPI dependencies
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── pengguna.py     # User model
│   │   │   ├── developer.py    # Developer profile
│   │   │   ├── customer.py     # Customer profile
│   │   │   ├── property.py     # Property listings
│   │   │   ├── photo.py        # Photos + PostGIS geometry
│   │   │   ├── certificate.py  # Sertifikat Tanah Elektronik
│   │   │   ├── pbg.py          # Persetujuan Bangunan Gedung
│   │   │   └── denah.py        # Floor plan
│   │   ├── routers/
│   │   │   ├── auth.py         # Register, Login, Profile
│   │   │   └── properties.py   # CRUD + geospatial queries
│   │   ├── schemas/            # Pydantic schemas
│   │   └── main.py             # FastAPI app entry point
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 1_init.sql      # Schema + PostGIS + indexes
│   │   │   └── 2_triggers.sql  # Auto-generate codes
│   │   └── seeds/
│   │       └── seed.py         # 12 properties + 15 kota Indonesia
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── frontend/                   # React.js + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx  # Responsive navbar + auth menu
│   │   │   │   └── Footer.jsx
│   │   │   └── property/
│   │   │       ├── PropertyCard.jsx   # Card with doc badges
│   │   │       └── FilterPanel.jsx    # Advanced filters
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Hero + stats + listings
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx       # Role selection
│   │   │   ├── PropertiesPage.jsx     # Search + filter + grid
│   │   │   ├── PropertyDetailPage.jsx # Full details + map
│   │   │   ├── MapPage.jsx            # Leaflet map pins
│   │   │   ├── DataExplorerPage.jsx   # Admin BI dashboard
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── AddPropertyPage.jsx    # Developer form
│   │   │   └── BookingPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Auth state
│   │   └── utils/
│   │       ├── api.js                 # Axios + interceptors
│   │       └── format.js              # Rupiah, date formatting
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml          # Full stack orchestration
```

## 🚀 Cara Menjalankan

### Prasyarat
- Docker Desktop (direkomendasikan)
- Node.js 20+ (untuk dev lokal)
- Python 3.11+ (untuk dev lokal)
- PostgreSQL 16 + PostGIS extension

---

### 🐳 Opsi 1: Docker Compose (Direkomendasikan)

```bash
# Clone/buka folder proyek
cd layakhuni

# Jalankan semua service
docker-compose up -d

# Seed database dengan data dummy
docker exec layakhuni_backend python -m db.seeds.seed

# Akses aplikasi
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

### 💻 Opsi 2: Development Lokal

#### 1. Setup PostgreSQL dengan PostGIS

```bash
# Install PostgreSQL + PostGIS (macOS)
brew install postgresql@16 postgis

# Buat database
psql -U postgres
CREATE DATABASE real_estate;
\c real_estate
CREATE EXTENSION postgis;
CREATE EXTENSION pgcrypto;
\q

# Jalankan migrations
psql -U postgres -d real_estate -f backend/db/migrations/1_init.sql
psql -U postgres -d real_estate -f backend/db/migrations/2_triggers.sql
```

#### 2. Backend (FastAPI)

```bash
cd backend

# Buat virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Konfigurasi .env (sudah ada di repo)
# DATABASE_URL=postgresql+asyncpg://postgres:AdminWU*#@localhost:5432/real_estate

# Seed data dummy
python -m db.seeds.seed

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend berjalan di: http://localhost:8000
Swagger UI: http://localhost:8000/docs

#### 3. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Frontend berjalan di: http://localhost:5173

---

## 🔑 Akun Default (Setelah Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@properti.id | hashed_password |
| Customer | (random faker) | hashed_password |
| Developer | dev1@griya.co.id | hashed_password |

> ⚠️ Password seed adalah `hashed_password` (plaintext di seed), ganti dengan auth proper untuk produksi.

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React.js 18, Tailwind CSS, React Router v6 |
| Peta | Leaflet.js + React Leaflet |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11), Async SQLAlchemy |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Deployment | Docker + Docker Compose |

---

## 🌍 API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login, dapat JWT |
| GET | `/api/auth/me` | Profil user aktif |
| PUT | `/api/auth/me` | Update profil |

### Properties
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/properties` | List + filter properti |
| GET | `/api/properties/{id}` | Detail properti |
| POST | `/api/properties` | Buat properti baru (Developer) |
| GET | `/api/properties/map-pins` | Koordinat untuk peta |
| GET | `/api/properties/stats` | Statistik untuk Admin |

### Filter Parameters (GET /api/properties)
```
search, min_price, max_price, sales_status, property_status,
hak, kabupatenkota, lat, lng, radius_km, page, limit
```

---

## 📊 Fitur Utama

### 1. AI Document Processing (UI Ready)
- Upload PBG, E-Sertipikat, Denah
- Confidence score indicators (hijau/kuning/merah)
- Validasi field krusial (NIB, Nomor PBG)
- Cross-field validation

### 2. Intelligent Geotagging
- Koordinat PostGIS `GEOMETRY(Point, 4326)` per properti
- Filter radius dengan `ST_DWithin`
- Peta interaktif Leaflet dengan marker per status
- Popup properti dengan detail lengkap

### 3. Data Explorer Dashboard (Admin)
- Overview charts (PieChart, BarChart)
- Analitik per kota dan jenis hak
- Tabel data dengan export CSV
- Real-time dari database

---

## 🗂 Database Schema

```
Pengguna ──┬── Customer
           └── Developer ──── Property ──┬── Photo (PostGIS)
                                          ├── Certificate
                                          ├── PBG
                                          └── Denah
```

PostGIS spatial indexes:
```sql
CREATE INDEX idx_property_location ON Photo USING GIST (Location);
```

---

## 📈 Roadmap (Sprint 2 Backlog)

- [ ] AI OCR integration (Google Document AI / OpenAI Vision)
- [ ] EXIF metadata extraction dari foto
- [ ] Manual review fallback untuk confidence score rendah
- [ ] Reverse geocoding Nominatim API
- [ ] Export PDF/Excel dari Data Explorer
- [ ] Heatmap properti di peta
