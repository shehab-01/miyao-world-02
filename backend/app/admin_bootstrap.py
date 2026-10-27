"""Create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, and a CLI for lockouts.

Runs automatically on backend startup. Never overwrites an existing admin, so a
password changed in /admin/admins isn't reset by a restart.

Reset or create an admin by hand:
    docker compose exec backend python -m app.admin_bootstrap <email> <password> [name]
"""

import asyncio
import logging
import sys

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import AsyncSessionLocal
from app.models import Admin
from app.security import hash_password

logger = logging.getLogger(__name__)


async def ensure_initial_admin() -> None:
    settings = get_settings()
    email = settings.admin_email.strip().lower()
    if not email or not settings.admin_password:
        return

    async with AsyncSessionLocal() as db:
        if await db.scalar(select(Admin.id).where(Admin.email == email)):
            return
        db.add(Admin(email=email, name="관리자", password_hash=hash_password(settings.admin_password)))
        try:
            await db.commit()
            logger.warning("Created initial admin %s", email)
        except IntegrityError:
            # Another worker created it at the same moment
            await db.rollback()


async def set_admin_password(email: str, password: str, name: str) -> None:
    async with AsyncSessionLocal() as db:
        admin = await db.scalar(select(Admin).where(Admin.email == email.lower()))
        if admin is None:
            db.add(Admin(email=email.lower(), name=name, password_hash=hash_password(password)))
            print(f"Created admin {email}")
        else:
            admin.password_hash = hash_password(password)
            admin.is_active = True
            admin.failed_login_count = 0
            admin.locked_until = None
            print(f"Reset password for {email} (and unlocked it)")
        await db.commit()


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        sys.exit("usage: python -m app.admin_bootstrap <email> <password> [name]")
    asyncio.run(set_admin_password(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) == 4 else "관리자"))
