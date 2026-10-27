from pydantic import BaseModel, ConfigDict

from app.models import ProductImageKind


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str


class ImageSliceOut(BaseModel):
    url: str
    width: int
    height: int


class DetailImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    width: int | None = None
    height: int | None = None
    # Present for very tall images; the shop shows these instead of `url`
    slices: list[ImageSliceOut] = []


class ProductImageOut(DetailImageOut):
    kind: ProductImageKind


class DetailCommonOut(BaseModel):
    """Shop-wide images shown above / below every product's detail images."""

    header: list[DetailImageOut] = []
    footer: list[DetailImageOut] = []


class ProductVariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    size: str | None
    color: str | None
    image_url: str | None
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
    detail_header: list[DetailImageOut] = []
    detail_footer: list[DetailImageOut] = []
