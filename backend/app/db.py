from collections.abc import AsyncIterator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import get_settings

settings = get_settings()

# NullPool is required for Neon (serverless Postgres).
# Neon closes idle connections aggressively, which causes
# "SSL connection closed unexpectedly" errors when SQLAlchemy's
# internal pool hands out a stale connection. NullPool opens a
# fresh connection per request and lets Neon's own PgBouncer
# handle pooling on its side. Local Postgres uses the normal pool.
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
    **({"poolclass": NullPool} if settings.db_null_pool else {}),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    # Deterministic constraint names so Alembic migrations stay stable.
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


# Dependency for FastAPI routes
async def get_db() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
