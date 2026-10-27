import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProductBySlug, products } from "@/lib/site-config";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return <ProductView product={product} />;
}
