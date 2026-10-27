import PageTitle from "@/components/common/PageTitle";
import ProductCard from "@/components/product/ProductCard";
import type { ProductSummary } from "@/lib/catalog";

type Props = {
  title: string;
  products: ProductSummary[];
};

export default function ProductList({ title, products }: Props) {
  return (
    <section>
      <PageTitle>{title}</PageTitle>

      {products.length === 0 ? (
        <p className="mt-[60px] text-center text-[13.5px] text-ink-muted">
          준비 중인 상품입니다.
        </p>
      ) : (
        <div className="mt-[30px] grid grid-cols-1 gap-x-[30px] gap-y-[50px] sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} showInfo />
          ))}
        </div>
      )}
    </section>
  );
}
