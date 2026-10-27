import enum

from sqlalchemy import Enum, ForeignKey, String, Text, false, text, true
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(server_default=true())

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), index=True
    )
    slug: Mapped[str] = mapped_column(String(128), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    # Prices are whole KRW
    price: Mapped[int]
    sale_price: Mapped[int | None]
    note: Mapped[str | None] = mapped_column(Text)
    material: Mapped[str | None] = mapped_column(String(200))
    # [{"title": "[S Size]", "lines": ["Length 68cm / ..."]}, ...]
    size_guide: Mapped[list[dict]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    minimum_order: Mapped[int] = mapped_column(server_default=text("1"))
    sort_order: Mapped[int] = mapped_column(server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(server_default=true())
    # Skip the shop-wide header/footer detail images (site setting) for this product
    hide_common_detail: Mapped[bool] = mapped_column(server_default=false())

    category: Mapped[Category] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductVariant.sort_order",
    )


class ProductImageKind(str, enum.Enum):
    gallery = "gallery"  # thumbnails / main slider
    detail = "detail"  # long images in the detail section


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    url: Mapped[str] = mapped_column(String(500))
    kind: Mapped[ProductImageKind] = mapped_column(
        Enum(ProductImageKind, name="product_image_kind"),
        server_default=ProductImageKind.gallery.value,
    )
    # Display size; unknown for images uploaded before sizes were recorded
    width: Mapped[int | None]
    height: Mapped[int | None]
    # Very tall detail images are also stored cut into pieces (see app.uploads):
    # [{"url": ..., "width": ..., "height": ...}, ...]; empty when not sliced
    slices: Mapped[list[dict]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    sort_order: Mapped[int] = mapped_column(server_default=text("0"))

    product: Mapped[Product] = relationship(back_populates="images")


class ProductVariant(Base):
    """A purchasable option combination (size/color) with its own stock.

    Every product has at least one variant; products without options get a
    single variant with size and color left empty.
    """

    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    size: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str | None] = mapped_column(String(50))
    # Small picture shown next to the option in the shop's option list
    # (usually one of the product's gallery images, e.g. the color's photo)
    image_url: Mapped[str | None] = mapped_column(String(500))
    extra_price: Mapped[int] = mapped_column(server_default=text("0"))
    stock: Mapped[int] = mapped_column(server_default=text("0"))
    sort_order: Mapped[int] = mapped_column(server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(server_default=true())

    product: Mapped[Product] = relationship(back_populates="variants")
