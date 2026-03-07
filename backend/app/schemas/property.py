from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from enum import Enum


class PropertyStatus(str, Enum):
    Valid = "Valid"
    Non_Valid = "Non Valid"


class SalesStatus(str, Enum):
    Available = "Available"
    Reserved = "Reserved"
    Sold = "Sold"


class HakEnum(str, Enum):
    Hak_Milik = "Hak Milik"
    Hak_Guna_Usaha = "Hak Guna Usaha"
    Hak_Guna_Bangunan = "Hak Guna Bangunan"
    Hak_Pakai = "Hak Pakai"
    Hak_Pengelolaan = "Hak Pengelolaan"
    Hak_Tanggungan = "Hak Tanggungan"


class PhotoOut(BaseModel):
    photo_id: str
    filephoto_url: Optional[str]
    kabupatenkota: Optional[str]
    kecamatan: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    time_taken: Optional[datetime]

    class Config:
        from_attributes = True


class CertificateOut(BaseModel):
    certif_id: str
    nib: str
    hak: str
    owner_name: str
    writtencertif_address: str
    luas_tanah: Optional[float]
    qr_url: Optional[str]
    filecertif_url: Optional[str]

    class Config:
        from_attributes = True


class PBGOut(BaseModel):
    pbg_id: str
    pbg_number: str
    owner_name: str
    writtenpbg_address: str
    luas_bangunan: Optional[float]
    filepbg_url: Optional[str]

    class Config:
        from_attributes = True


class DenahOut(BaseModel):
    denah_id: str
    filedenah_url: Optional[str]

    class Config:
        from_attributes = True


class DeveloperInfo(BaseModel):
    dev_id: str
    user_name: str
    email: str
    phone: str
    verif_status: str

    class Config:
        from_attributes = True


class PropertyListItem(BaseModel):
    prop_id: str
    property_name: str
    description: Optional[str]
    property_status: str
    sales_status: str
    price: float
    full_address: str
    created_at: datetime
    cover_photo: Optional[str] = None
    kabupatenkota: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_certificate: bool = False
    has_pbg: bool = False
    hak: Optional[str] = None
    developer_name: Optional[str] = None

    class Config:
        from_attributes = True


class PropertyDetail(BaseModel):
    prop_id: str
    property_name: str
    description: Optional[str]
    property_status: str
    sales_status: str
    price: float
    full_address: str
    created_at: datetime
    photos: List[PhotoOut] = []
    certificate: Optional[CertificateOut] = None
    pbg: Optional[PBGOut] = None
    denah: Optional[DenahOut] = None
    developer: Optional[DeveloperInfo] = None

    class Config:
        from_attributes = True


class PropertyCreate(BaseModel):
    property_name: str
    description: Optional[str] = None
    price: Decimal
    full_address: str
    sales_status: SalesStatus = SalesStatus.Available


class PropertyFilters(BaseModel):
    search: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sales_status: Optional[str] = None
    property_status: Optional[str] = None
    hak: Optional[str] = None
    kabupatenkota: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: Optional[float] = None
    page: int = 1
    limit: int = 12
