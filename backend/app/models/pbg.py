from sqlalchemy import Column, String, Numeric, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class PBG(Base):
    __tablename__ = "pbg"

    pbg_id               = Column(UUID(as_uuid=True), primary_key=True)
    prop_id              = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    pbg_number           = Column(String(100), nullable=False)
    filepbg_url          = Column(String(500))
    owner_name           = Column(String(200), nullable=False)
    writtenpbg_address   = Column(String(500), nullable=False)
    luas_bangunan        = Column(Numeric(10, 2))

    # OCR result columns
    ocr_raw_text         = Column(Text)
    ocr_confidence       = Column(Numeric(4, 3))
    ocr_status           = Column(String(10))   # high / medium / low
    ocr_field_scores     = Column(JSONB)
    ocr_processed_at     = Column(DateTime)

    property = relationship("Property", back_populates="pbgs")
