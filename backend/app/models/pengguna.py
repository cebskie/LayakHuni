import enum
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRoleEnum(enum.Enum):
    Admin = "Admin"
    Customer = "Customer"
    Developer = "Developer"


class Pengguna(Base):
    __tablename__ = "pengguna"

    user_id       = Column(UUID(as_uuid=True), primary_key=True)
    user_role     = Column(Enum(UserRoleEnum, name="user_role_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    user_name     = Column(String(100), nullable=False)
    user_password = Column(String(255), nullable=False)
    email         = Column(String(100), nullable=False, unique=True)
    phone         = Column(String(20),  nullable=False)

    customer  = relationship("Customer",  back_populates="pengguna", uselist=False)
    developer = relationship("Developer", back_populates="pengguna", uselist=False)