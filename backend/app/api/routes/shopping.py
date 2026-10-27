"""Member cart and wishlist (관심상품)."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db import get_db
from app.models import CartItem, Category, Product, ProductImageKind, ProductVariant, User, WishlistItem
from app.orders import check_quantity, option_label, quantity_problem, shipping_fee, unit_price, variant_query
from app.schemas.catalog import ProductSummaryOut
from app.schemas.shopping import BasketOut, CartAddIn, CartQuantityIn, LineOut

router = APIRouter(tags=["Shopping"])


def line_out(variant: ProductVariant, quantity: int, cart_item_id: int | None = None) -> LineOut:
    product = variant.product
    gallery = next((image.url for image in product.images if image.kind == ProductImageKind.gallery), None)
    return LineOut(
        id=cart_item_id,
        variant_id=variant.id,
        quantity=quantity,
        product_slug=product.slug,
        product_name=product.name,
        option_label=option_label(variant),
        # The option's own picture shows the right color
        image_url=variant.image_url or gallery,
        unit_price=unit_price(variant),
        stock=variant.stock,
        minimum_order=product.minimum_order,
        problem=quantity_problem(variant, quantity),
    )


def basket_out(lines: list[LineOut]) -> BasketOut:
    # Lines that can't be ordered right now don't count towards the total
    items_total = sum(line.unit_price * line.quantity for line in lines if line.problem is None)
    fee = shipping_fee(items_total)
    return BasketOut(items=lines, items_total=items_total, shipping_fee=fee, total=items_total + fee)


async def _cart(db: AsyncSession, user: User) -> BasketOut:
    rows = await db.scalars(
        select(CartItem)
        .where(CartItem.user_id == user.id)
        .options(
            selectinload(CartItem.variant)
            .selectinload(ProductVariant.product)
            .options(selectinload(Product.category), selectinload(Product.images))
        )
        .order_by(CartItem.id)
        .execution_options(populate_existing=True)
    )
    return basket_out([line_out(row.variant, row.quantity, row.id) for row in rows])


# --- cart ----------------------------------------------------------------------


@router.get("/cart", response_model=BasketOut)
async def get_cart(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _cart(db, user)


@router.post("/cart", response_model=BasketOut)
async def add_to_cart(body: CartAddIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    variants = {v.id: v for v in await db.scalars(variant_query(line.variant_id for line in body.items))}
    existing = {
        row.variant_id: row
        for row in await db.scalars(select(CartItem).where(CartItem.user_id == user.id))
    }
    for line in body.items:
        variant = variants.get(line.variant_id)
        if variant is None:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        # Adding an option that's already in the cart adds to its quantity
        row = existing.get(variant.id)
        quantity = line.quantity + (row.quantity if row else 0)
        check_quantity(variant, quantity)
        if row:
            row.quantity = quantity
        else:
            existing[variant.id] = CartItem(user_id=user.id, variant_id=variant.id, quantity=quantity)
            db.add(existing[variant.id])
    await db.commit()
    return await _cart(db, user)


@router.patch("/cart/{item_id}", response_model=BasketOut)
async def change_quantity(
    item_id: int,
    body: CartQuantityIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(CartItem, item_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="장바구니에 없는 상품입니다.")
    variant = await db.scalar(variant_query([row.variant_id]))
    check_quantity(variant, body.quantity)
    row.quantity = body.quantity
    await db.commit()
    return await _cart(db, user)


@router.delete("/cart", response_model=BasketOut)
async def remove_from_cart(
    ids: list[int] | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove the given cart rows, or empty the cart when no ids are given."""
    query = delete(CartItem).where(CartItem.user_id == user.id)
    if ids is not None:
        query = query.where(CartItem.id.in_(ids))
    await db.execute(query)
    await db.commit()
    return await _cart(db, user)


# --- wishlist --------------------------------------------------------------------


async def _product_id(db: AsyncSession, slug: str) -> int:
    product_id = await db.scalar(
        select(Product.id).join(Product.category).where(Product.slug == slug, Product.is_active, Category.is_active)
    )
    if product_id is None:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
    return product_id


@router.get("/wishlist", response_model=list[ProductSummaryOut])
async def get_wishlist(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    products = await db.scalars(
        select(Product)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .join(Product.category)
        .where(WishlistItem.user_id == user.id, Product.is_active, Category.is_active)
        .options(selectinload(Product.category), selectinload(Product.images))
        .order_by(WishlistItem.id.desc())
    )
    return products.all()


@router.put("/wishlist/{slug}", status_code=204)
async def add_to_wishlist(slug: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    product_id = await _product_id(db, slug)
    exists = await db.scalar(
        select(WishlistItem.id).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)
    )
    if not exists:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
        await db.commit()
    return Response(status_code=204)


@router.delete("/wishlist/{slug}", status_code=204)
async def remove_from_wishlist(slug: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        delete(WishlistItem).where(
            WishlistItem.user_id == user.id,
            WishlistItem.product_id.in_(select(Product.id).where(Product.slug == slug)),
        )
    )
    await db.commit()
    return Response(status_code=204)
