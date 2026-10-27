"""Shop rules shared by the cart, checkout and admin order routes."""

from collections.abc import Iterable
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Order, OrderStatus, Product, ProductVariant

# 택배 2,500원, 50,000원 이상 구매 시 무료 (mirrors productShipping in the frontend site-config)
SHIPPING_FEE = 2500
FREE_SHIPPING_FROM = 50000

KST = timezone(timedelta(hours=9))

# Stock is held from ordering until the order is cancelled. Once it has shipped,
# a return goes through the warehouse, so stock is put back by hand in the admin.
STOCK_HELD = (OrderStatus.pending_payment, OrderStatus.preparing)


def shipping_fee(items_total: int) -> int:
    if items_total == 0 or items_total >= FREE_SHIPPING_FROM:
        return 0
    return SHIPPING_FEE


def order_number(order_id: int, created_at: datetime) -> str:
    """e.g. 20260918-0000123 (the Korean calendar date of the order)."""
    return f"{created_at.astimezone(KST):%Y%m%d}-{order_id:07d}"


def unit_price(variant: ProductVariant) -> int:
    product = variant.product
    return (product.sale_price if product.sale_price is not None else product.price) + variant.extra_price


def option_label(variant: ProductVariant) -> str | None:
    return " / ".join(part for part in (variant.size, variant.color) if part) or None


def purchasable(variant: ProductVariant) -> bool:
    product = variant.product
    return variant.is_active and product.is_active and product.category.is_active


def quantity_problem(variant: ProductVariant, quantity: int) -> str | None:
    """Why `quantity` of this option can't be bought right now, or None if it can."""
    if not purchasable(variant):
        return "판매하지 않는 상품입니다."
    if variant.stock <= 0:
        return "품절된 상품입니다."
    if quantity > variant.stock:
        return f"재고가 {variant.stock}개 남았습니다."
    if quantity < variant.product.minimum_order:
        return f"{variant.product.minimum_order}개 이상 주문할 수 있습니다."
    return None


def check_quantity(variant: ProductVariant, quantity: int) -> None:
    """Raise a customer-facing 409 unless `quantity` of this option can be bought."""
    problem = quantity_problem(variant, quantity)
    if problem:
        label = option_label(variant)
        name = variant.product.name + (f" ({label})" if label else "")
        raise HTTPException(status_code=409, detail=f"[{name}] {problem}")


def variant_query(variant_ids: Iterable[int]):
    return (
        select(ProductVariant)
        .where(ProductVariant.id.in_(list(variant_ids)))
        .options(
            selectinload(ProductVariant.product).selectinload(Product.category),
            selectinload(ProductVariant.product).selectinload(Product.images),
        )
    )


async def lock_variants(db: AsyncSession, variant_ids: Iterable[int]) -> dict[int, ProductVariant]:
    """Load variants with their rows locked, so two orders can't both take the last one.

    Locked in id order so concurrent checkouts never deadlock.
    """
    result = await db.scalars(
        variant_query(variant_ids)
        .order_by(ProductVariant.id)
        .with_for_update(of=ProductVariant)
        .execution_options(populate_existing=True)
    )
    return {variant.id: variant for variant in result}


async def release_stock(db: AsyncSession, order: Order) -> None:
    """Put a cancelled order's items back on sale."""
    variants = await lock_variants(db, [item.variant_id for item in order.items if item.variant_id])
    for item in order.items:
        if item.variant_id in variants:
            variants[item.variant_id].stock += item.quantity


async def hold_stock(db: AsyncSession, order: Order) -> None:
    """Take an order's items out of stock again (a cancelled order being reopened)."""
    variants = await lock_variants(db, [item.variant_id for item in order.items if item.variant_id])
    for item in order.items:
        variant = variants.get(item.variant_id)
        if variant is None or variant.stock < item.quantity:
            raise HTTPException(
                status_code=409, detail=f"{item.product_name} 재고가 부족해 주문을 되살릴 수 없습니다."
            )
        variant.stock -= item.quantity
