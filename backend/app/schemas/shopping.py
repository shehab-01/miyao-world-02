from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.models import OrderStatus
from app.schemas.auth import Email, Mobile, Name

Quantity = Annotated[int, Field(ge=1, le=999)]
Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)]


class LineIn(BaseModel):
    variant_id: int
    quantity: Quantity


class CartAddIn(BaseModel):
    items: Annotated[list[LineIn], Field(min_length=1, max_length=50)]


class CartQuantityIn(BaseModel):
    quantity: Quantity


class LineOut(BaseModel):
    """One option of a product with its current price and stock."""

    # Cart row id; null on a checkout quote that didn't come from the cart
    id: int | None = None
    variant_id: int
    quantity: int
    product_slug: str
    product_name: str
    option_label: str | None
    image_url: str | None
    unit_price: int
    stock: int
    minimum_order: int
    # Why the line can't be ordered right now (sold out, not on sale…); null if it can
    problem: str | None = None


class BasketOut(BaseModel):
    items: list[LineOut]
    items_total: int
    shipping_fee: int
    total: int


class QuoteIn(BaseModel):
    items: Annotated[list[LineIn], Field(min_length=1, max_length=50)]


class OrderCreateIn(QuoteIn):
    # Ordered from the cart: those cart rows are removed once the order is placed
    from_cart: bool = False

    orderer_name: Name
    orderer_email: Email
    orderer_mobile: Mobile

    recipient_name: Name
    recipient_mobile: Mobile
    postal_code: Annotated[str, StringConstraints(pattern=r"^\d{5}$")]
    address1: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    address2: Text | None = None
    delivery_message: Text | None = None

    depositor_name: Name
    # 전자상거래법: the buyer confirms the order details and agrees before paying
    agree_purchase: Literal[True]


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_slug: str | None = None
    image_url: str | None = None
    product_name: str
    option_label: str | None
    unit_price: int
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_number: str
    status: OrderStatus
    created_at: datetime
    orderer_name: str
    orderer_email: str
    orderer_mobile: str
    recipient_name: str
    recipient_mobile: str
    postal_code: str
    address1: str
    address2: str | None
    delivery_message: str | None
    depositor_name: str | None
    paid_at: datetime | None
    tracking_number: str | None
    items_total: int
    shipping_fee: int
    total: int
    items: list[OrderItemOut]
