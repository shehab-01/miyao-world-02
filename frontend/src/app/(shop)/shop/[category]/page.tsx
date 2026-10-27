import { notFound } from "next/navigation";
import ProductList from "@/components/product/ProductList";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts(category)]);
  const info = categories.find((c) => c.slug === category);

  if (!info) notFound();

  return <ProductList title={info.name} products={products} />;
}
