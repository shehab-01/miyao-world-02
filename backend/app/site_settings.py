"""Shop-wide settings stored in the site_settings table."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SiteSetting

# {"header": [image, ...], "footer": [image, ...]} — see DetailCommonOut
DETAIL_COMMON_IMAGES = "detail_common_images"


async def get_setting(db: AsyncSession, key: str) -> dict:
    setting = await db.get(SiteSetting, key)
    return setting.value if setting else {}


async def put_setting(db: AsyncSession, key: str, value: dict) -> None:
    setting = await db.get(SiteSetting, key)
    if setting is None:
        db.add(SiteSetting(key=key, value=value))
    else:
        setting.value = value
    await db.commit()
