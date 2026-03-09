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
  3. Run OCR → extract fields + confidence scores
  4. Run cross-validation if both cert and PBG exist
  5. Save/update DB record with OCR results
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
from app.models.certificate import Certificate, HakEnum
from app.models.pbg import PBG
from app.models.property import Property
from app.models.developer import Developer
from app.models.ocr_cross_validation import OcrCrossValidation
from app.services.storage import upload_file
from app.services.exif import extract_exif
from app.services.geocoding import reverse_geocode
from app.services.ocr import extract_certificate, extract_pbg, cross_validate
from geoalchemy2.elements import WKTElement

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
ALLOWED_DOC_TYPES   = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


async def _check_property_ownership(prop_id: uuid.UUID, user: Pengguna, db: AsyncSession) -> Property:
    result = await db.execute(select(Property).where(Property.prop_id == prop_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Properti tidak ditemukan")
    if user.user_role == UserRoleEnum.Admin:
        return prop
    dev_result = await db.execute(select(Developer).where(Developer.user_id == user.user_id))
    dev = dev_result.scalar_one_or_none()
    if not dev or dev.dev_id != prop.dev_id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke properti ini")
    return prop


async def _run_cross_validation(pid: uuid.UUID, db: AsyncSession):
    """
    Run cross-validation across cert, PBG, and photo for a property.
    Saves/updates ocr_cross_validation record.
    """
    cert_res = await db.execute(select(Certificate).where(Certificate.prop_id == pid))
    cert = cert_res.scalar_one_or_none()

    pbg_res = await db.execute(select(PBG).where(PBG.prop_id == pid))
    pbg = pbg_res.scalar_one_or_none()

    photo_res = await db.execute(select(Photo).where(Photo.prop_id == pid))
    photo = photo_res.scalars().first()

    # Build dicts for cross_validate
    cert_dict = None
    if cert and cert.ocr_confidence is not None:
        cert_dict = {
            "owner_name": cert.owner_name,
            "address": cert.writtencertif_address,
            "overall_confidence": float(cert.ocr_confidence),
        }

    pbg_dict = None
    if pbg and pbg.ocr_confidence is not None:
        pbg_dict = {
            "owner_name": pbg.owner_name,
            "address": pbg.writtenpbg_address,
            "overall_confidence": float(pbg.ocr_confidence),
        }

    geo_dict = None
    if photo:
        geo_dict = {
            "kabupatenkota": photo.kabupatenkota,
            "kecamatan": photo.kecamatan,
            "desa": photo.desa,
        }

    if not cert_dict and not pbg_dict:
        return None

    cv = cross_validate(cert_dict, pbg_dict, geo_dict)

    # Upsert cross-validation record
    existing = await db.execute(
        select(OcrCrossValidation).where(OcrCrossValidation.prop_id == pid)
    )
    cv_record = existing.scalar_one_or_none()

    if cv_record:
        cv_record.owner_name_similarity       = cv["owner_name_similarity"]
        cv_record.address_cert_pbg_similarity = cv["address_cert_pbg_similarity"]
        cv_record.address_photo_similarity    = cv["address_photo_similarity"]
        cv_record.issues                      = cv["issues"]
        cv_record.cert_confidence_adjusted    = cv["cert_confidence_adjusted"]
        cv_record.pbg_confidence_adjusted     = cv["pbg_confidence_adjusted"]
        cv_record.cert_status_adjusted        = cv["cert_status_adjusted"]
        cv_record.pbg_status_adjusted         = cv["pbg_status_adjusted"]
        cv_record.validated_at                = datetime.utcnow()
    else:
        cv_record = OcrCrossValidation(
            cv_id=uuid.uuid4(),
            prop_id=pid,
            owner_name_similarity       = cv["owner_name_similarity"],
            address_cert_pbg_similarity = cv["address_cert_pbg_similarity"],
            address_photo_similarity    = cv["address_photo_similarity"],
            issues                      = cv["issues"],
            cert_confidence_adjusted    = cv["cert_confidence_adjusted"],
            pbg_confidence_adjusted     = cv["pbg_confidence_adjusted"],
            cert_status_adjusted        = cv["cert_status_adjusted"],
            pbg_status_adjusted         = cv["pbg_status_adjusted"],
        )
        db.add(cv_record)

    await db.commit()
    return cv


# ─────────────────────────────────────────────────────────────────────────────
#  Photo upload
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/photo/{prop_id}")
async def upload_photo(
    prop_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    await _check_property_ownership(pid, current_user, db)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Gunakan format JPEG, PNG, atau WebP")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 20MB")

    exif = extract_exif(file_bytes)

    geo = {"kabupatenkota": None, "kecamatan": None, "desa": None, "kelurahan": None}
    if exif["has_gps"]:
        geo = await reverse_geocode(exif["lat"], exif["lng"])

    storage = upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "photo.jpg",
        folder="photos",
        content_type=file.content_type,
    )

    lat = exif["lat"] if exif["has_gps"] else 0.0
    lng = exif["lng"] if exif["has_gps"] else 0.0
    point = WKTElement(f"POINT({lng} {lat})", srid=4326)

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

    # Re-run cross-validation now that we have photo geocoding
    await _run_cross_validation(pid, db)

    return {
        "photo_id": str(photo.photo_id),
        "file_url": storage["file_url"],
        "exif": {
            "has_gps": exif["has_gps"],
            "lat": exif["lat"],
            "lng": exif["lng"],
            "has_datetime": exif["has_datetime"],
            "time_taken": exif["time_taken"].isoformat() if exif["time_taken"] else None,
        },
        "geocoding": geo,
        "message": (
            "Foto berhasil diupload dengan lokasi GPS terdeteksi"
            if exif["has_gps"]
            else "Foto berhasil diupload (tidak ada data GPS di EXIF)"
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Certificate upload
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/certificate/{prop_id}")
async def upload_certificate(
    prop_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """
    Upload E-Sertifikat → OCR extracts all fields automatically.
    No manual form input needed.
    """
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

    # 1. Upload to MinIO
    storage = upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "certificate.pdf",
        folder="certificates",
        content_type=file.content_type,
    )

    # 2. Run OCR
    ocr = extract_certificate(file_bytes, file.content_type)

    # 3. Resolve hak enum (fallback to Hak Milik if not detected)
    hak_value = ocr.get("hak") or "Hak Milik"
    try:
        hak_enum = HakEnum(hak_value)
    except ValueError:
        hak_enum = HakEnum.Hak_Milik

    # 4. Upsert Certificate record
    existing = await db.execute(select(Certificate).where(Certificate.prop_id == pid))
    cert = existing.scalar_one_or_none()

    now = datetime.utcnow()

    if cert:
        cert.filecertif_url        = storage["file_url"]
        cert.nib                   = ocr["nib"] or "PENDING_REVIEW"
        cert.hak                   = hak_enum
        cert.owner_name            = ocr["owner_name"] or "PENDING_REVIEW"
        cert.writtencertif_address = ocr["address"] or "PENDING_REVIEW"
        cert.luas_tanah            = ocr["luas_tanah"]
        cert.ocr_raw_text          = ocr["raw_text"]
        cert.ocr_confidence        = ocr["overall_confidence"]
        cert.ocr_status            = ocr["confidence_status"]
        cert.ocr_field_scores      = ocr["field_scores"]
        cert.ocr_processed_at      = now
    else:
        cert = Certificate(
            certif_id             = uuid.uuid4(),
            prop_id               = pid,
            nib                   = ocr["nib"] or "PENDING_REVIEW",
            filecertif_url        = storage["file_url"],
            hak                   = hak_enum,
            owner_name            = ocr["owner_name"] or "PENDING_REVIEW",
            writtencertif_address = ocr["address"] or "PENDING_REVIEW",
            luas_tanah            = ocr["luas_tanah"],
            ocr_raw_text          = ocr["raw_text"],
            ocr_confidence        = ocr["overall_confidence"],
            ocr_status            = ocr["confidence_status"],
            ocr_field_scores      = ocr["field_scores"],
            ocr_processed_at      = now,
        )
        db.add(cert)

    await db.commit()

    # 5. Cross-validate
    cv = await _run_cross_validation(pid, db)

    return {
        "certif_id":    str(cert.certif_id),
        "file_url":     storage["file_url"],
        "ocr": {
            "nib":                ocr["nib"],
            "owner_name":         ocr["owner_name"],
            "hak":                ocr["hak"],
            "address":            ocr["address"],
            "luas_tanah":         ocr["luas_tanah"],
            "overall_confidence": ocr["overall_confidence"],
            "confidence_status":  ocr["confidence_status"],
            "field_scores":       ocr["field_scores"],
        },
        "cross_validation": cv,
        "message": f"Sertifikat diupload. OCR confidence: {ocr['confidence_status']} ({ocr['overall_confidence']:.0%})",
    }


# ─────────────────────────────────────────────────────────────────────────────
#  PBG upload
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/pbg/{prop_id}")
async def upload_pbg(
    prop_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """
    Upload PBG → OCR extracts all fields automatically.
    No manual form input needed.
    """
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

    ocr = extract_pbg(file_bytes, file.content_type)

    existing = await db.execute(select(PBG).where(PBG.prop_id == pid))
    pbg = existing.scalar_one_or_none()

    now = datetime.utcnow()

    if pbg:
        pbg.filepbg_url          = storage["file_url"]
        pbg.pbg_number           = ocr["pbg_number"] or "PENDING_REVIEW"
        pbg.owner_name           = ocr["owner_name"] or "PENDING_REVIEW"
        pbg.writtenpbg_address   = ocr["address"] or "PENDING_REVIEW"
        pbg.luas_bangunan        = ocr["luas_bangunan"]
        pbg.ocr_raw_text         = ocr["raw_text"]
        pbg.ocr_confidence       = ocr["overall_confidence"]
        pbg.ocr_status           = ocr["confidence_status"]
        pbg.ocr_field_scores     = ocr["field_scores"]
        pbg.ocr_processed_at     = now
    else:
        pbg = PBG(
            pbg_id              = uuid.uuid4(),
            prop_id             = pid,
            pbg_number          = ocr["pbg_number"] or "PENDING_REVIEW",
            filepbg_url         = storage["file_url"],
            owner_name          = ocr["owner_name"] or "PENDING_REVIEW",
            writtenpbg_address  = ocr["address"] or "PENDING_REVIEW",
            luas_bangunan       = ocr["luas_bangunan"],
            ocr_raw_text        = ocr["raw_text"],
            ocr_confidence      = ocr["overall_confidence"],
            ocr_status          = ocr["confidence_status"],
            ocr_field_scores    = ocr["field_scores"],
            ocr_processed_at    = now,
        )
        db.add(pbg)

    await db.commit()

    cv = await _run_cross_validation(pid, db)

    return {
        "pbg_id":   str(pbg.pbg_id),
        "file_url": storage["file_url"],
        "ocr": {
            "pbg_number":         ocr["pbg_number"],
            "owner_name":         ocr["owner_name"],
            "address":            ocr["address"],
            "luas_bangunan":      ocr["luas_bangunan"],
            "overall_confidence": ocr["overall_confidence"],
            "confidence_status":  ocr["confidence_status"],
            "field_scores":       ocr["field_scores"],
        },
        "cross_validation": cv,
        "message": f"PBG diupload. OCR confidence: {ocr['confidence_status']} ({ocr['overall_confidence']:.0%})",
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Manual location correction
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/photo/{photo_id}/location")
async def update_photo_location(
    photo_id: str,
    lat: float = Form(...),
    lng: float = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    try:
        phid = uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid photo ID")

    result = await db.execute(select(Photo).where(Photo.photo_id == phid))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")

    geo = await reverse_geocode(lat, lng)
    photo.location      = WKTElement(f"POINT({lng} {lat})", srid=4326)
    photo.kabupatenkota = geo.get("kabupatenkota")
    photo.kecamatan     = geo.get("kecamatan")
    photo.desa          = geo.get("desa")
    photo.kelurahan     = geo.get("kelurahan")
    await db.commit()

    # Re-run cross-validation with updated location
    await _run_cross_validation(photo.prop_id, db)

    return {"message": "Lokasi foto berhasil diperbarui", "lat": lat, "lng": lng, "geocoding": geo}


# ─────────────────────────────────────────────────────────────────────────────
#  OCR status endpoint (for PropertyDetail page)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/ocr-status/{prop_id}")
async def get_ocr_status(
    prop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user),
):
    """Returns OCR results + cross-validation for a property."""
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    cert_res = await db.execute(select(Certificate).where(Certificate.prop_id == pid))
    cert = cert_res.scalar_one_or_none()

    pbg_res = await db.execute(select(PBG).where(PBG.prop_id == pid))
    pbg = pbg_res.scalar_one_or_none()

    cv_res = await db.execute(
        select(OcrCrossValidation).where(OcrCrossValidation.prop_id == pid)
    )
    cv = cv_res.scalar_one_or_none()

    def cert_summary(c):
        if not c:
            return None
        return {
            "nib":            c.nib,
            "owner_name":     c.owner_name,
            "hak":            c.hak.value if c.hak else None,
            "address":        c.writtencertif_address,
            "luas_tanah":     float(c.luas_tanah) if c.luas_tanah else None,
            "ocr_confidence": float(c.ocr_confidence) if c.ocr_confidence else None,
            "ocr_status":     c.ocr_status,
            "ocr_field_scores": c.ocr_field_scores,
            "ocr_processed_at": c.ocr_processed_at.isoformat() if c.ocr_processed_at else None,
        }

    def pbg_summary(p):
        if not p:
            return None
        return {
            "pbg_number":    p.pbg_number,
            "owner_name":    p.owner_name,
            "address":       p.writtenpbg_address,
            "luas_bangunan": float(p.luas_bangunan) if p.luas_bangunan else None,
            "ocr_confidence": float(p.ocr_confidence) if p.ocr_confidence else None,
            "ocr_status":    p.ocr_status,
            "ocr_field_scores": p.ocr_field_scores,
            "ocr_processed_at": p.ocr_processed_at.isoformat() if p.ocr_processed_at else None,
        }

    return {
        "certificate":       cert_summary(cert),
        "pbg":               pbg_summary(pbg),
        "cross_validation":  {
            "owner_name_similarity":       float(cv.owner_name_similarity) if cv and cv.owner_name_similarity else None,
            "address_cert_pbg_similarity": float(cv.address_cert_pbg_similarity) if cv and cv.address_cert_pbg_similarity else None,
            "address_photo_similarity":    float(cv.address_photo_similarity) if cv and cv.address_photo_similarity else None,
            "issues":                      cv.issues if cv else [],
            "cert_confidence_adjusted":    float(cv.cert_confidence_adjusted) if cv and cv.cert_confidence_adjusted else None,
            "pbg_confidence_adjusted":     float(cv.pbg_confidence_adjusted) if cv and cv.pbg_confidence_adjusted else None,
            "cert_status_adjusted":        cv.cert_status_adjusted if cv else None,
            "pbg_status_adjusted":         cv.pbg_status_adjusted if cv else None,
        } if cv else None,
    }
