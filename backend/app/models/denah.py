from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Denah(Base):
    __tablename__ = "denah"

    denah_id       = Column(UUID(as_uuid=True), primary_key=True)
    prop_id        = Column(UUID(as_uuid=True), ForeignKey("property.prop_id"), nullable=False)
    serverdenah_address = Column(String(255), nullable=False)
    filedenah_url       = Column(String(500))

    property = relationship("Property", back_populates="denahs")