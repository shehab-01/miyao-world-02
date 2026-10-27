from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin
from app.api.routes.admin import admins, auth, catalog, dashboard, members, orders, settings

router = APIRouter(prefix="/admin")
router.include_router(auth.router)

# Everything else requires an admin session
protected = APIRouter(dependencies=[Depends(get_current_admin)])
for module in (dashboard, catalog, orders, members, admins, settings):
    protected.include_router(module.router)
router.include_router(protected)
