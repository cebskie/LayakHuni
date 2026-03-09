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
│   │   │   ├── properties.py   # CRUD + geospatial queries
│   │   │   ├── admin.py        # User management + dev verification
│   │   │   └── upload.py       # File upload → MinIO + EXIF + geocoding
│   │   ├── services/
│   │   │   ├── storage.py      # MinIO S3-compatible storage
│   │   │   ├── exif.py         # Pillow EXIF extraction (GPS + datetime)
│   │   │   └── geocoding.py    # Nominatim reverse geocoding
│   │   ├── schemas/            # Pydantic schemas
│   │   └── main.py             # FastAPI app entry point
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 1_init.sql      # Schema + PostGIS + indexes
│   │   │   └── 2_triggers.sql  # Auto-generate codes
│   │   └── seeds/
│   │       └── seed.py         # 12 properties + 15 kota Indonesia
│   ├── requirements.txt
│   └── .env
│
├── frontend/                   # React.js + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Navbar.jsx
│   │   │   └── property/
│   │   │       ├── PropertyCard.jsx
│   │   │       └── FilterPanel.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── PropertiesPage.jsx     # Search + filter + grid
│   │   │   ├── PropertyDetailPage.jsx
│   │   │   ├── MapPage.jsx            # Leaflet + Near Me radius search
│   │   │   ├── DataExplorerPage.jsx   # Admin BI dashboard
│   │   │   ├── AdminUsersPage.jsx     # User management (Admin)
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── AddPropertyPage.jsx    # Multi-step: info + foto + dokumen
│   │   │   └── BookingPage.jsx
│   │   ├── context/AuthContext.jsx
│   │   └── utils/
│   │       ├── api.js
│   │       └── format.js
│   └── package.json
│
└── docker-compose.yml
```

---

## 🚀 Cara Menjalankan (Development Lokal)

### Prasyarat

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 + PostGIS extension
- Docker Desktop (untuk MinIO)

---

### 1. Setup PostgreSQL dengan PostGIS

```bash
psql -U postgres
CREATE DATABASE real_estate;
\c real_estate
CREATE EXTENSION postgis;
CREATE EXTENSION pgcrypto;
\q

psql -U postgres -d real_estate -f backend/db/migrations/1_init.sql
psql -U postgres -d real_estate -f backend/db/migrations/2_triggers.sql
```

---

### 2. Setup MinIO (Object Storage)

MinIO digunakan untuk menyimpan foto properti, sertifikat, dan dokumen PBG.

```bash
# Jalankan MinIO via Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  minio/minio server /data --console-address ":9001"
```

**Windows (cmd):**
```cmd
docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"
```

Setelah MinIO berjalan:
- **MinIO Console:** http://localhost:9001
- **Login:** `minioadmin` / `minioadmin`
- Buat bucket baru bernama `layakhuni` (atau biarkan backend membuatnya otomatis)

> 💡 MinIO harus berjalan sebelum backend dijalankan. Cek dengan membuka http://localhost:9001.

---

### 3. Backend (FastAPI)

```bash
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi (Windows cmd)
venv\Scripts\activate.bat

# Aktivasi (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Konfigurasi .env — pastikan berisi:
# DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/real_estate
# MINIO_ENDPOINT=localhost:9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
# MINIO_BUCKET=layakhuni
# MINIO_SECURE=false
# MINIO_PUBLIC_URL=http://localhost:9000

# Seed data dummy
python -m db.seeds.seed

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend: http://127.0.0.1:8000  
Swagger UI: http://127.0.0.1:8000/docs

---

### 4. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

> ⚠️ **Windows:** Gunakan Google Chrome, bukan Brave (Brave memblokir request XHR ke localhost).

---

## 🔑 Akun Default (Setelah Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@properti.id | password123 |
| Developer | dev1@griya.co.id | password123 |
| Customer | (acak dari faker) | password123 |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router v6 |
| Peta | Leaflet.js + React Leaflet |
| Charts | Recharts |
| Backend | FastAPI (Python 3.13), Async SQLAlchemy |
| Database | PostgreSQL 16 + PostGIS |
| Object Storage | MinIO (S3-compatible) |
| Auth | JWT (python-jose) + bcrypt |
| EXIF | Pillow |
| Geocoding | Nominatim (OpenStreetMap, gratis) |

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
| GET | `/api/properties/nearby` | Pencarian radius (lat, lng, radius_km) |
| GET | `/api/properties/stats` | Statistik untuk Admin |

### Upload
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/upload/photo/{prop_id}` | Upload foto → EXIF → geocode → MinIO |
| POST | `/api/upload/certificate/{prop_id}` | Upload sertifikat → MinIO |
| POST | `/api/upload/pbg/{prop_id}` | Upload PBG → MinIO |
| PATCH | `/api/upload/photo/{photo_id}/location` | Koreksi GPS manual |

### Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/users` | Semua user |
| PATCH | `/api/admin/developers/{id}/verify` | Verifikasi developer |
| PATCH | `/api/admin/developers/{id}/unverify` | Batalkan verifikasi |

---

## 📊 Fitur Utama

### 1. Upload & Object Storage (MinIO)
- Foto properti disimpan di MinIO bucket `layakhuni/photos/`
- Sertifikat disimpan di `layakhuni/certificates/`
- PBG disimpan di `layakhuni/pbg/`
- URL publik otomatis digenerate dan disimpan di database

### 2. Intelligent Geotagging
- Upload foto → EXIF diekstrak otomatis (GPS + timestamp)
- Koordinat GPS → reverse geocode ke kota/kecamatan via Nominatim
- PostGIS `GEOMETRY(Point, 4326)` per foto
- Filter radius dengan `ST_DWithin`
- Peta interaktif dengan Near Me + radius circle

### 3. AI Document Processing *(Sprint 2 — In Progress)*
- File sertifikat & PBG sudah tersimpan di MinIO, siap diproses OCR
- Data fields (NIB, jenis hak, nama pemilik, luas) akan diisi otomatis oleh AI OCR
- Integrasi endpoint OCR akan ditambahkan oleh tim AI

### 4. Data Explorer Dashboard (Admin)
- Overview charts: status properti, distribusi hak, kota teratas
- Tabel data dengan export CSV
- Statistik real-time dari database

---

## 🗂 Database Schema

```
Pengguna ──┬── Customer
           └── Developer ──── Property ──┬── Photo (PostGIS point, EXIF, geocoding)
                                          ├── Certificate (file URL, OCR fields)
                                          ├── PBG (file URL, OCR fields)
                                          └── Denah
```

---

## 📈 Roadmap (Sprint 2)

- [ ] AI OCR untuk ekstrak data sertifikat & PBG (in progress — tim AI)
- [ ] Manual review UI untuk field OCR confidence rendah
- [ ] Export PDF/Excel dari Data Explorer
- [ ] Heatmap properti di peta
- [ ] Sistem booking / appointment
- [ ] Notifikasi email verifikasi developer
- [ ] Admin moderation properti (approve/reject)