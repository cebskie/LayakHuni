from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime

from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_db, get_current_user
from app.models.pengguna import Pengguna, UserRoleEnum
from app.models.customer import Customer
from app.models.developer import Developer, VerifStatusEnum
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut, UpdateProfileRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check email exists
    result = await db.execute(select(Pengguna).where(Pengguna.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = Pengguna(
        user_id=uuid.uuid4(),
        user_role=UserRoleEnum(body.role.value),
        user_name=body.user_name,
        user_password=get_password_hash(body.password),
        email=body.email,
        phone=body.phone,
    )
    db.add(user)
    await db.flush()

    if body.role.value == "Customer":
        count_result = await db.execute(select(Customer))
        count = len(count_result.scalars().all())
        customer = Customer(
            cust_id=uuid.uuid4(),
            cust_code=f"C{str(count + 1).zfill(3)}",
            user_id=user.user_id,
        )
        db.add(customer)
    elif body.role.value == "Developer":
        count_result = await db.execute(select(Developer))
        count = len(count_result.scalars().all())
        developer = Developer(
            dev_id=uuid.uuid4(),
            dev_code=f"D{str(count + 1).zfill(3)}",
            user_id=user.user_id,
            verified_at=datetime.utcnow(),
            verif_status=VerifStatusEnum.Not_Verified,
        )
        db.add(developer)

    await db.commit()

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token,
        user_id=str(user.user_id),
        user_name=user.user_name,
        user_role=user.user_role.value,
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pengguna).where(Pengguna.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.user_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token,
        user_id=str(user.user_id),
        user_name=user.user_name,
        user_role=user.user_role.value,
        email=user.email,
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: Pengguna = Depends(get_current_user)):
    return UserOut(
        user_id=str(current_user.user_id),
        user_name=current_user.user_name,
        email=current_user.email,
        phone=current_user.phone,
        user_role=current_user.user_role.value,
    )


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UpdateProfileRequest,
    current_user: Pengguna = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.user_name:
        current_user.user_name = body.user_name
    if body.phone:
        current_user.phone = body.phone
    if body.password:
        current_user.user_password = get_password_hash(body.password)

    await db.commit()
    await db.refresh(current_user)

    return UserOut(
        user_id=str(current_user.user_id),
        user_name=current_user.user_name,
        email=current_user.email,
        phone=current_user.phone,
        user_role=current_user.user_role.value,
    )
