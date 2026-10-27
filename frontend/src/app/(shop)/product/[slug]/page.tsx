import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProduct } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  return { title: product ? `${product.name} | MIYAO WORLD` : "MIYAO WORLD" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return <ProductView product={product} />;
}
