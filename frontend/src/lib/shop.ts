// Cart, wishlist and orders. Client components only: every call needs the member's session cookie.
import { apiFetch, apiPost } from "@/lib/api";
import type { ProductSummary } from "@/lib/catalog";

/** One product option with its current price and stock. */
export type Line = {
  id: number | null; // cart row; null on a checkout quote
  variant_id: number;
  quantity: number;
  product_slug: string;
  product_name: string;
  option_label: string | null;
  image_url: string | null;
  unit_price: number;
  stock: number;
  minimum_order: number;
  // Why it can't be ordered right now (sold out…); null if it can
  problem: string | null;
};

export type Basket = { items: Line[]; items_total: number; shipping_fee: number; total: number };

export type OrderStatus =
  | "pending_payment"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "exchanged"
  | "returned";

export const orderStatusNames: Record<OrderStatus, string> = {
  pending_payment: "입금전",
  preparing: "배송준비중",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
  exchanged: "교환",
  returned: "반품",
};

export type OrderItem = {
  product_slug: string | null;
  image_url: string | null;
  product_name: string;
  option_label: string | null;
  unit_price: number;
  quantity: number;
};

export type Order = {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  orderer_name: string;
  orderer_email: string;
  orderer_mobile: string;
  recipient_name: string;
  recipient_mobile: string;
  postal_code: string;
  address1: string;
  address2: string | null;
  delivery_message: string | null;
  depositor_name: string | null;
  paid_at: string | null;
  tracking_number: string | null;
  items_total: number;
  shipping_fee: number;
  total: number;
  items: OrderItem[];
};

export type LineInput = { variant_id: number; quantity: number };

const noStore = { cache: "no-store" } as const;

export const getCart = () => apiFetch<Basket>("/api/cart", noStore);
export const addToCart = (items: LineInput[]) => apiPost<Basket>("/api/cart", { items });
export const setCartQuantity = (id: number, quantity: number) =>
  apiFetch<Basket>(`/api/cart/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
/** Without ids the whole cart is emptied. */
export const removeFromCart = (ids?: number[]) =>
  apiFetch<Basket>(`/api/cart${ids ? `?${ids.map((id) => `ids=${id}`).join("&")}` : ""}`, { method: "DELETE" });

export const getWishlist = () => apiFetch<ProductSummary[]>("/api/wishlist", noStore);
export const addToWishlist = (slug: string) =>
  apiFetch<void>(`/api/wishlist/${encodeURIComponent(slug)}`, { method: "PUT" });
export const removeFromWishlist = (slug: string) =>
  apiFetch<void>(`/api/wishlist/${encodeURIComponent(slug)}`, { method: "DELETE" });

export const getQuote = (items: LineInput[]) => apiPost<Basket>("/api/orders/quote", { items });
export const placeOrder = (payload: Record<string, unknown>) => apiPost<Order>("/api/orders", payload);
export const getOrders = (limit?: number) => apiFetch<Order[]>(`/api/orders${limit ? `?limit=${limit}` : ""}`, noStore);
export const getOrderStatusCounts = () => apiFetch<Record<OrderStatus, number>>("/api/orders/status-counts", noStore);
export const getOrder = (number: string) => apiFetch<Order>(`/api/orders/${encodeURIComponent(number)}`, noStore);
export const cancelOrder = (number: string) => apiPost<Order>(`/api/orders/${encodeURIComponent(number)}/cancel`);

// The checkout page gets its items in the URL: /order/checkout?items=133-2,136-1(&from=cart)
export function checkoutHref(items: LineInput[], fromCart = false) {
  const list = items.map((item) => `${item.variant_id}-${item.quantity}`).join(",");
  return `/order/checkout?items=${list}${fromCart ? "&from=cart" : ""}`;
}

export function parseCheckoutItems(value: string | undefined): LineInput[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.split("-").map(Number))
    .filter(([id, quantity]) => Number.isInteger(id) && Number.isInteger(quantity) && id > 0 && quantity > 0)
    .map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

/** Sends guests to the login page, coming back to `next` afterwards. */
export const loginHref = (next: string) => `/login?next=${encodeURIComponent(next)}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. ?/g, "-").replace(/-$/, "");
