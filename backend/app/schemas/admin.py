from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

from app.models import OrderStatus, ProductImageKind, SocialProvider
from app.schemas.catalog import SizeGuideOut

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Slug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", max_length=128)]
# Admins pick their own password; 8+ characters, no composition rules
AdminPassword = Annotated[str, StringConstraints(min_length=8, max_length=128)]
Money = Annotated[int, Field(ge=0)]


class Page[T](BaseModel):
    items: list[T]
    total: int


# --- auth / admin accounts ---------------------------------------------------


class AdminLoginIn(BaseModel):
    email: str
    password: str


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime


class AdminCreateIn(BaseModel):
    email: EmailStr
    name: Annotated[Text, StringConstraints(max_length=50)]
    password: AdminPassword

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class AdminUpdateIn(BaseModel):
    is_active: bool


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: AdminPassword


# --- dashboard ---------------------------------------------------------------


class DashboardOut(BaseModel):
    members_total: int
    members_today: int
    products_active: int
    products_out_of_stock: int
    orders_today: int
    sales_today: int
    orders_pending_payment: int
    orders_preparing: int


# --- catalog -----------------------------------------------------------------


class CategoryAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    sort_order: int
    is_active: bool
    product_count: int = 0


class CategoryIn(BaseModel):
    slug: Slug
    name: Annotated[Text, StringConstraints(max_length=100)]
    sort_order: int = 0
    is_active: bool = True


class ProductImageIn(BaseModel):
    url: Annotated[str, StringConstraints(max_length=500)]
    kind: ProductImageKind = ProductImageKind.gallery


class ProductImageAdminOut(ProductImageIn):
    model_config = ConfigDict(from_attributes=True)


class VariantIn(BaseModel):
    # Present for existing variants so carts and past orders keep pointing at them
    id: int | None = None
    size: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    color: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = None
    extra_price: int = 0
    stock: Annotated[int, Field(ge=0)] = 0
    is_active: bool = True

    @field_validator("size", "color")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        return value or None


class VariantAdminOut(VariantIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ProductIn(BaseModel):
    category_id: int
    slug: Slug
    name: Annotated[Text, StringConstraints(max_length=200)]
    price: Money
    sale_price: Money | None = None
    note: str | None = None
    material: Annotated[str, StringConstraints(max_length=200)] | None = None
    size_guide: list[SizeGuideOut] = []
    minimum_order: Annotated[int, Field(ge=1)] = 1
    sort_order: int = 0
    is_active: bool = True
    images: list[ProductImageIn] = []
    variants: Annotated[list[VariantIn], Field(min_length=1)]


class ProductRowOut(BaseModel):
    id: int
    slug: str
    name: str
    category_name: str
    price: int
    sale_price: int | None
    stock: int
    is_active: bool
    image: str | None
    created_at: datetime


class ProductAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    slug: str
    name: str
    price: int
    sale_price: int | None
    note: str | None
    material: str | None
    size_guide: list[SizeGuideOut]
    minimum_order: int
    sort_order: int
    is_active: bool
    images: list[ProductImageAdminOut]
    variants: list[VariantAdminOut]


class UploadOut(BaseModel):
    url: str


# --- orders ------------------------------------------------------------------


class OrderRowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    status: OrderStatus
    orderer_name: str
    depositor_name: str | None
    total: int
    item_count: int = 0
    is_member: bool = False
    created_at: datetime


class OrderItemAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int | None
    product_name: str
    option_label: str | None
    unit_price: int
    quantity: int


class OrderAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: int | None
    status: OrderStatus
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
    created_at: datetime
    items: list[OrderItemAdminOut]


class OrderUpdateIn(BaseModel):
    status: OrderStatus | None = None
    tracking_number: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = None


# --- members -----------------------------------------------------------------


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login_id: str | None
    name: str
    email: str
    mobile: str | None
    providers: list[SocialProvider]
    is_active: bool
    agree_sms: bool
    agree_email: bool
    mileage: int
    last_login_at: datetime | None
    created_at: datetime


class MemberUpdateIn(BaseModel):
    is_active: bool
