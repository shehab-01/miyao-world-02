import Link from "next/link";
import PageTitle from "@/components/common/PageTitle";
import CartGuide from "@/components/cart/CartGuide";
import CartTable from "@/components/cart/CartTable";
import { mockCartItems } from "@/lib/site-config";

export const metadata = {
  title: "SHOPPING BAG | MIYAO WORLD",
};

const tabs = [
  { label: "국내배송상품", href: "/cart", oversea: false },
  { label: "해외배송상품", href: "/cart?delvtype=B", oversea: true },
];

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ delvtype?: string }>;
}) {
  const { delvtype } = await searchParams;
  const oversea = delvtype === "B";
  const items = oversea ? [] : mockCartItems;

  return (
    <div className="lg:max-w-[950px]">
      <PageTitle>Shopping Bag</PageTitle>

      <nav className="mt-[120px] flex border-b border-ink text-[13px]">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`px-[30px] py-[10px] leading-none ${
              tab.oversea === oversea
                ? "bg-[#333] text-white"
                : "text-ink hover:opacity-60"
            }`}
          >
            {tab.label} ({tab.oversea ? 0 : mockCartItems.length})
          </Link>
        ))}
      </nav>

      <CartTable items={items} />

      <div className="relative mt-[31px] flex justify-center gap-[5px] text-[13px]">
        <button
          type="button"
          className="w-[150px] bg-ink py-[11px] text-[13px] leading-none text-white hover:opacity-85"
        >
          전체상품주문
        </button>
        <button
          type="button"
          className="w-[150px] border border-hairline py-[11px] text-[13px] leading-none hover:bg-muted"
        >
          선택상품주문
        </button>
        <Link
          href="/"
          className="absolute right-0 w-[150px] border border-hairline py-[11px] text-center leading-none hover:bg-muted"
        >
          쇼핑계속하기
        </Link>
      </div>

      <div className="mt-[66px]">
        <CartGuide />
      </div>
    </div>
  );
}
