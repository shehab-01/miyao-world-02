import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

export type ItemRow = {
  key: string | number;
  slug: string | null;
  image: string | null;
  name: string;
  option: string | null;
  unitPrice: number;
  quantity: number;
  problem?: string | null;
};

const headers = ["이미지", "상품정보", "판매가", "수량", "합계"];

function ProductLink({ slug, className, children }: { slug: string | null; className?: string; children: React.ReactNode }) {
  // Deleted products have no page any more
  return slug ? (
    <Link href={`/product/${slug}`} className={className}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
}

export default function OrderItemsTable({ rows }: { rows: ItemRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-t border-ink text-[12.5px]">
        <colgroup>
          <col style={{ width: "92px" }} />
          <col />
          <col style={{ width: "110px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "110px" }} />
        </colgroup>

        <thead>
          <tr className="border-b border-hairline text-ink-soft">
            {headers.map((header) => (
              <th key={header} scope="col" className="py-[12px] font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-hairline text-center align-middle">
              <td className="py-[12px]">
                <ProductLink slug={row.slug} className="block px-[10px]">
                  <span className="relative block overflow-hidden bg-placeholder" style={{ aspectRatio: "0.8" }}>
                    {row.image && <Image src={row.image} alt={row.name} fill unoptimized sizes="72px" className="object-cover" />}
                  </span>
                </ProductLink>
              </td>
              <td className="py-[12px] pr-[16px] text-left">
                <ProductLink slug={row.slug} className={row.slug ? "hover:opacity-60" : undefined}>
                  {row.name}
                </ProductLink>
                {row.option && <p className="mt-[6px] text-ink-muted">[옵션: {row.option}]</p>}
                {row.problem && <p className="mt-[6px] text-[#f0736b]">{row.problem}</p>}
              </td>
              <td className="py-[12px]">{formatPrice(row.unitPrice)}</td>
              <td className="py-[12px]">{row.quantity}</td>
              <td className="py-[12px]">{formatPrice(row.unitPrice * row.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
