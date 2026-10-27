import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.catalog import Product


class OrderStatus(str, enum.Enum):
    pending_payment = "pending_payment"  # 입금전
    preparing = "preparing"  # 배송준비중
    shipping = "shipping"  # 배송중
    delivered = "delivered"  # 배송완료
    cancelled = "cancelled"  # 취소
    exchanged = "exchanged"  # 교환
    returned = "returned"  # 반품


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    # e.g. 20260918-0000123
    order_number: Mapped[str] = mapped_column(String(20), unique=True)
    # Null for guest orders (or when the member account is deleted)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    # Lets guests look up their order without an account
    guest_password_hash: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"),
        server_default=OrderStatus.pending_payment.value,
        index=True,
    )

    orderer_name: Mapped[str] = mapped_column(String(50))
    orderer_email: Mapped[str] = mapped_column(String(255))
    orderer_mobile: Mapped[str] = mapped_column(String(20))

    recipient_name: Mapped[str] = mapped_column(String(50))
    recipient_mobile: Mapped[str] = mapped_column(String(20))
    postal_code: Mapped[str] = mapped_column(String(10))
    address1: Mapped[str] = mapped_column(String(255))
    address2: Mapped[str | None] = mapped_column(String(255))
    delivery_message: Mapped[str | None] = mapped_column(String(255))

    # Bank transfer (무통장입금)
    depositor_name: Mapped[str | None] = mapped_column(String(50))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tracking_number: Mapped[str | None] = mapped_column(String(50))

    items_total: Mapped[int]
    shipping_fee: Mapped[int] = mapped_column(server_default=text("0"))
    total: Mapped[int]

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Snapshot of what was bought — product rows can change or be deleted later."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL")
    )
    product_name: Mapped[str] = mapped_column(String(200))
    option_label: Mapped[str | None] = mapped_column(String(200))
    unit_price: Mapped[int]
    quantity: Mapped[int]

    order: Mapped[Order] = relationship(back_populates="items")
    # For the picture and link in order history; None once the product is deleted
    product: Mapped["Product | None"] = relationship()
