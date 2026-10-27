import Image from "next/image";
import Link from "next/link";
import PriceTag from "@/components/product/PriceTag";
import { galleryImages, type ProductSummary } from "@/lib/catalog";

type Props = {
  product: ProductSummary;
  showInfo?: boolean;
};

export default function ProductCard({ product, showInfo = false }: Props) {
  const image = galleryImages(product)[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      aria-label={product.name}
      className="group block"
    >
      <div
        className="relative overflow-hidden bg-placeholder"
        style={{ aspectRatio: "1.625" }}
      >
        {image && (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}

        {!showInfo && (
          <div className="absolute inset-x-0 bottom-0 hidden bg-[#ececec] px-[19px] pt-[17px] pb-[14px] group-hover:block">
            <p className="text-[12px] leading-none tracking-[0.06em]">
              {product.name}
            </p>
            <PriceTag
              price={product.price}
              salePrice={product.sale_price}
              className="mt-[19px] flex flex-col gap-[6px] text-[11px] leading-none"
            />
          </div>
        )}
      </div>

      {showInfo && (
        <div className="mt-[14px] text-[13px]">
          <p className="tracking-[0.03em]">{product.name}</p>
          <PriceTag
            price={product.price}
            salePrice={product.sale_price}
            className="mt-[6px] flex gap-[8px]"
            saleClassName=""
          />
        </div>
      )}
    </Link>
  );
}
