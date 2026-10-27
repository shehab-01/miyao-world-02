"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useRequireLogin } from "@/lib/auth";
import type { ProductSummary } from "@/lib/catalog";
import { getWishlist, removeFromWishlist } from "@/lib/shop";

export default function WishlistView() {
  const user = useRequireLogin();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);

  useEffect(() => {
    if (user) getWishlist().then(setProducts).catch(() => setProducts([]));
  }, [user]);

  if (!user) return null;
  if (products === null) return <p className="mt-[60px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;
  if (products.length === 0) {
    return <p className="mt-[60px] text-center text-[13.5px] text-ink-muted">관심상품 내역이 없습니다.</p>;
  }

  const remove = async (slug: string) => {
    try {
      await removeFromWishlist(slug);
      setProducts(products.filter((product) => product.slug !== slug));
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <div className="mt-[30px] grid grid-cols-1 gap-x-[30px] gap-y-[50px] sm:grid-cols-2">
      {products.map((product) => (
        <div key={product.slug}>
          <ProductCard product={product} showInfo />
          <button
            type="button"
            onClick={() => void remove(product.slug)}
            className="mt-[10px] border border-hairline px-[14px] py-[6px] text-[11.5px] leading-none hover:bg-muted"
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  );
}
