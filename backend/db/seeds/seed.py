"""
Seed Script — Generate dummy data untuk development & FE testing
Jalankan dari root folder backend/:
    python -m db.seeds.seed
"""

from app.core.security import get_password_hash
HASHED_PASSWORD = get_password_hash("password123")

import asyncio
import uuid
import random
from datetime import datetime, timedelta
from faker import Faker
from passlib.context import CryptContext

from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.models import Pengguna, Customer, Developer, Property, Photo, Denah, PBG, Certificate
from app.models.pengguna import UserRoleEnum
from app.models.developer import VerifStatusEnum
from app.models.property import PropStatusEnum, SalesStatusEnum

fake = Faker('id_ID')
STORAGE_SERVER = "storage.properti.id"
STORAGE_BASE   = f"https://{STORAGE_SERVER}"

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# SEED_PASSWORD = "password123"
# HASHED_PASSWORD = pwd_context.hash(SEED_PASSWORD)

# ── Lokasi kota-kota Indonesia (longitude, latitude) ──────────────────────────
KOTA_LIST = [
    {"kota": "Kota Bandung",       "kecamatan": "Coblong",             "desa": "Dago",            "kelurahan": "Dago",            "lng": 107.6191, "lat": -6.9175},
    {"kota": "Jakarta Selatan",    "kecamatan": "Mampang Prapatan",    "desa": "Bangka",          "kelurahan": "Bangka",          "lng": 106.8198, "lat": -6.2607},
    {"kota": "Kota Surabaya",      "kecamatan": "Rungkut",             "desa": "Rungkut Kidul",   "kelurahan": "Rungkut Kidul",   "lng": 112.7508, "lat": -7.2904},
    {"kota": "Kabupaten Sleman",   "kecamatan": "Depok",               "desa": "Caturtunggal",    "kelurahan": "Caturtunggal",    "lng": 110.3761, "lat": -7.7541},
    {"kota": "Kota Medan",         "kecamatan": "Medan Petisah",       "desa": "Sekip",           "kelurahan": "Sekip",           "lng": 98.6722,  "lat":  3.5896},
    {"kota": "Kabupaten Gianyar",  "kecamatan": "Ubud",                "desa": "Ubud",            "kelurahan": "Ubud",            "lng": 115.2624, "lat": -8.5069},
    {"kota": "Jakarta Pusat",      "kecamatan": "Setiabudi",           "desa": "Kuningan",        "kelurahan": "Kuningan",        "lng": 106.8229, "lat": -6.2088},
    {"kota": "Kota Makassar",      "kecamatan": "Tamalate",            "desa": "Tanjung Merdeka", "kelurahan": "Tanjung Merdeka", "lng": 119.4221, "lat": -5.1477},
    {"kota": "Kota Semarang",      "kecamatan": "Semarang Tengah",     "desa": "Pekunden",        "kelurahan": "Pekunden",        "lng": 110.4203, "lat": -6.9932},
    {"kota": "Kota Palembang",     "kecamatan": "Ilir Barat I",        "desa": "Bukit Lama",      "kelurahan": "Bukit Lama",      "lng": 104.7458, "lat": -2.9761},
    {"kota": "Kota Malang",        "kecamatan": "Lowokwaru",           "desa": "Ketawanggede",    "kelurahan": "Ketawanggede",    "lng": 112.6144, "lat": -7.9538},
    {"kota": "Kota Denpasar",      "kecamatan": "Denpasar Selatan",    "desa": "Sanur",           "kelurahan": "Sanur",           "lng": 115.2619, "lat": -8.6905},
    {"kota": "Kota Manado",        "kecamatan": "Wenang",              "desa": "Wenang Selatan",  "kelurahan": "Wenang Selatan",  "lng": 124.8456, "lat":  1.4748},
    {"kota": "Kota Balikpapan",    "kecamatan": "Balikpapan Kota",     "desa": "Prapatan",        "kelurahan": "Prapatan",        "lng": 116.8529, "lat": -1.2654},
    {"kota": "Kota Batam",         "kecamatan": "Batam Kota",          "desa": "Teluk Tering",    "kelurahan": "Teluk Tering",    "lng": 104.0305, "lat":  1.1301},
]

PROPERTY_TYPES = [
    {"name": "Rumah Minimalis",   "desc": "Rumah modern minimalis, {br} kamar tidur, {bt} kamar mandi, garasi. Lokasi strategis.",          "price_min": 300_000_000,   "price_max": 2_000_000_000},
    {"name": "Rumah Subsidi",     "desc": "Rumah subsidi tipe 36/72, {br} kamar tidur, {bt} kamar mandi. KPR tersedia.",                    "price_min": 150_000_000,   "price_max": 300_000_000},
    {"name": "Tanah Kavling",     "desc": "Tanah kavling siap bangun, SHM, lokasi strategis dekat pusat kota.",                             "price_min": 200_000_000,   "price_max": 5_000_000_000},
    {"name": "Apartemen Studio",  "desc": "Unit studio lantai {lt}, view kota, full furnished, fasilitas lengkap.",                         "price_min": 300_000_000,   "price_max": 1_500_000_000},
    {"name": "Apartemen 2BR",     "desc": "Unit {br} kamar tidur, lantai {lt}, view premium, dekat pusat perbelanjaan.",                    "price_min": 400_000_000,   "price_max": 2_000_000_000},
    {"name": "Ruko 2 Lantai",     "desc": "Ruko strategis 2 lantai di pusat kota, cocok untuk kantor atau toko, parkir luas.",              "price_min": 800_000_000,   "price_max": 3_000_000_000},
    {"name": "Ruko 3 Lantai",     "desc": "Ruko 3 lantai posisi hook, luas {lb}m2, sudah ada penyewa aktif.",                               "price_min": 1_500_000_000, "price_max": 5_000_000_000},
    {"name": "Kos Eksklusif",     "desc": "Kos eksklusif {kr} kamar, AC, wifi, kamar mandi dalam, laundry, keamanan 24 jam.",               "price_min": 500_000_000,   "price_max": 2_000_000_000},
]

HAK_LIST    = ["Hak Milik", "Hak Guna Usaha", "Hak Guna Bangunan", "Hak Pakai", "Hak Pengelolaan", "Hak Tanggungan"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_date(start_days_ago: int = 365, end_days_ago: int = 30) -> datetime:
    delta = random.randint(end_days_ago, start_days_ago)
    return datetime.now() - timedelta(days=delta)

def make_property_name(ptype: dict, kota: dict) -> str:
    return f"{ptype['name']} {kota['kota']}"

def make_description(ptype: dict) -> str:
    return ptype["desc"].format(
        br=random.randint(2, 4),
        bt=random.randint(1, 3),
        lt=random.randint(5, 25),
        lb=random.randint(60, 200),
        kr=random.randint(8, 20),
    )


# ── Main seed function ────────────────────────────────────────────────────────

async def seed():
    async with AsyncSessionLocal() as session:
        print("🌱 Starting seed...")

        # ── 1. USERS ──────────────────────────────────────────────────────────
        print("  → Seeding Users...")

        admin = Pengguna(
            user_id=uuid.uuid4(), user_role=UserRoleEnum.Admin,
            user_name="Super Admin", user_password=HASHED_PASSWORD,
            email="admin@properti.id", phone="081200000001",
        )
        session.add(admin)

        customer_users = []
        for i in range(1, 8):
            u = Pengguna(
                user_id=uuid.uuid4(), user_role=UserRoleEnum.Customer,
                user_name=fake.name(), user_password=HASHED_PASSWORD,
                email=fake.unique.email(), phone=fake.phone_number(),
            )
            session.add(u)
            customer_users.append(u)

        developer_users = []
        dev_company_names = [
            "PT Griya Nusantara", "CV Bangun Sejahtera", "PT Maju Properti",
            "Surya Realty", "PT Cipta Hunian", "CV Prima Lahan", "PT Jaya Konstruksi",
        ]
        for i, company in enumerate(dev_company_names):
            u = Pengguna(
                user_id=uuid.uuid4(), user_role=UserRoleEnum.Developer,
                user_name=company, user_password=HASHED_PASSWORD,
                email=f"dev{i+1}@{company.lower().replace(' ', '').replace('pt','').replace('cv','')}.co.id",
                phone=f"021{random.randint(10000000, 99999999)}",
            )
            session.add(u)
            developer_users.append(u)

        await session.flush()

        # ── 2. CUSTOMERS ──────────────────────────────────────────────────────
        print("  → Seeding Customers...")
        customers = []
        for i, u in enumerate(customer_users):
            c = Customer(
                cust_id=uuid.uuid4(),
                cust_code=f"C{str(i+1).zfill(3)}",
                user_id=u.user_id,
            )
            session.add(c)
            customers.append(c)

        await session.flush()

        # ── 3. DEVELOPERS ─────────────────────────────────────────────────────
        print("  → Seeding Developers...")
        developers = []
        for i, u in enumerate(developer_users):
            verif = VerifStatusEnum.Verified if i < 5 else VerifStatusEnum.Not_Verified
            d = Developer(
                dev_id=uuid.uuid4(),
                dev_code=f"D{str(i+1).zfill(3)}",
                user_id=u.user_id,
                verified_at=rand_date(500, 60),
                verif_status=verif,
            )
            session.add(d)
            developers.append(d)

        await session.flush()

        # ── 4. PROPERTIES ─────────────────────────────────────────────────────
        print("  → Seeding Properties...")
        properties = []
        for i in range(12):
            dev   = random.choice(developers[:5])   # hanya developer verified
            ptype = random.choice(PROPERTY_TYPES)
            kota  = KOTA_LIST[i % len(KOTA_LIST)]
            price = round(random.uniform(ptype["price_min"], ptype["price_max"]), -6)

            p = Property(
                prop_id=uuid.uuid4(),
                dev_id=dev.dev_id,
                property_name=make_property_name(ptype, kota),
                description=make_description(ptype),
                property_status=random.choice([PropStatusEnum.Valid, PropStatusEnum.Valid, PropStatusEnum.Non_Valid]),
                sales_status=random.choice(list(SalesStatusEnum)),
                price=price,
                created_at=rand_date(300, 30),
                full_address=f"Jl. {fake.street_name()} No. {random.randint(1, 200)}, Kec. {kota['kecamatan']}, {kota['kota']}",
            )
            session.add(p)
            properties.append(p)

        await session.flush()

        # ── 5. PHOTOS (PostGIS) ───────────────────────────────────────────────
        print("  → Seeding Photos...")
        for i, prop in enumerate(properties):
            kota = KOTA_LIST[i % len(KOTA_LIST)]
            # Tambah sedikit noise ke koordinat supaya tidak persis sama
            lng = kota["lng"] + random.uniform(-0.005, 0.005)
            lat = kota["lat"] + random.uniform(-0.005, 0.005)

            photo = Photo(
                photo_id=uuid.uuid4(),
                prop_id=prop.prop_id,
                location=f"SRID=4326;POINT({lng} {lat})",
                kabupatenkota=kota["kota"],
                kecamatan=kota["kecamatan"],
                desa=kota["desa"],
                kelurahan=kota["kelurahan"],
                filephoto_url=f"{STORAGE_BASE}/photos/prop{i+1:03d}_1.jpg",
                time_taken=rand_date(300, 30),
                serverphoto_address=STORAGE_SERVER,
            )
            session.add(photo)

        await session.flush()

        # ── 6. DENAH ──────────────────────────────────────────────────────────
        print("  → Seeding Denah...")
        for i, prop in enumerate(properties[:8]):   # tidak semua properti punya denah
            denah = Denah(
                denah_id=uuid.uuid4(),
                prop_id=prop.prop_id,
                serverdenah_address=STORAGE_SERVER,
                filedenah_url=f"{STORAGE_BASE}/denah/prop{i+1:03d}_denah.pdf",
            )
            session.add(denah)

        await session.flush()

        # ── 7. PBG ────────────────────────────────────────────────────────────
        print("  → Seeding PBG...")
        for i, prop in enumerate(properties[:8]):
            pbg = PBG(
                pbg_id=uuid.uuid4(),
                prop_id=prop.prop_id,
                pbg_number=f"PBG/{fake.bothify('???').upper()}/{datetime.now().year}/{str(i+1).zfill(3)}",
                filepbg_url=f"{STORAGE_BASE}/pbg/prop{i+1:03d}_pbg.pdf",
                owner_name=random.choice(developer_users).user_name,
                writtenpbg_address=fake.address(),
                luas_bangunan=round(random.uniform(36, 500), 2),
            )
            session.add(pbg)

        await session.flush()

        # ── 8. CERTIFICATE ────────────────────────────────────────────────────
        print("  → Seeding Certificates...")
        for i, prop in enumerate(properties):
            cert = Certificate(
                certif_id=uuid.uuid4(),
                prop_id=prop.prop_id,
                nib=fake.bothify("################"),
                filecertif_url=f"{STORAGE_BASE}/cert/prop{i+1:03d}_cert.pdf",
                hak=random.choice(HAK_LIST),
                qr_url=f"{STORAGE_BASE}/qr/prop{i+1:03d}_qr.png",
                owner_name=random.choice(developer_users).user_name,
                writtencertif_address=fake.address(),
                luas_tanah=round(random.uniform(60, 2000), 2),
            )
            session.add(cert)

        await session.flush()

        # ── Commit semua ──────────────────────────────────────────────────────
        await session.commit()
        print("✅ Seed completed!")
        print(f"   {len(customer_users)} Customers")
        print(f"   {len(developer_users)} Developers")
        print(f"   {len(properties)} Properties")
        print(f"   {len(properties)} Photos")
        print(f"   8 Denah, 8 PBG, {len(properties)} Certificates")
        print("")
        print("🔑 Login credentials (password: password123)")
        print(f"   Admin:     admin@properti.id")
        for i, u in enumerate(developer_users[:3]):
            print(f"   Developer: {u.email}")
        for i, u in enumerate(customer_users[:2]):
            print(f"   Customer:  {u.email}")


if __name__ == "__main__":
    asyncio.run(seed())