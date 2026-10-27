"""배송 주소록: a member's saved delivery addresses, picked from at checkout."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Address, User
from app.schemas.address import AddressIn, AddressOut

router = APIRouter(prefix="/addresses", tags=["Addresses"])

MAX_ADDRESSES = 10


async def _list(db: AsyncSession, user: User) -> list[Address]:
    rows = await db.scalars(
        select(Address)
        .where(Address.user_id == user.id)
        # Default first, then newest
        .order_by(Address.is_default.desc(), Address.id.desc())
        .execution_options(populate_existing=True)
    )
    return list(rows)


async def _get(db: AsyncSession, user: User, address_id: int) -> Address:
    address = await db.scalar(select(Address).where(Address.id == address_id, Address.user_id == user.id))
    if address is None:
        raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다.")
    return address


async def _make_default(db: AsyncSession, user: User, address: Address) -> None:
    # Clear the old default first: the partial unique index allows only one
    await db.execute(
        update(Address)
        .where(Address.user_id == user.id, Address.is_default, Address.id != address.id)
        .values(is_default=False)
    )
    address.is_default = True


@router.get("", response_model=list[AddressOut])
async def list_addresses(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _list(db, user)


@router.post("", response_model=list[AddressOut], status_code=201)
async def create_address(
    body: AddressIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    # Serialise this member's address writes so two adds can't both become the first default
    await db.execute(select(User.id).where(User.id == user.id).with_for_update())
    count = await db.scalar(select(func.count()).select_from(Address).where(Address.user_id == user.id))
    if count >= MAX_ADDRESSES:
        raise HTTPException(status_code=409, detail=f"배송지는 {MAX_ADDRESSES}개까지 등록할 수 있습니다.")

    address = Address(user_id=user.id, **body.model_dump(exclude={"is_default"}))
    db.add(address)
    await db.flush()
    # The first address is always the default
    if body.is_default or count == 0:
        await _make_default(db, user, address)
    await db.commit()
    return await _list(db, user)


@router.put("/{address_id}", response_model=list[AddressOut])
async def update_address(
    address_id: int, body: AddressIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    address = await _get(db, user, address_id)
    for key, value in body.model_dump(exclude={"is_default"}).items():
        setattr(address, key, value)
    if body.is_default:
        await _make_default(db, user, address)
    await db.commit()
    return await _list(db, user)


@router.post("/{address_id}/default", response_model=list[AddressOut])
async def set_default_address(
    address_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    await _make_default(db, user, await _get(db, user, address_id))
    await db.commit()
    return await _list(db, user)


@router.delete("/{address_id}", response_model=list[AddressOut])
async def delete_address(
    address_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    await db.execute(select(User.id).where(User.id == user.id).with_for_update())
    address = await _get(db, user, address_id)
    was_default = address.is_default
    await db.delete(address)
    await db.flush()
    if was_default:
        # The newest remaining address takes over as the default
        newest = await db.scalar(
            select(Address).where(Address.user_id == user.id).order_by(Address.id.desc()).limit(1)
        )
        if newest is not None:
            newest.is_default = True
    await db.commit()
    return await _list(db, user)
