import { formatPrice } from "@/lib/format";

/** Original price struck through + sale price, or just the price when there's no sale. */
export default function PriceTag({
  price,
  salePrice,
  className,
  originalClassName = "text-ink-muted line-through",
  saleClassName = "text-accent-blue",
}: {
  price: number;
  salePrice: number | null;
  className?: string;
  originalClassName?: string;
  saleClassName?: string;
}) {
  if (salePrice === null) {
    return (
      <span className={className}>
        <span>{formatPrice(price)}</span>
      </span>
    );
  }
  return (
    <span className={className}>
      <span className={originalClassName}>{formatPrice(price)}</span>
      <span className={saleClassName}>{formatPrice(salePrice)}</span>
    </span>
  );
}
