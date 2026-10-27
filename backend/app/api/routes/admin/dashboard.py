from datetime import datetime, time
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Order, OrderStatus, Product, ProductVariant, User
from app.schemas.admin import DashboardOut

router = APIRouter(tags=["Admin"])

KST = ZoneInfo("Asia/Seoul")
NOT_SALES = (OrderStatus.pending_payment, OrderStatus.cancelled, OrderStatus.returned)


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(db: AsyncSession = Depends(get_db)):
    # "Today" is the shop's day in Korea, whatever the server's timezone
    today = datetime.combine(datetime.now(KST).date(), time.min, tzinfo=KST)

    async def count(query) -> int:
        return await db.scalar(select(func.count()).select_from(query.subquery()))

    in_stock = (
        select(ProductVariant.product_id)
        .where(ProductVariant.is_active, ProductVariant.stock > 0)
        .distinct()
    )
    orders_today = select(Order).where(Order.created_at >= today)

    return DashboardOut(
        members_total=await count(select(User.id)),
        members_today=await count(select(User.id).where(User.created_at >= today)),
        products_active=await count(select(Product.id).where(Product.is_active)),
        products_out_of_stock=await count(
            select(Product.id).where(Product.is_active, Product.id.not_in(in_stock))
        ),
        orders_today=await count(orders_today),
        sales_today=await db.scalar(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.created_at >= today, Order.status.not_in(NOT_SALES)
            )
        ),
        orders_pending_payment=await count(
            select(Order.id).where(Order.status == OrderStatus.pending_payment)
        ),
        orders_preparing=await count(select(Order.id).where(Order.status == OrderStatus.preparing)),
    )
