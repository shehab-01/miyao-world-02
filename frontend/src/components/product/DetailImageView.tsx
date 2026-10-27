import Image from "next/image";
import type { DetailImage } from "@/lib/catalog";

/**
 * One detail image at full column width. Images (and an image's slices) stack
 * with no gap, so a long image cut into pieces still reads as one.
 */
export default function DetailImageView({ image, alt }: { image: DetailImage; alt: string }) {
  const parts = image.slices.length ? image.slices : [image];
  return parts.map((part, index) => (
    <Image
      key={part.url}
      src={part.url}
      alt={index === 0 ? alt : ""}
      // Older uploads have no recorded size; h-auto still shows them correctly
      width={part.width ?? 900}
      height={part.height ?? 900}
      unoptimized
      className="block h-auto w-full"
    />
  ));
}
