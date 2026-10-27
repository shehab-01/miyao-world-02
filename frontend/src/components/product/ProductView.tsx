import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductDetailSection from "@/components/product/ProductDetailSection";
import ProductBoard from "@/components/product/ProductBoard";
import type { ProductDetail } from "@/lib/catalog";

export default function ProductView({ product }: { product: ProductDetail }) {
  return (
    <>
      <div className="grid gap-[60px] lg:grid-cols-[1.05fr_1fr]">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </div>

      <ProductDetailSection product={product} />

      <ProductBoard
        id="prdReview"
        description="상품의 사용후기를 적어주세요."
        writeLabel="상품후기쓰기"
      />

      <ProductBoard
        id="prdQnA"
        description="상품에 대해 궁금한 점을 해결해 드립니다."
        writeLabel="상품문의하기"
      />
    </>
  );
}
