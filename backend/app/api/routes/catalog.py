from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Category, Product, ProductVariant
from app.schemas.catalog import (
    CategoryOut,
    DetailCommonOut,
    HomeSectionOut,
    ProductDetailOut,
    ProductSummaryOut,
)
from app.site_settings import DETAIL_COMMON_IMAGES, get_setting

router = APIRouter(tags=["Catalog"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(Category).where(Category.is_active).order_by(Category.sort_order, Category.id)
    )
    return result.all()


@router.get("/products", response_model=list[ProductSummaryOut])
async def list_products(category: str | None = None, db: AsyncSession = Depends(get_db)):
    query = (
        select(Product)
        .join(Product.category)
        .where(Product.is_active, Category.is_active)
        .options(selectinload(Product.category), selectinload(Product.images))
        .order_by(Product.sort_order, Product.id)
    )
    if category:
        query = query.where(Category.slug == category)
    result = await db.scalars(query)
    return result.all()


@router.get("/home", response_model=list[HomeSectionOut])
async def home_sections(per_category: int = 2, db: AsyncSession = Depends(get_db)):
    """Landing page: each visible category with its first few products."""
    categories = await db.scalars(
        select(Category).where(Category.is_active).order_by(Category.sort_order, Category.id)
    )
    sections = []
    for category in categories:
        visible = select(Product).where(Product.category_id == category.id, Product.is_active)
        total = await db.scalar(select(func.count()).select_from(visible.subquery()))
        if not total:
            continue
        products = await db.scalars(
            visible.options(selectinload(Product.category), selectinload(Product.images))
            .order_by(Product.sort_order, Product.id)
            .limit(min(per_category, 8))
        )
        sections.append(HomeSectionOut(category=category, products=products.all(), total=total))
    return sections


@router.get("/products/{slug}", response_model=ProductDetailOut)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    product = await db.scalar(
        select(Product)
        .join(Product.category)
        .where(Product.slug == slug, Product.is_active, Category.is_active)
        .options(
            selectinload(Product.category),
            selectinload(Product.images),
            # Options switched off in the admin aren't offered to customers
            selectinload(Product.variants.and_(ProductVariant.is_active)),
        )
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    detail = ProductDetailOut.model_validate(product)
    if product.hide_common_detail:
        return detail
    common = DetailCommonOut.model_validate(await get_setting(db, DETAIL_COMMON_IMAGES))
    return detail.model_copy(update={"detail_header": common.header, "detail_footer": common.footer})
