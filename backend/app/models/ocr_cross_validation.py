from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class OcrCrossValidation(Base):
    __tablename__ = "ocr_cross_validation"

    cv_id                       = Column(UUID(as_uuid=True), primary_key=True)
    prop_id                     = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    owner_name_similarity       = Column(Numeric(4, 3))
    address_cert_pbg_similarity = Column(Numeric(4, 3))
    address_photo_similarity    = Column(Numeric(4, 3))
    issues                      = Column(JSONB)
    cert_confidence_adjusted    = Column(Numeric(4, 3))
    pbg_confidence_adjusted     = Column(Numeric(4, 3))
    cert_status_adjusted        = Column(String(10))
    pbg_status_adjusted         = Column(String(10))
    validated_at                = Column(DateTime, server_default=func.now())

    property = relationship("Property", back_populates="ocr_validations")
