from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.admin import DetailCommonIn
from app.schemas.catalog import DetailCommonOut
from app.site_settings import DETAIL_COMMON_IMAGES, get_setting, put_setting

router = APIRouter(prefix="/settings", tags=["Admin"])


@router.get("/detail-images", response_model=DetailCommonOut)
async def get_detail_images(db: AsyncSession = Depends(get_db)):
    return await get_setting(db, DETAIL_COMMON_IMAGES)


@router.put("/detail-images", response_model=DetailCommonOut)
async def update_detail_images(body: DetailCommonIn, db: AsyncSession = Depends(get_db)):
    value = body.model_dump()
    await put_setting(db, DETAIL_COMMON_IMAGES, value)
    return value
