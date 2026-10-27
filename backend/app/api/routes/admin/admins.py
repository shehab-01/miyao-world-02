from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db import get_db
from app.models import Admin
from app.schemas.admin import AdminCreateIn, AdminOut, AdminUpdateIn, PasswordChangeIn
from app.security import hash_password, verify_password

router = APIRouter(prefix="/admins", tags=["Admin"])


@router.get("", response_model=list[AdminOut])
async def list_admins(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Admin).order_by(Admin.id))).all()


@router.post("", response_model=AdminOut, status_code=201)
async def create_admin(body: AdminCreateIn, db: AsyncSession = Depends(get_db)):
    admin = Admin(email=body.email, name=body.name, password_hash=hash_password(body.password))
    db.add(admin)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")
    return admin


@router.post("/me/password", status_code=204)
async def change_my_password(
    body: PasswordChangeIn,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
    admin.password_hash = hash_password(body.new_password)
    await db.commit()


@router.patch("/{admin_id}", response_model=AdminOut)
async def update_admin(
    admin_id: int,
    body: AdminUpdateIn,
    me: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if admin_id == me.id:
        raise HTTPException(status_code=400, detail="본인 계정은 비활성화할 수 없습니다.")
    admin = await db.get(Admin, admin_id)
    if admin is None:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다.")
    admin.is_active = body.is_active
    await db.commit()
    return admin
