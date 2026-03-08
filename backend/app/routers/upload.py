"""
Upload router — handles file uploads for photos, certificates (PBG + Sertifikat).

Photo upload flow:
  1. Receive image file
  2. Extract EXIF (GPS coords + datetime)
  3. If GPS found → reverse geocode → fill kabupatenkota, kecamatan, desa, kelurahan
  4. Upload to MinIO
  5. Save Photo record to DB with PostGIS point

Certificate / PBG upload flow:
  1. Receive file (PDF or image)
  2. Upload to MinIO
  3. Update filecertif_url / filepbg_url in DB
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.pengguna import Pengguna, UserRoleEnum
from app.models.photo import Photo
from app.models.certificate import Certificate
from app.models.pbg import PBG
from app.models.property import Property
from app.models.developer import Developer
from app.services.storage import upload_file
from app.services.exif import extract_exif
from app.services.geocoding import reverse_geocode
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
ALLOWED_DOC_TYPES   = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


async def _check_property_ownership(
    prop_id: uuid.UUID,
    user: Pengguna,
    db: AsyncSession,
) -> Property:
    """Verify user owns (or is admin of) the property."""
    result = await db.execute(select(Property).where(Property.prop_id == prop_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Properti tidak ditemukan")

    if user.user_role == UserRoleEnum.Admin:
        return prop

    # Check developer owns this property
    dev_result = await db.execute(
        select(Developer).where(Developer.user_id == user.user_id)
    )
    dev = dev_result.scalar_one_or_none()
    if not dev or dev.dev_id != prop.dev_id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke properti ini")

    return prop


@router.post("/photo/{prop_id}")
async def upload_photo(
    prop_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """
    Upload a property photo.
    - Extracts EXIF GPS → PostGIS point
    - Reverse geocodes to Indonesian admin divisions
    - Stores in MinIO, saves Photo record
    """
    # Validate prop_id
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    await _check_property_ownership(pid, current_user, db)

    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung. Gunakan: JPEG, PNG, WebP"
        )

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 20MB")

    # 1. Extract EXIF
    exif = extract_exif(file_bytes)

    # 2. Reverse geocode if GPS available
    geo = {"kabupatenkota": None, "kecamatan": None, "desa": None, "kelurahan": None}
    if exif["has_gps"]:
        geo = await reverse_geocode(exif["lat"], exif["lng"])

    # 3. Upload to MinIO
    storage = upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "photo.jpg",
        folder="photos",
        content_type=file.content_type,
    )

    # 4. Build PostGIS point
    # If no GPS in EXIF, use a default point (can be updated later)
    lat = exif["lat"] if exif["has_gps"] else 0.0
    lng = exif["lng"] if exif["has_gps"] else 0.0
    point = WKTElement(f"POINT({lng} {lat})", srid=4326)

    # 5. Save Photo record
    photo = Photo(
        photo_id=uuid.uuid4(),
        prop_id=pid,
        location=point,
        kabupatenkota=geo.get("kabupatenkota"),
        kecamatan=geo.get("kecamatan"),
        desa=geo.get("desa"),
        kelurahan=geo.get("kelurahan"),
        filephoto_url=storage["file_url"],
        time_taken=exif["time_taken"] or datetime.utcnow(),
        serverphoto_address=storage["object_key"],
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    return {
        "photo_id": str(photo.photo_id),
        "file_url": storage["file_url"],
        "object_key": storage["object_key"],
        "exif": {
            "has_gps": exif["has_gps"],
            "lat": exif["lat"],
            "lng": exif["lng"],
            "has_datetime": exif["has_datetime"],
            "time_taken": exif["time_taken"].isoformat() if exif["time_taken"] else None,
        },
        "geocoding": {
            "kabupatenkota": geo.get("kabupatenkota"),
            "kecamatan": geo.get("kecamatan"),
            "desa": geo.get("desa"),
            "kelurahan": geo.get("kelurahan"),
        },
        "message": (
            "Foto berhasil diupload dengan lokasi GPS terdeteksi"
            if exif["has_gps"]
            else "Foto berhasil diupload (tidak ada data GPS di EXIF)"
        ),
    }


@router.post("/certificate/{prop_id}")
async def upload_certificate(
    prop_id: str,
    file: UploadFile = File(...),
    nib: str = Form(...),
    hak: str = Form(...),
    owner_name: str = Form(...),
    written_address: str = Form(...),
    luas_tanah: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """Upload E-Sertifikat Tanah for a property."""
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    await _check_property_ownership(pid, current_user, db)

    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Upload PDF atau gambar")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 20MB")

    storage = upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "certificate.pdf",
        folder="certificates",
        content_type=file.content_type,
    )

    # Check if certificate already exists for this property
    existing = await db.execute(
        select(Certificate).where(Certificate.prop_id == pid)
    )
    cert = existing.scalar_one_or_none()

    if cert:
        # Update existing
        cert.filecertif_url = storage["file_url"]
        cert.nib = nib
        cert.owner_name = owner_name
        cert.writtencertif_address = written_address
        if luas_tanah is not None:
            cert.luas_tanah = luas_tanah
    else:
        # Create new
        from app.models.certificate import HakEnum
        try:
            hak_enum = HakEnum(hak)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Nilai hak tidak valid: {hak}")

        cert = Certificate(
            certif_id=uuid.uuid4(),
            prop_id=pid,
            nib=nib,
            filecertif_url=storage["file_url"],
            hak=hak_enum,
            owner_name=owner_name,
            writtencertif_address=written_address,
            luas_tanah=luas_tanah,
        )
        db.add(cert)

    await db.commit()

    return {
        "certif_id": str(cert.certif_id),
        "file_url": storage["file_url"],
        "object_key": storage["object_key"],
        "message": "Sertifikat berhasil diupload",
    }


@router.post("/pbg/{prop_id}")
async def upload_pbg(
    prop_id: str,
    file: UploadFile = File(...),
    pbg_number: str = Form(...),
    owner_name: str = Form(...),
    written_address: str = Form(...),
    luas_bangunan: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """Upload PBG (Persetujuan Bangunan Gedung) for a property."""
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    await _check_property_ownership(pid, current_user, db)

    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Upload PDF atau gambar")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 20MB")

    storage = upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "pbg.pdf",
        folder="pbg",
        content_type=file.content_type,
    )

    existing = await db.execute(select(PBG).where(PBG.prop_id == pid))
    pbg = existing.scalar_one_or_none()

    if pbg:
        pbg.filepbg_url = storage["file_url"]
        pbg.pbg_number = pbg_number
        pbg.owner_name = owner_name
        pbg.writtenpbg_address = written_address
        if luas_bangunan is not None:
            pbg.luas_bangunan = luas_bangunan
    else:
        pbg = PBG(
            pbg_id=uuid.uuid4(),
            prop_id=pid,
            pbg_number=pbg_number,
            filepbg_url=storage["file_url"],
            owner_name=owner_name,
            writtenpbg_address=written_address,
            luas_bangunan=luas_bangunan,
        )
        db.add(pbg)

    await db.commit()

    return {
        "pbg_id": str(pbg.pbg_id),
        "file_url": storage["file_url"],
        "object_key": storage["object_key"],
        "message": "PBG berhasil diupload",
    }


@router.patch("/photo/{photo_id}/location")
async def update_photo_location(
    photo_id: str,
    lat: float = Form(...),
    lng: float = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """
    Manually set/correct GPS location for a photo.
    Also re-runs reverse geocoding.
    """
    try:
        phid = uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid photo ID")

    result = await db.execute(select(Photo).where(Photo.photo_id == phid))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")

    # Re-geocode with new coordinates
    geo = await reverse_geocode(lat, lng)

    photo.location = WKTElement(f"POINT({lng} {lat})", srid=4326)
    photo.kabupatenkota = geo.get("kabupatenkota")
    photo.kecamatan = geo.get("kecamatan")
    photo.desa = geo.get("desa")
    photo.kelurahan = geo.get("kelurahan")

    await db.commit()

    return {
        "message": "Lokasi foto berhasil diperbarui",
        "lat": lat,
        "lng": lng,
        "geocoding": geo,
    }