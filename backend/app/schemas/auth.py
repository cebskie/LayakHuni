from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    Admin = "Admin"
    Customer = "Customer"
    Developer = "Developer"


class RegisterRequest(BaseModel):
    user_name: str
    email: EmailStr
    phone: str
    password: str
    role: UserRole = UserRole.Customer


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    user_name: str
    user_role: str
    email: str


class UserOut(BaseModel):
    user_id: str
    user_name: str
    email: str
    phone: str
    user_role: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    user_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
