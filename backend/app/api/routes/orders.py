"""Checkout (무통장입금) and the member's own orders."""

import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.routes.shopping import basket_out, line_out
from app.config import get_settings
from app.db import get_db
from app.mailer import send_mail
from app.models import CartItem, Order, OrderItem, OrderStatus, Product, ProductImageKind, User
from app.orders import (
    check_quantity,
    lock_variants,
    option_label,
    order_number,
    release_stock,
    shipping_fee,
    unit_price,
    variant_query,
)
from app.schemas.shopping import BasketOut, LineIn, OrderCreateIn, OrderItemOut, OrderOut, QuoteIn

settings = get_settings()

router = APIRouter(prefix="/orders", tags=["Orders"])

STATUS_NAMES = {
    OrderStatus.pending_payment: "입금전",
    OrderStatus.preparing: "배송준비중",
    OrderStatus.shipping: "배송중",
    OrderStatus.delivered: "배송완료",
    OrderStatus.cancelled: "취소",
    OrderStatus.exchanged: "교환",
    OrderStatus.returned: "반품",
}


def _merge(lines: list[LineIn]) -> dict[int, int]:
    """The same option listed twice is one line with the quantities added up."""
    merged: dict[int, int] = {}
    for line in lines:
        merged[line.variant_id] = merged.get(line.variant_id, 0) + line.quantity
    return merged


def _order_out(order: Order) -> OrderOut:
    items = []
    for item in order.items:
        product = item.product
        gallery = product and next((i.url for i in product.images if i.kind == ProductImageKind.gallery), None)
        items.append(
            OrderItemOut.model_validate(item).model_copy(
                update={"product_slug": product.slug if product else None, "image_url": gallery}
            )
        )
    return OrderOut.model_validate(order).model_copy(update={"items": items})


def _orders_query(user: User):
    return (
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images))
        .execution_options(populate_existing=True)
    )


async def _load_order(db: AsyncSession, user: User, number: str, lock: bool = False) -> Order:
    query = _orders_query(user).where(Order.order_number == number)
    # Locked while changing status, so a double click can't release the stock twice
    order = await db.scalar(query.with_for_update(of=Order) if lock else query)
    if order is None:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    return order


def _confirmation_mail(order: Order) -> tuple[str, str]:
    lines = "\n".join(
        f"- {item.product_name}{f' ({item.option_label})' if item.option_label else ''} × {item.quantity}"
        f"  {item.unit_price * item.quantity:,}원"
        for item in order.items
    )
    body = (
        f"{order.orderer_name}님, 주문해 주셔서 감사합니다.\n\n"
        f"주문번호: {order.order_number}\n\n{lines}\n\n"
        f"상품금액 {order.items_total:,}원 + 배송비 {order.shipping_fee:,}원 = 결제금액 {order.total:,}원\n\n"
        "[무통장입금 안내]\n"
        f"입금계좌: {settings.bank_account}\n"
        f"입금액: {order.total:,}원\n"
        f"입금자명: {order.depositor_name}\n"
        "주문 후 3일 이내 미입금 시 주문이 자동 취소됩니다.\n\n"
        f"주문 상세: {settings.public_url}/mypage/orders/{order.order_number}"
    )
    return f"[MIYAO WORLD] 주문이 접수되었습니다 ({order.order_number})", body


@router.post("/quote", response_model=BasketOut)
async def quote(body: QuoteIn, _: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """What the checkout page shows: current prices, stock and shipping for the chosen items."""
    lines = _merge(body.items)
    variants = {v.id: v for v in await db.scalars(variant_query(lines))}
    if len(variants) != len(lines):
        raise HTTPException(status_code=404, detail="주문할 수 없는 상품이 있습니다. 장바구니를 확인해 주세요.")
    return basket_out([line_out(variants[vid], quantity) for vid, quantity in lines.items()])


@router.post("", response_model=OrderOut, status_code=201)
async def place_order(
    body: OrderCreateIn,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lines = _merge(body.items)
    variants = await lock_variants(db, lines)
    if len(variants) != len(lines):
        raise HTTPException(status_code=409, detail="주문할 수 없는 상품이 있습니다. 장바구니를 확인해 주세요.")

    items = []
    for variant_id, quantity in lines.items():
        variant = variants[variant_id]
        check_quantity(variant, quantity)
        variant.stock -= quantity
        items.append(
            OrderItem(
                product_id=variant.product_id,
                variant_id=variant.id,
                product_name=variant.product.name,
                option_label=option_label(variant),
                unit_price=unit_price(variant),
                quantity=quantity,
            )
        )
    items_total = sum(item.unit_price * item.quantity for item in items)
    fee = shipping_fee(items_total)

    order = Order(
        # Placeholder until the id is known; replaced before the commit
        order_number=secrets.token_hex(8),
        user_id=user.id,
        **body.model_dump(include={
            "orderer_name", "orderer_email", "orderer_mobile", "recipient_name", "recipient_mobile",
            "postal_code", "address1", "address2", "delivery_message", "depositor_name",
        }),
        items_total=items_total,
        shipping_fee=fee,
        total=items_total + fee,
        items=items,
    )
    db.add(order)
    await db.flush()
    order.order_number = order_number(order.id, datetime.now(UTC))

    if body.from_cart:
        await db.execute(delete(CartItem).where(CartItem.user_id == user.id, CartItem.variant_id.in_(lines)))
    await db.commit()

    order = await _load_order(db, user, order.order_number)
    background.add_task(send_mail, order.orderer_email, *_confirmation_mail(order))
    return _order_out(order)


@router.get("", response_model=list[OrderOut])
async def my_orders(limit: int = 50, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    orders = await db.scalars(_orders_query(user).order_by(Order.id.desc()).limit(min(max(limit, 1), 200)))
    return [_order_out(order) for order in orders]


@router.get("/status-counts", response_model=dict[OrderStatus, int])
async def status_counts(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """For the 주문처리 현황 board on 마이페이지."""
    rows = await db.execute(
        select(Order.status, func.count()).where(Order.user_id == user.id).group_by(Order.status)
    )
    return {status: 0 for status in OrderStatus} | dict(rows.tuples().all())


@router.get("/{number}", response_model=OrderOut)
async def my_order(number: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return _order_out(await _load_order(db, user, number))


@router.post("/{number}/cancel", response_model=OrderOut)
async def cancel_order(number: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Members can cancel on their own until the transfer is confirmed."""
    order = await _load_order(db, user, number, lock=True)
    if order.status == OrderStatus.cancelled:
        raise HTTPException(status_code=409, detail="이미 취소된 주문입니다.")
    if order.status != OrderStatus.pending_payment:
        raise HTTPException(
            status_code=409,
            detail=f"{STATUS_NAMES[order.status]} 상태의 주문은 직접 취소할 수 없습니다. 고객센터로 문의해 주세요.",
        )
    await release_stock(db, order)
    order.status = OrderStatus.cancelled
    await db.commit()
    return _order_out(await _load_order(db, user, number))
