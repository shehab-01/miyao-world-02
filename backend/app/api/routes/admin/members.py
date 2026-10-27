from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.schemas.admin import MemberOut, MemberUpdateIn, Page

router = APIRouter(prefix="/members", tags=["Admin"])

PAGE_SIZE = 20


@router.get("", response_model=Page[MemberOut])
async def list_members(q: str | None = None, page: int = 1, db: AsyncSession = Depends(get_db)):
    query = select(User)
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                User.name.ilike(like),
                User.email.ilike(like),
                User.login_id.ilike(like),
                User.mobile.ilike(like),
            )
        )
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    members = await db.scalars(
        query.order_by(User.id.desc()).offset((max(page, 1) - 1) * PAGE_SIZE).limit(PAGE_SIZE)
    )
    return Page(total=total, items=members.all())


@router.patch("/{member_id}", response_model=MemberOut)
async def update_member(member_id: int, body: MemberUpdateIn, db: AsyncSession = Depends(get_db)):
    member = await db.get(User, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    # Suspended members can't log in and their existing session stops working
    member.is_active = body.is_active
    await db.commit()
    return member
