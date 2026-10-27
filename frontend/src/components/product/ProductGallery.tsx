"use client";

import { useState } from "react";
import Image from "next/image";
import { galleryImages, type ProductSummary } from "@/lib/catalog";

export default function ProductGallery({ product }: { product: ProductSummary }) {
  const images = galleryImages(product);
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        className="relative overflow-hidden bg-placeholder"
        style={{ aspectRatio: "1.625" }}
      >
        {images[active] && (
          <Image
            src={images[active]}
            alt={product.name}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-[10px] flex flex-wrap gap-[10px]">
          {images.map((src, i) => (
            <li key={`${i}-${src}`}>
              <button
                type="button"
                aria-label={`이미지 ${i + 1}`}
                aria-current={i === active}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`relative block w-[80px] overflow-hidden bg-placeholder ${
                  i === active ? "" : "opacity-60 hover:opacity-100"
                }`}
                style={{ aspectRatio: "1" }}
              >
                <Image src={src} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
