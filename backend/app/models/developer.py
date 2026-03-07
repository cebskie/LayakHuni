import enum
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class VerifStatusEnum(enum.Enum):
    Verified     = "Verified"
    Not_Verified = "Not Verified"


class Developer(Base):
    __tablename__ = "developer"

    dev_id       = Column(UUID(as_uuid=True), primary_key=True)
    dev_code     = Column(String(10),  nullable=False, unique=True)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("pengguna.user_id"), nullable=False, unique=True)
    verified_at  = Column(DateTime, nullable=False)
    verif_status = Column(Enum(VerifStatusEnum, name="verif_status_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)

    pengguna   = relationship("Pengguna", back_populates="developer")
    properties = relationship("Property", back_populates="developer")