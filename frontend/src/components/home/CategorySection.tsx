import Link from "next/link";
import PageTitle from "@/components/common/PageTitle";
import ProductCard from "@/components/product/ProductCard";
import type { HomeSection } from "@/lib/catalog";

export default function CategorySection({ section }: { section: HomeSection }) {
  const href = `/shop/${section.category.slug}`;

  return (
    <section className="mt-[90px]">
      <Link href={href} className="inline-block hover:opacity-60">
        <PageTitle>{section.category.name}</PageTitle>
      </Link>

      <div className="mt-[30px] grid grid-cols-1 gap-[30px] sm:grid-cols-2">
        {section.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      <div className="mt-[30px] flex justify-center">
        <Link
          href={href}
          className="border border-hairline px-[34px] py-[11px] text-[12px] leading-none tracking-[0.1em] hover:bg-muted"
        >
          VIEW MORE
        </Link>
      </div>
    </section>
  );
}
