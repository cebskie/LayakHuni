import enum
from sqlalchemy import Column, Enum, String, Numeric, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class HakEnum(enum.Enum):
    Hak_Guna_Usaha    = "Hak Guna Usaha"
    Hak_Pakai         = "Hak Pakai"
    Hak_Milik         = "Hak Milik"
    Hak_Guna_Bangunan = "Hak Guna Bangunan"
    Hak_Tanggungan    = "Hak Tanggungan"
    Hak_Pengelolaan   = "Hak Pengelolaan"


class Certificate(Base):
    __tablename__ = "certificate"

    certif_id             = Column(UUID(as_uuid=True), primary_key=True)
    prop_id               = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    nib                   = Column(String(100), nullable=False)
    filecertif_url        = Column(String(500))
    hak                   = Column(Enum(HakEnum, name="hak_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    qr_url                = Column(String(500))
    owner_name            = Column(String(200), nullable=False)
    writtencertif_address = Column(String(500), nullable=False)
    luas_tanah            = Column(Numeric(10, 2))

    # OCR result columns
    ocr_raw_text          = Column(Text)
    ocr_confidence        = Column(Numeric(4, 3))
    ocr_status            = Column(String(10))   # high / medium / low
    ocr_field_scores      = Column(JSONB)
    ocr_processed_at      = Column(DateTime)

    property = relationship("Property", back_populates="certificates")
