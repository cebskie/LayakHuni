from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customer"

    cust_id   = Column(UUID(as_uuid=True), primary_key=True)
    cust_code = Column(String(10), nullable=False, unique=True)
    user_id   = Column(UUID(as_uuid=True), ForeignKey("pengguna.user_id"), nullable=False, unique=True)

    pengguna    = relationship("Pengguna",back_populates="customer")