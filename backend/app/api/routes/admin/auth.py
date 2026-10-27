from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db import get_db
from app.models import Admin
from app.schemas.admin import AdminLoginIn, AdminOut
from app.security import (
    ADMIN_COOKIE_PATH,
    ADMIN_SESSION_COOKIE,
    clear_cookie,
    start_admin_session,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Admin"])

MAX_FAILED_LOGINS = 5
LOCKOUT = timedelta(minutes=15)
INVALID = "이메일 또는 비밀번호가 일치하지 않습니다."


@router.post("/login", response_model=AdminOut)
async def admin_login(body: AdminLoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    now = datetime.now(UTC)
    admin = await db.scalar(select(Admin).where(Admin.email == body.email.strip().lower()))

    if admin and admin.locked_until and admin.locked_until > now:
        minutes = int((admin.locked_until - now).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"로그인 시도가 너무 많습니다. {minutes}분 후 다시 시도해 주세요.",
        )

    if not verify_password(body.password, admin.password_hash if admin else None):
        if admin:
            admin.failed_login_count += 1
            if admin.failed_login_count >= MAX_FAILED_LOGINS:
                admin.locked_until = now + LOCKOUT
                admin.failed_login_count = 0
            await db.commit()
        raise HTTPException(status_code=401, detail=INVALID)

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 관리자 계정입니다.")

    admin.failed_login_count = 0
    admin.locked_until = None
    admin.last_login_at = now
    await db.commit()
    start_admin_session(response, admin)
    return admin


@router.post("/logout", status_code=204)
async def admin_logout(response: Response):
    clear_cookie(response, ADMIN_SESSION_COOKIE, path=ADMIN_COOKIE_PATH)


@router.get("/me", response_model=AdminOut)
async def admin_me(admin: Admin = Depends(get_current_admin)):
    return admin
