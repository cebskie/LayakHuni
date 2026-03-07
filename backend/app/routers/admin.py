from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
import uuid

from app.core.deps import get_db, get_current_user
from app.models.pengguna import Pengguna, UserRoleEnum
from app.models.developer import Developer, VerifStatusEnum
from app.models.customer import Customer

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: Pengguna = Depends(get_current_user)):
    if current_user.user_role != UserRoleEnum.Admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/users", response_model=list)
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(require_admin),
):
    result = await db.execute(
        select(Pengguna)
        .options(
            selectinload(Pengguna.developer),
            selectinload(Pengguna.customer),
        )
        .order_by(Pengguna.user_role)
    )
    users = result.scalars().all()

    output = []
    for u in users:
        dev = u.developer
        output.append({
            "user_id": str(u.user_id),
            "user_name": u.user_name,
            "email": u.email,
            "phone": u.phone,
            "user_role": u.user_role.value,
            "dev_id": str(dev.dev_id) if dev else None,
            "dev_code": dev.dev_code if dev else None,
            "verif_status": dev.verif_status.value if dev else None,
            "verified_at": dev.verified_at.isoformat() if dev and dev.verified_at else None,
        })
    return output


@router.patch("/developers/{dev_id}/verify", response_model=dict)
async def verify_developer(
    dev_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(require_admin),
):
    try:
        did = uuid.UUID(dev_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid developer ID")

    result = await db.execute(select(Developer).where(Developer.dev_id == did))
    dev = result.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    dev.verif_status = VerifStatusEnum.Verified
    from datetime import datetime
    dev.verified_at = datetime.utcnow()
    await db.commit()

    return {"message": "Developer verified successfully", "dev_id": dev_id}


@router.patch("/developers/{dev_id}/unverify", response_model=dict)
async def unverify_developer(
    dev_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Pengguna = Depends(require_admin),
):
    try:
        did = uuid.UUID(dev_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid developer ID")

    result = await db.execute(select(Developer).where(Developer.dev_id == did))
    dev = result.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    dev.verif_status = VerifStatusEnum.Not_Verified
    await db.commit()

    return {"message": "Developer unverified", "dev_id": dev_id}
