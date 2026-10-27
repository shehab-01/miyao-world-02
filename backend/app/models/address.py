from sqlalchemy import ForeignKey, Index, String, false, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.base import TimestampMixin


class Address(TimestampMixin, Base):
    """배송 주소록: a member's saved delivery addresses. Exactly one is the default once any exist."""

    __tablename__ = "addresses"
    __table_args__ = (
        # At most one default per member
        Index("uq_addresses_default", "user_id", unique=True, postgresql_where=text("is_default")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # 배송지명, e.g. 우리집 / 회사
    label: Mapped[str] = mapped_column(String(20))
    recipient_name: Mapped[str] = mapped_column(String(50))
    recipient_mobile: Mapped[str] = mapped_column(String(20))
    postal_code: Mapped[str] = mapped_column(String(5))
    address1: Mapped[str] = mapped_column(String(255))
    address2: Mapped[str | None] = mapped_column(String(255))
    is_default: Mapped[bool] = mapped_column(server_default=false())
