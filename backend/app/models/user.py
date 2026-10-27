import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, false, text, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin


class SocialProvider(str, enum.Enum):
    kakao = "kakao"
    naver = "naver"


class User(TimestampMixin, Base):
    __tablename__ = "users"
    # Load server defaults (mileage, is_active…) via RETURNING so async code never lazy-loads them
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    # 아이디 — lowercase letters/digits, 4~16 chars. Null for social-only members.
    login_id: Mapped[str | None] = mapped_column(String(16), unique=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    # Null for social-only members
    password_hash: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(50))
    mobile: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(server_default=true())
    agree_sms: Mapped[bool] = mapped_column(server_default=false())
    agree_email: Mapped[bool] = mapped_column(server_default=false())
    mileage: Mapped[int] = mapped_column(server_default=text("0"))
    # Brute-force protection: locked for a while after repeated wrong passwords
    failed_login_count: Mapped[int] = mapped_column(server_default=text("0"))
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # When the required terms were accepted — kept as consent evidence (개인정보보호법)
    terms_agreed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    privacy_agreed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    social_accounts: Mapped[list["SocialAccount"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def providers(self) -> list[SocialProvider]:
        return [account.provider for account in self.social_accounts]


class SocialAccount(TimestampMixin, Base):
    __tablename__ = "social_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[SocialProvider] = mapped_column(Enum(SocialProvider, name="social_provider"))
    # Kakao 회원번호 / Naver 식별자 — stable per app, never reused
    provider_user_id: Mapped[str] = mapped_column(String(64))
    # Email the provider reported at sign-up, for support lookups
    email: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(back_populates="social_accounts")
