import Image from "next/image";
import ProductTabs from "@/components/product/ProductTabs";
import { detailImages, type ProductDetail } from "@/lib/catalog";

export default function ProductDetailSection({ product }: { product: ProductDetail }) {
  return (
    <section id="prdDetail" className="scroll-mt-[20px] pt-[80px]">
      <ProductTabs active="prdDetail" />

      <div className="mx-auto mt-[100px] max-w-[680px] text-center">
        {product.note && <p className="whitespace-pre-line text-[15px]">{product.note}</p>}

        {detailImages(product).map((src, i) => (
          <Image
            key={`${i}-${src}`}
            src={src}
            alt=""
            width={680}
            height={450}
            unoptimized
            className="mt-[60px] h-auto w-full"
          />
        ))}

        <div className="mt-[60px] space-y-[36px] text-[14px] leading-[1.45]">
          {product.size_guide.map((guide) => (
            <div key={guide.title}>
              <p className="font-bold">{guide.title}</p>
              {guide.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ))}
          {product.material && <p>{product.material}</p>}
        </div>
      </div>
    </section>
  );
}
