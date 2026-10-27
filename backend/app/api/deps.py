from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Admin, User
from app.security import ADMIN_SESSION_COOKIE, SESSION_COOKIE, decode_token, password_fingerprint


async def get_optional_user(
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    payload = decode_token(session, SESSION_COOKIE)
    if payload is None:
        return None
    user = await db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        return None
    # Signed in before the password was changed (e.g. reset after a stolen password)
    if payload.get("pv") != password_fingerprint(user.password_hash):
        return None
    return user


async def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return user


async def get_current_admin(
    admin_session: Annotated[str | None, Cookie(alias=ADMIN_SESSION_COOKIE)] = None,
    db: AsyncSession = Depends(get_db),
) -> Admin:
    payload = decode_token(admin_session, ADMIN_SESSION_COOKIE)
    admin = await db.get(Admin, int(payload["sub"])) if payload else None
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=401, detail="관리자 로그인이 필요합니다.")
    return admin
