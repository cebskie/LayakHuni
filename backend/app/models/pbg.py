from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class PBG(Base):
    __tablename__ = "pbg"

    pbg_id          = Column(UUID(as_uuid=True), primary_key=True)
    prop_id         = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    pbg_number      = Column(String(100), nullable=False)
    filepbg_url        = Column(String(500))
    owner_name      = Column(String(200), nullable=False)
    writtenpbg_address = Column(String(500), nullable=False)
    luas_bangunan   = Column(Numeric(10, 2))

    property = relationship("Property", back_populates="pbgs")