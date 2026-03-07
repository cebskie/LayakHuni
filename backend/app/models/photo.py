from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class Photo(Base):
    __tablename__ = "photo"

    photo_id       = Column(UUID(as_uuid=True), primary_key=True)
    prop_id        = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    location       = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    kabupatenkota  = Column(String(100))
    kecamatan      = Column(String(100))
    desa           = Column(String(100))
    kelurahan      = Column(String(100))
    filephoto_url       = Column(String(500))
    time_taken     = Column(DateTime, nullable=False)
    serverphoto_address = Column(String(255), nullable=False)

    property = relationship("Property", back_populates="photos")