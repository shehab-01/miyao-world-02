from fastapi import APIRouter

from app.api.routes import addresses, admin, auth, catalog, orders, shopping

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(shopping.router)
api_router.include_router(orders.router)
api_router.include_router(addresses.router)
api_router.include_router(admin.router)
