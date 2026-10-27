from pydantic import BaseModel, ConfigDict

from app.models import ProductImageKind


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    kind: ProductImageKind


class ProductVariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    size: str | None
    color: str | None
    extra_price: int
    stock: int


class SizeGuideOut(BaseModel):
    title: str
    lines: list[str]


class ProductSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    price: int
    sale_price: int | None
    category: CategoryOut
    images: list[ProductImageOut]


class HomeSectionOut(BaseModel):
    category: CategoryOut
    products: list[ProductSummaryOut]
    total: int


class ProductDetailOut(ProductSummaryOut):
    note: str | None
    material: str | None
    size_guide: list[SizeGuideOut]
    minimum_order: int
    variants: list[ProductVariantOut]
