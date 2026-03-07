from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from app.core.deps import get_db, get_current_user
from app.models.pengguna import Pengguna
from app.models.property import Property, PropStatusEnum, SalesStatusEnum
from app.models.photo import Photo
from app.models.certificate import Certificate
from app.models.pbg import PBG
from app.models.denah import Denah
from app.models.developer import Developer
from app.schemas.property import (
    PropertyListItem, PropertyDetail, PropertyCreate,
    PhotoOut, CertificateOut, PBGOut, DenahOut, DeveloperInfo
)
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID, ST_AsText, ST_X, ST_Y

router = APIRouter(prefix="/properties", tags=["properties"])


def _extract_coords(photo: Photo):
    """Extract lat/lng from PostGIS geometry."""
    lat, lng = None, None
    try:
        if photo.location is not None:
            lat = float(photo.latitude) if hasattr(photo, 'latitude') else None
            lng = float(photo.longitude) if hasattr(photo, 'longitude') else None
    except Exception:
        pass
    return lat, lng


@router.get("", response_model=dict)
async def list_properties(
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sales_status: Optional[str] = Query(None),
    property_status: Optional[str] = Query(None),
    hak: Optional[str] = Query(None),
    kabupatenkota: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    # Build base query with joins
    stmt = (
        select(Property)
        .options(
            selectinload(Property.photos),
            selectinload(Property.certificates),
            selectinload(Property.pbgs),
            selectinload(Property.developer).selectinload(Developer.pengguna),
        )
    )

    filters = []

    if search:
        filters.append(
            or_(
                Property.property_name.ilike(f"%{search}%"),
                Property.full_address.ilike(f"%{search}%"),
                Property.description.ilike(f"%{search}%"),
            )
        )

    if min_price is not None:
        filters.append(Property.price >= min_price)
    if max_price is not None:
        filters.append(Property.price <= max_price)
    if sales_status:
        filters.append(Property.sales_status == sales_status)
    if property_status:
        filters.append(Property.property_status == property_status)
    if kabupatenkota:
        filters.append(
            Property.prop_id.in_(
                select(Photo.prop_id).where(Photo.kabupatenkota.ilike(f"%{kabupatenkota}%"))
            )
        )
    if hak:
        filters.append(
            Property.prop_id.in_(
                select(Certificate.prop_id).where(Certificate.hak == hak)
            )
        )

    # Spatial radius filter
    if lat is not None and lng is not None and radius_km is not None:
        point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        filters.append(
            Property.prop_id.in_(
                select(Photo.prop_id).where(
                    ST_DWithin(
                        Photo.location,
                        point,
                        radius_km * 1000  # meters
                    )
                )
            )
        )

    if filters:
        stmt = stmt.where(and_(*filters))

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginate
    stmt = stmt.order_by(Property.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    properties = result.scalars().all()

    items = []
    for prop in properties:
        cover_photo = None
        lat_val = None
        lng_val = None
        kota = None
        if prop.photos:
            cover_photo = prop.photos[0].filephoto_url
            kota = prop.photos[0].kabupatenkota
            # Get coordinates via raw query for this photo
            coord_result = await db.execute(
                text("SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM photo WHERE photo_id = :pid"),
                {"pid": prop.photos[0].photo_id}
            )
            row = coord_result.fetchone()
            if row:
                lat_val = float(row.lat) if row.lat else None
                lng_val = float(row.lng) if row.lng else None

        cert = prop.certificates[0] if prop.certificates else None
        pbg = prop.pbgs[0] if prop.pbgs else None
        dev_name = prop.developer.pengguna.user_name if prop.developer and prop.developer.pengguna else None

        items.append(PropertyListItem(
            prop_id=str(prop.prop_id),
            property_name=prop.property_name,
            description=prop.description,
            property_status=prop.property_status.value,
            sales_status=prop.sales_status.value,
            price=float(prop.price),
            full_address=prop.full_address,
            created_at=prop.created_at,
            cover_photo=cover_photo,
            kabupatenkota=kota,
            latitude=lat_val,
            longitude=lng_val,
            has_certificate=cert is not None,
            has_pbg=pbg is not None,
            hak=cert.hak if cert else None,
            developer_name=dev_name,
        ))

    return {
        "items": [i.model_dump() for i in items],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/map-pins", response_model=List[dict])
async def get_map_pins(
    kabupatenkota: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get all property pins for map display."""
    query = text("""
        SELECT
            p.prop_id,
            p.property_name,
            p.price,
            p.sales_status,
            p.property_status,
            ph.filephoto_url as cover_photo,
            ph.kabupatenkota,
            ST_Y(ph.location::geometry) as lat,
            ST_X(ph.location::geometry) as lng
        FROM property p
        LEFT JOIN LATERAL (
            SELECT * FROM photo WHERE prop_id = p.prop_id LIMIT 1
        ) ph ON true
        WHERE ph.location IS NOT NULL
        """ + (f" AND ph.kabupatenkota ILIKE :kota" if kabupatenkota else "") + """
        ORDER BY p.created_at DESC
    """)

    params = {"kota": f"%{kabupatenkota}%"} if kabupatenkota else {}
    result = await db.execute(query, params)
    rows = result.fetchall()

    return [
        {
            "prop_id": str(r.prop_id),
            "property_name": r.property_name,
            "price": float(r.price),
            "sales_status": r.sales_status,
            "property_status": r.property_status,
            "cover_photo": r.cover_photo,
            "kabupatenkota": r.kabupatenkota,
            "lat": float(r.lat) if r.lat else None,
            "lng": float(r.lng) if r.lng else None,
        }
        for r in rows
        if r.lat and r.lng
    ]


@router.get("/stats", response_model=dict)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Dashboard stats for admin."""
    total_props = await db.execute(select(func.count(Property.prop_id)))
    total_certs = await db.execute(select(func.count(Certificate.certif_id)))
    avg_price = await db.execute(select(func.avg(Property.price)))

    by_status = await db.execute(
        select(Property.sales_status, func.count(Property.prop_id))
        .group_by(Property.sales_status)
    )

    by_hak = await db.execute(
        select(Certificate.hak, func.count(Certificate.certif_id))
        .group_by(Certificate.hak)
    )

    by_kota = await db.execute(
        select(Photo.kabupatenkota, func.count(Photo.photo_id))
        .where(Photo.kabupatenkota.isnot(None))
        .group_by(Photo.kabupatenkota)
        .order_by(func.count(Photo.photo_id).desc())
        .limit(10)
    )

    price_by_kota = await db.execute(
        text("""
            SELECT ph.kabupatenkota, AVG(p.price) as avg_price, COUNT(p.prop_id) as count
            FROM property p
            JOIN photo ph ON ph.prop_id = p.prop_id
            WHERE ph.kabupatenkota IS NOT NULL
            GROUP BY ph.kabupatenkota
            ORDER BY count DESC
            LIMIT 10
        """)
    )

    return {
        "total_properties": total_props.scalar(),
        "total_certificates": total_certs.scalar(),
        "avg_price": float(avg_price.scalar() or 0),
        "by_sales_status": [{"status": r[0], "count": r[1]} for r in by_status.fetchall()],
        "by_hak": [{"hak": r[0], "count": r[1]} for r in by_hak.fetchall()],
        "by_kota": [{"kota": r[0], "count": r[1]} for r in by_kota.fetchall()],
        "price_by_kota": [{"kota": r.kabupatenkota, "avg_price": float(r.avg_price), "count": r.count} for r in price_by_kota.fetchall()],
    }


@router.get("/{prop_id}", response_model=dict)
async def get_property(prop_id: str, db: AsyncSession = Depends(get_db)):
    try:
        pid = uuid.UUID(prop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    result = await db.execute(
        select(Property)
        .options(
            selectinload(Property.photos),
            selectinload(Property.certificates),
            selectinload(Property.pbgs),
            selectinload(Property.denahs),
            selectinload(Property.developer).selectinload(Developer.pengguna),
        )
        .where(Property.prop_id == pid)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Get photo coordinates
    photos_out = []
    for photo in prop.photos:
        coord_result = await db.execute(
            text("SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM photo WHERE photo_id = :pid"),
            {"pid": photo.photo_id}
        )
        row = coord_result.fetchone()
        lat_val = float(row.lat) if row and row.lat else None
        lng_val = float(row.lng) if row and row.lng else None

        photos_out.append({
            "photo_id": str(photo.photo_id),
            "filephoto_url": photo.filephoto_url,
            "kabupatenkota": photo.kabupatenkota,
            "kecamatan": photo.kecamatan,
            "desa": photo.desa,
            "kelurahan": photo.kelurahan,
            "latitude": lat_val,
            "longitude": lng_val,
            "time_taken": photo.time_taken.isoformat() if photo.time_taken else None,
        })

    cert = prop.certificates[0] if prop.certificates else None
    pbg = prop.pbgs[0] if prop.pbgs else None
    denah = prop.denahs[0] if prop.denahs else None
    dev = prop.developer
    dev_user = dev.pengguna if dev else None

    return {
        "prop_id": str(prop.prop_id),
        "property_name": prop.property_name,
        "description": prop.description,
        "property_status": prop.property_status.value,
        "sales_status": prop.sales_status.value,
        "price": float(prop.price),
        "full_address": prop.full_address,
        "created_at": prop.created_at.isoformat(),
        "photos": photos_out,
        "certificate": {
            "certif_id": str(cert.certif_id),
            "nib": cert.nib,
            "hak": cert.hak,
            "owner_name": cert.owner_name,
            "writtencertif_address": cert.writtencertif_address,
            "luas_tanah": float(cert.luas_tanah) if cert.luas_tanah else None,
            "qr_url": cert.qr_url,
            "filecertif_url": cert.filecertif_url,
        } if cert else None,
        "pbg": {
            "pbg_id": str(pbg.pbg_id),
            "pbg_number": pbg.pbg_number,
            "owner_name": pbg.owner_name,
            "writtenpbg_address": pbg.writtenpbg_address,
            "luas_bangunan": float(pbg.luas_bangunan) if pbg.luas_bangunan else None,
            "filepbg_url": pbg.filepbg_url,
        } if pbg else None,
        "denah": {
            "denah_id": str(denah.denah_id),
            "filedenah_url": denah.filedenah_url,
        } if denah else None,
        "developer": {
            "dev_id": str(dev.dev_id),
            "user_name": dev_user.user_name if dev_user else "",
            "email": dev_user.email if dev_user else "",
            "phone": dev_user.phone if dev_user else "",
            "verif_status": dev.verif_status.value,
        } if dev else None,
    }


@router.post("", response_model=dict)
async def create_property(
    body: PropertyCreate,
    current_user: Pengguna = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.developer import Developer
    dev_result = await db.execute(
        select(Developer).where(Developer.user_id == current_user.user_id)
    )
    dev = dev_result.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=403, detail="Only developers can create properties")

    prop = Property(
        prop_id=uuid.uuid4(),
        dev_id=dev.dev_id,
        property_name=body.property_name,
        description=body.description,
        property_status=PropStatusEnum.Non_Valid,
        sales_status=SalesStatusEnum(body.sales_status.value),
        price=body.price,
        full_address=body.full_address,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)

    return {"prop_id": str(prop.prop_id), "message": "Property created successfully"}
