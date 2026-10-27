import Link from "next/link";
import PageTitle from "@/components/common/PageTitle";
import OrderStatusBoard from "@/components/mypage/OrderStatusBoard";
import OrderHistory from "@/components/mypage/OrderHistory";
import { formatPrice } from "@/lib/format";
import { mockMember, myPageMenu } from "@/lib/site-config";

export const metadata = {
  title: "MY PAGE | MIYAO WORLD",
};

export default function MyPage() {
  const summary = [
    { label: "가용적립금", value: formatPrice(mockMember.mileage), href: "/mypage/mileage" },
    { label: "쿠폰", value: `${mockMember.coupon}개`, href: "/mypage/coupon" },
    { label: "예치금", value: formatPrice(mockMember.deposit), href: "/mypage/deposit" },
  ];

  return (
    <>
      <PageTitle>My Page</PageTitle>

      <section className="mt-[80px] flex border border-hairline">
        <h2 className="w-[63px] shrink-0 border-r border-hairline px-[18px] py-[14px] text-[13px] leading-[1.35] text-ink-soft">
          회원정보
        </h2>
        <div className="flex flex-wrap items-center gap-x-[52px] gap-y-[6px] px-[24px] py-[14px] text-[13px]">
          <p>
            <strong className="font-normal">{mockMember.name}</strong> 님은,{" "}
            [{mockMember.grade}] 회원이십니다.
          </p>
          {summary.map((item) => (
            <Link key={item.label} href={item.href} className="hover:opacity-60">
              {item.label} : {item.value}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-[50px]">
        <OrderStatusBoard />
      </div>

      <div className="mt-[50px]">
        <OrderHistory />
      </div>

      <nav className="mt-[50px] grid grid-cols-2 gap-[5px] sm:grid-cols-3">
        {myPageMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border border-hairline px-[18px] py-[16px] text-[13px] hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
