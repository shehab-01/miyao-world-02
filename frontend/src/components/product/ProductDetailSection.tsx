import DetailFold from "@/components/product/DetailFold";
import DetailImageView from "@/components/product/DetailImageView";
import ProductTabs from "@/components/product/ProductTabs";
import { detailImages, type DetailImage, type ProductDetail } from "@/lib/catalog";

function ImageStack({ images, alt }: { images: DetailImage[]; alt: string }) {
  return images.map((image, i) => <DetailImageView key={`${i}-${image.url}`} image={image} alt={alt} />);
}

export default function ProductDetailSection({ product }: { product: ProductDetail }) {
  return (
    <section id="prdDetail" className="scroll-mt-[20px] pt-[80px]">
      <ProductTabs active="prdDetail" />

      <div className="mt-[60px]">
        <DetailFold>
          {/* 900px is the usual width Korean detail images are made at */}
          <div className="mx-auto max-w-[900px] text-center">
            {/* Shop-wide header images (set in /admin/settings) */}
            <ImageStack images={product.detail_header} alt="" />

            {product.note && <p className="whitespace-pre-line py-[40px] text-[15px]">{product.note}</p>}

            <ImageStack images={detailImages(product)} alt={`${product.name} 상세정보`} />

            {(product.size_guide.length > 0 || product.material) && (
              <div className="space-y-[36px] py-[40px] text-[14px] leading-[1.45]">
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
            )}

            <ImageStack images={product.detail_footer} alt="" />
          </div>
        </DetailFold>
      </div>
    </section>
  );
}
