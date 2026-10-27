from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Category, Product, ProductImage, ProductImageKind, ProductVariant
from app.schemas.admin import (
    CategoryAdminOut,
    CategoryIn,
    Page,
    ProductAdminOut,
    ProductIn,
    ProductRowOut,
    UploadOut,
)
from app.uploads import MAX_UPLOAD_BYTES, image_extension, store_image

router = APIRouter(tags=["Admin"])

PAGE_SIZE = 20


# --- categories --------------------------------------------------------------


@router.get("/categories", response_model=list[CategoryAdminOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    counts = (
        select(Product.category_id, func.count().label("n"))
        .group_by(Product.category_id)
        .subquery()
    )
    rows = await db.execute(
        select(Category, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.category_id == Category.id)
        .order_by(Category.sort_order, Category.id)
    )
    return [
        CategoryAdminOut.model_validate(category).model_copy(update={"product_count": n})
        for category, n in rows
    ]


async def _save_category(db: AsyncSession, category: Category) -> Category:
    db.add(category)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 슬러그입니다.")
    return category


@router.post("/categories", response_model=CategoryAdminOut, status_code=201)
async def create_category(body: CategoryIn, db: AsyncSession = Depends(get_db)):
    return await _save_category(db, Category(**body.model_dump()))


@router.put("/categories/{category_id}", response_model=CategoryAdminOut)
async def update_category(category_id: int, body: CategoryIn, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    for field, value in body.model_dump().items():
        setattr(category, field, value)
    return await _save_category(db, category)


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    if await db.scalar(select(func.count()).where(Product.category_id == category_id)):
        raise HTTPException(
            status_code=400, detail="상품이 있는 카테고리는 삭제할 수 없습니다. 숨김 처리해 주세요."
        )
    await db.delete(category)
    await db.commit()


# --- products ----------------------------------------------------------------


@router.get("/products", response_model=Page[ProductRowOut])
async def list_products(
    q: str | None = None,
    category_id: int | None = None,
    page: int = 1,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product)
    if q:
        query = query.where(or_(Product.name.ilike(f"%{q}%"), Product.slug.ilike(f"%{q}%")))
    if category_id:
        query = query.where(Product.category_id == category_id)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    products = await db.scalars(
        query.options(
            selectinload(Product.category),
            selectinload(Product.images),
            selectinload(Product.variants),
        )
        .order_by(Product.id.desc())
        .offset((max(page, 1) - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    )
    return Page(
        total=total,
        items=[
            ProductRowOut(
                id=p.id,
                slug=p.slug,
                name=p.name,
                category_name=p.category.name,
                price=p.price,
                sale_price=p.sale_price,
                stock=sum(v.stock for v in p.variants if v.is_active),
                is_active=p.is_active,
                image=p.images[0].url if p.images else None,
                created_at=p.created_at,
            )
            for p in products
        ],
    )


async def _load_product(db: AsyncSession, product_id: int) -> Product:
    product = await db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.images), selectinload(Product.variants))
        .execution_options(populate_existing=True)
    )
    if product is None:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
    return product


@router.get("/products/{product_id}", response_model=ProductAdminOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    return await _load_product(db, product_id)


def _apply(product: Product, body: ProductIn) -> None:
    fields = body.model_dump(exclude={"images", "variants", "size_guide"})
    for field, value in fields.items():
        setattr(product, field, value)
    product.size_guide = [guide.model_dump() for guide in body.size_guide]
    product.images = [
        ProductImage(**image.model_dump(), sort_order=index)
        for index, image in enumerate(body.images)
    ]

    # Update variants in place by id so carts / past orders keep their references;
    # variants left out of the request are deleted.
    existing = {variant.id: variant for variant in product.variants}
    variants = []
    for index, data in enumerate(body.variants):
        variant = existing.get(data.id) if data.id else None
        if variant is None:
            variant = ProductVariant()
        for field, value in data.model_dump(exclude={"id"}).items():
            setattr(variant, field, value)
        variant.sort_order = index
        variants.append(variant)
    product.variants = variants


async def _save_product(db: AsyncSession, product: Product) -> Product:
    if await db.get(Category, product.category_id) is None:
        raise HTTPException(status_code=400, detail="카테고리를 선택해 주세요.")
    db.add(product)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 슬러그입니다.")
    return await _load_product(db, product.id)


@router.post("/products", response_model=ProductAdminOut, status_code=201)
async def create_product(body: ProductIn, db: AsyncSession = Depends(get_db)):
    product = Product(images=[], variants=[])
    _apply(product, body)
    return await _save_product(db, product)


@router.put("/products/{product_id}", response_model=ProductAdminOut)
async def update_product(product_id: int, body: ProductIn, db: AsyncSession = Depends(get_db)):
    product = await _load_product(db, product_id)
    _apply(product, body)
    return await _save_product(db, product)


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await _load_product(db, product_id)
    # Past orders keep their own copy of name/price, so deleting is safe for them
    await db.delete(product)
    await db.commit()


# --- image upload ------------------------------------------------------------


@router.post("/uploads", response_model=UploadOut, status_code=201)
async def upload_image(
    file: UploadFile,
    kind: Annotated[ProductImageKind, Form()] = ProductImageKind.gallery,
):
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="이미지는 30MB 이하만 업로드할 수 있습니다.")
    extension = image_extension(data)
    if extension is None:
        raise HTTPException(status_code=400, detail="JPG, PNG, GIF, WEBP 이미지만 업로드할 수 있습니다.")
    try:
        # Decoding / slicing a long image takes a moment; keep it off the event loop
        return await run_in_threadpool(
            store_image, data, extension, sliceable=kind == ProductImageKind.detail
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다. 다른 파일로 시도해 주세요.")
