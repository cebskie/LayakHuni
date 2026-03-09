# LayakHuni — Platform Properti Berbasis AI 🏠

Platform e-commerce properti Indonesia dengan verifikasi dokumen AI (OCR), intelligent geotagging, dan data explorer dashboard.

---

## 📁 Struktur Proyek

```
layakhuni/
├── backend/                    # FastAPI + PostgreSQL/PostGIS
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py     # Async SQLAlchemy + PostGIS
│   │   │   ├── security.py     # JWT auth, bcrypt
│   │   │   └── deps.py         # FastAPI dependencies
│   │   ├── models/
│   │   │   ├── pengguna.py              # User model
│   │   │   ├── developer.py             # Developer profile
│   │   │   ├── customer.py              # Customer profile
│   │   │   ├── property.py              # Property listings
│   │   │   ├── photo.py                 # Photos + PostGIS geometry
│   │   │   ├── certificate.py           # Sertifikat Tanah Elektronik + OCR fields
│   │   │   ├── pbg.py                   # Persetujuan Bangunan Gedung + OCR fields
│   │   │   ├── ocr_cross_validation.py  # Cross-field validation results
│   │   │   └── denah.py                 # Floor plan
│   │   ├── routers/
│   │   │   ├── auth.py         # Register, Login, Profile
│   │   │   ├── properties.py   # CRUD + geospatial queries
│   │   │   ├── admin.py        # User management + dev verification
│   │   │   └── upload.py       # Upload → MinIO + OCR + EXIF + geocoding
│   │   ├── services/
│   │   │   ├── storage.py      # MinIO S3-compatible storage
│   │   │   ├── exif.py         # Pillow EXIF extraction (GPS + datetime)
│   │   │   ├── geocoding.py    # Nominatim reverse geocoding
│   │   │   └── ocr.py          # Tesseract OCR + regex field extraction + cross-validation
│   │   ├── schemas/            # Pydantic schemas
│   │   └── main.py             # FastAPI app entry point
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 1_init.sql          # Schema + PostGIS + indexes
│   │   │   ├── 2_triggers.sql      # Auto-generate codes
│   │   │   └── 3_ocr_fields.sql    # OCR columns + ocr_cross_validation table
│   │   └── seeds/
│   │       └── seed.py             # 12 properties + 15 kota Indonesia
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
│   │   │   ├── PropertiesPage.jsx       # Search + filter + grid
│   │   │   ├── PropertyDetailPage.jsx   # Detail + OCR results + confidence scores
│   │   │   ├── MapPage.jsx              # Leaflet + Near Me radius search
│   │   │   ├── DataExplorerPage.jsx     # Admin BI dashboard + CSV export
│   │   │   ├── AdminUsersPage.jsx       # User management + developer verification
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── AddPropertyPage.jsx      # Multi-step: info → foto → sertifikat → PBG
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
- Tesseract OCR (untuk AI document processing)
- Poppler (untuk konversi PDF ke gambar)

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
psql -U postgres -d real_estate -f backend/db/migrations/3_ocr_fields.sql
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

> 💡 MinIO harus berjalan sebelum backend dijalankan.

---

### 3. Setup Tesseract OCR

Tesseract digunakan untuk mengekstrak teks dari dokumen E-Sertipikat dan PBG.

**Windows:**
1. Download installer dari: https://github.com/UB-Mannheim/tesseract/wiki
2. Jalankan installer — jika tidak menawarkan pilihan bahasa, download `ind.traineddata` secara manual dari https://github.com/tesseract-ocr/tessdata lalu salin ke `C:\Program Files\Tesseract-OCR\tessdata\`
3. Tambahkan path ke `.env`:
```env
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

**macOS/Linux:**
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt install tesseract-ocr tesseract-ocr-ind
```

> ⚠️ **Windows + venv:** Tesseract harus dikonfigurasi via `TESSERACT_CMD` di `.env` karena virtual environment tidak selalu mewarisi PATH sistem. Di Railway/Linux tidak perlu diset.

---

### 4. Setup Poppler (PDF Processing)

Poppler diperlukan oleh `pdf2image` untuk mengkonversi PDF ke gambar sebelum OCR.

**Windows:**
1. Download dari: https://github.com/oschwartz10612/poppler-windows/releases
2. Ekstrak ke folder permanen, misalnya `C:\poppler`
3. Tambahkan path ke `.env`:
```env
POPPLER_PATH=C:\poppler\Library\bin
```

**macOS/Linux:**
```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt install poppler-utils
```

> ⚠️ **Windows + venv:** Sama seperti Tesseract, gunakan `POPPLER_PATH` di `.env`. Di Railway/Linux tidak perlu diset karena Poppler tersedia secara sistem.

---

### 5. Backend (FastAPI)

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

# Seed data dummy
python -m db.seeds.seed

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend: http://127.0.0.1:8000  
Swagger UI: http://127.0.0.1:8000/docs

#### Konfigurasi `.env`

```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/real_estate

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=layakhuni
MINIO_SECURE=false
MINIO_PUBLIC_URL=http://localhost:9000

# OCR — Windows only. Tidak perlu diset di Linux/Railway
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
POPPLER_PATH=C:\poppler\Library\bin
```

---

### 6. Frontend (React)

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
| OCR | Tesseract + pdf2image + pypdf |
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

### Upload & OCR
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/upload/photo/{prop_id}` | Upload foto → EXIF → geocode → MinIO |
| POST | `/api/upload/certificate/{prop_id}` | Upload sertifikat → MinIO → OCR otomatis |
| POST | `/api/upload/pbg/{prop_id}` | Upload PBG → MinIO → OCR otomatis |
| GET | `/api/upload/ocr-status/{prop_id}` | Hasil OCR + cross-validation per properti |
| PATCH | `/api/upload/photo/{photo_id}/location` | Koreksi GPS manual |
| PATCH | `/api/upload/certificate/{certif_id}/review` | Koreksi manual field sertifikat |
| PATCH | `/api/upload/pbg/{pbg_id}/review` | Koreksi manual field PBG |

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

### 3. AI Document Processing (OCR)

OCR berjalan otomatis saat dokumen diupload menggunakan Tesseract + regex yang dikalibrasi untuk format E-Sertipikat dan PBG Indonesia.

**Field yang diekstrak:**

| Dokumen | Field |
|---------|-------|
| E-Sertipikat | NIB, Jenis Hak, Nama Pemilik, Alamat, Luas Tanah |
| PBG | Nomor PBG, Nama Pemilik, Alamat Bangunan, Luas Bangunan |

**Formula Confidence Score:**

Setiap field mendapat skor individual (0.0–1.0) berdasarkan kualitas regex match dan validasi format. Skor keseluruhan dihitung sebagai:

```
overall = (Σ field_score × field_weight) × 0.8 + tesseract_engine_confidence × 0.2
```

Bobot field E-Sertipikat: NIB (0.30), Nama Pemilik (0.25), Jenis Hak (0.20), Alamat (0.15), Luas (0.10)  
Bobot field PBG: Nomor PBG (0.35), Nama Pemilik (0.30), Alamat (0.20), Luas (0.15)

| Status | Threshold | Tampilan |
|--------|-----------|----------|
| High | ≥ 80% | 🟢 Hijau |
| Medium | ≥ 50% | 🟡 Kuning |
| Low | < 50% | 🔴 Merah |

**Cross-field Validation:**

Setelah kedua dokumen diupload, sistem otomatis memeriksa konsistensi lintas dokumen menggunakan Jaccard similarity:
- **Nama pemilik** antara E-Sertipikat dan PBG → +5% bonus jika cocok (≥80%), −10% penalti jika berbeda (<40%)
- **Alamat** antara E-Sertipikat dan PBG → token overlap score
- **Alamat dokumen** vs **lokasi GPS foto** → kecocokan dengan hasil reverse geocoding Nominatim

Hasil cross-validation disimpan di tabel `ocr_cross_validation` dan ditampilkan di halaman detail properti.

### 4. Data Explorer Dashboard (Admin)
- Overview charts: status properti, distribusi hak, kota teratas
- Tabel data dengan export CSV
- Statistik real-time dari database

---

## 🗂 Database Schema

```
Pengguna ──┬── Customer
           └── Developer ──── Property ──┬── Photo (PostGIS point, EXIF, geocoding)
                                          ├── Certificate (file URL, OCR fields, confidence)
                                          ├── PBG (file URL, OCR fields, confidence)
                                          ├── OcrCrossValidation (cross-field scores, issues)
                                          └── Denah
```

---

## 📈 Roadmap

### ✅ Sprint 1 — Selesai
- Register / Login / JWT auth (role-based: Admin, Developer, Customer)
- Property listing, search, filter, detail
- Leaflet map dengan color-coded pins
- Near Me radius search (PostGIS `ST_DWithin`)
- Data Explorer dashboard (Admin) + CSV export
- Admin Users page + developer verification
- Profile edit
- Add Property multi-step form (Developer)
- MinIO object storage
- EXIF extraction + Nominatim reverse geocoding

### ✅ Sprint 2 — Selesai
- AI OCR untuk E-Sertipikat dan PBG (Tesseract + regex)
- Confidence score per field + overall weighted score
- Cross-field validation (nama pemilik, alamat, GPS foto)
- OCR status endpoint + tampilan di PropertyDetailPage
- Heatmap properti di peta

### 🔲 Sprint 3 — Direncanakan
- Export PDF/Excel dari Data Explorer
- Sistem booking / appointment
- Notifikasi email verifikasi developer
- Admin moderation properti (approve/reject)
- Deployment: Vercel (frontend) + Railway (backend + DB) + Cloudflare R2 (storage)
