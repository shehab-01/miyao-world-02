# Import every model here so Alembic autogenerate sees the full metadata.
from app.models.admin import Admin
from app.models.catalog import Category, Product, ProductImage, ProductImageKind, ProductVariant
from app.models.order import Order, OrderItem, OrderStatus
from app.models.shopping import CartItem, WishlistItem
from app.models.user import SocialAccount, SocialProvider, User

__all__ = [
    "Admin",
    "CartItem",
    "Category",
    "Order",
    "OrderItem",
    "OrderStatus",
    "Product",
    "ProductImage",
    "ProductImageKind",
    "ProductVariant",
    "SocialAccount",
    "SocialProvider",
    "User",
    "WishlistItem",
]
