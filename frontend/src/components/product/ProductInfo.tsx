import type { ProductDetail } from "@/lib/catalog";
import { productShipping } from "@/lib/site-config";
import PriceTag from "@/components/product/PriceTag";
import ProductPurchase from "@/components/product/ProductPurchase";
import ProductAccordion from "@/components/product/ProductAccordion";

export default function ProductInfo({ product }: { product: ProductDetail }) {
  return (
    <div className="pt-[10px]">
      <h1 className="text-[19px] tracking-[0.02em]">{product.name}</h1>

      <div className="mt-[38px] space-y-[18px] text-[14px] leading-none">
        <PriceTag
          price={product.price}
          salePrice={product.sale_price}
          className="flex flex-col gap-[18px]"
        />
        {productShipping.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <hr className="mt-[40px] border-t border-dashed border-hairline" />

      {product.minimum_order > 1 && (
        <p className="mt-[16px] text-[12px] text-ink-muted">
          (최소주문수량 {product.minimum_order}개 이상)
        </p>
      )}

      <div className="mt-[16px]">
        <ProductPurchase product={product} />
      </div>

      <ProductAccordion />
    </div>
  );
}
