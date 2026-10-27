from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Order, OrderStatus
from app.orders import STOCK_HELD, hold_stock, release_stock
from app.schemas.admin import OrderAdminOut, OrderRowOut, OrderUpdateIn, Page

router = APIRouter(prefix="/orders", tags=["Admin"])

PAGE_SIZE = 20


@router.get("", response_model=Page[OrderRowOut])
async def list_orders(
    status: OrderStatus | None = None,
    q: str | None = None,
    page: int = 1,
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)
    if status:
        query = query.where(Order.status == status)
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                Order.order_number.ilike(like),
                Order.orderer_name.ilike(like),
                Order.depositor_name.ilike(like),
                Order.orderer_mobile.ilike(like),
            )
        )

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    orders = await db.scalars(
        query.options(selectinload(Order.items))
        .order_by(Order.id.desc())
        .offset((max(page, 1) - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    )
    return Page(
        total=total,
        items=[
            OrderRowOut.model_validate(order).model_copy(
                update={
                    "item_count": sum(item.quantity for item in order.items),
                    "is_member": order.user_id is not None,
                }
            )
            for order in orders
        ],
    )


async def _load_order(db: AsyncSession, order_id: int, lock: bool = False) -> Order:
    query = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
        .execution_options(populate_existing=True)
    )
    # Locked while changing status, so stock is never released or taken twice
    order = await db.scalar(query.with_for_update(of=Order) if lock else query)
    if order is None:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    return order


@router.get("/{order_id}", response_model=OrderAdminOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    return await _load_order(db, order_id)


@router.patch("/{order_id}", response_model=OrderAdminOut)
async def update_order(order_id: int, body: OrderUpdateIn, db: AsyncSession = Depends(get_db)):
    order = await _load_order(db, order_id, lock=True)
    if body.status is not None:
        # Cancelling before shipment puts the items back on sale; reopening takes them again
        if order.status in STOCK_HELD and body.status == OrderStatus.cancelled:
            await release_stock(db, order)
        elif order.status == OrderStatus.cancelled and body.status in STOCK_HELD:
            await hold_stock(db, order)
        # Leaving 입금전 for a fulfilment status means the transfer was confirmed
        if (
            order.status == OrderStatus.pending_payment
            and body.status in (OrderStatus.preparing, OrderStatus.shipping, OrderStatus.delivered)
            and order.paid_at is None
        ):
            order.paid_at = datetime.now(UTC)
        order.status = body.status
    if "tracking_number" in body.model_fields_set:
        order.tracking_number = body.tracking_number or None
    await db.commit()
    return await _load_order(db, order_id)
