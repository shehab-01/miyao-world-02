// Storefront catalog data from the API. Server components only.
import { ApiError, apiFetch } from "@/lib/api";

export type Category = { slug: string; name: string };

export type ProductImage = { url: string; kind: "gallery" | "detail" };

export type ProductSummary = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  category: Category;
  images: ProductImage[];
};

export type ProductVariant = {
  id: number;
  size: string | null;
  color: string | null;
  extra_price: number;
  stock: number;
};

export type ProductDetail = ProductSummary & {
  note: string | null;
  material: string | null;
  size_guide: { title: string; lines: string[] }[];
  minimum_order: number;
  variants: ProductVariant[];
};

export type HomeSection = { category: Category; products: ProductSummary[]; total: number };

// Always fresh, so changes made in /admin show up right away
const fresh = { cache: "no-store" } as const;

export const getCategories = () => apiFetch<Category[]>("/api/categories", fresh);

export const getHomeSections = () => apiFetch<HomeSection[]>("/api/home", fresh);

export const getProducts = (category: string) =>
  apiFetch<ProductSummary[]>(`/api/products?category=${encodeURIComponent(category)}`, fresh);

export async function getProduct(slug: string) {
  try {
    return await apiFetch<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`, fresh);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const galleryImages = (product: ProductSummary) =>
  product.images.filter((image) => image.kind === "gallery").map((image) => image.url);

export const detailImages = (product: ProductSummary) =>
  product.images.filter((image) => image.kind === "detail").map((image) => image.url);

/** What the customer pays per item, before option surcharges. */
export const finalPrice = (product: Pick<ProductSummary, "price" | "sale_price">) =>
  product.sale_price ?? product.price;

export function variantLabel(variant: ProductVariant) {
  return [variant.size, variant.color].filter(Boolean).join(" / ");
}
