import { notFound } from "next/navigation";
import ProductList from "@/components/product/ProductList";
import {
  getCategory,
  getProductsByCategory,
  shopCategories,
} from "@/lib/site-config";

export function generateStaticParams() {
  return shopCategories.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const info = getCategory(category);

  if (!info) notFound();

  return (
    <ProductList title={info.label} products={getProductsByCategory(category)} />
  );
}
