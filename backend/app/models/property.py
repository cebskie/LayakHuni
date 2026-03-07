import enum
from sqlalchemy import Column, String, Enum, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class PropStatusEnum(enum.Enum):
    Valid     = "Valid"
    Non_Valid = "Non Valid"


class SalesStatusEnum(enum.Enum):
    Available = "Available"
    Reserved  = "Reserved"
    Sold      = "Sold"


class Property(Base):
    __tablename__ = "property"

    prop_id       = Column(UUID(as_uuid=True), primary_key=True)
    dev_id        = Column(UUID(as_uuid=True), ForeignKey("developer.dev_id"), nullable=False)
    property_name = Column(String(200), nullable=False)
    description   = Column(Text)
    property_status = Column(Enum(PropStatusEnum,  name="prop_status_enum",  values_callable=lambda x: [e.value for e in x]), nullable=False)
    sales_status    = Column(Enum(SalesStatusEnum, name="sales_status_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    price         = Column(Numeric(15, 2), nullable=False)
    created_at    = Column(DateTime, nullable=False)
    full_address  = Column(String(500), nullable=False)

    developer    = relationship("Developer",   back_populates="properties")
    photos       = relationship("Photo",       back_populates="property")
    denahs       = relationship("Denah",       back_populates="property")
    pbgs         = relationship("PBG",         back_populates="property")
    certificates = relationship("Certificate", back_populates="property")