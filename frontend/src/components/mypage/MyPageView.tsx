"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OrderHistory from "@/components/mypage/OrderHistory";
import OrderStatusBoard from "@/components/mypage/OrderStatusBoard";
import { useRequireLogin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getOrderStatusCounts, getOrders, type Order, type OrderStatus } from "@/lib/shop";
import { myPageMenu } from "@/lib/site-config";

export default function MyPageView() {
  const user = useRequireLogin();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [counts, setCounts] = useState<Record<OrderStatus, number> | null>(null);

  useEffect(() => {
    if (!user) return;
    getOrders(5).then(setOrders).catch(() => setOrders([]));
    getOrderStatusCounts().then(setCounts).catch(() => undefined);
  }, [user]);

  if (!user) return null;

  // Coupons and 예치금 aren't offered yet
  const summary = [
    { label: "가용적립금", value: formatPrice(user.mileage) },
    { label: "쿠폰", value: "0개" },
    { label: "예치금", value: formatPrice(0) },
  ];

  return (
    <>
      <section className="mt-[80px] flex border border-hairline">
        <h2 className="w-[63px] shrink-0 border-r border-hairline px-[18px] py-[14px] text-[13px] leading-[1.35] text-ink-soft">
          회원정보
        </h2>
        <div className="flex flex-wrap items-center gap-x-[52px] gap-y-[6px] px-[24px] py-[14px] text-[13px]">
          <p>
            <strong className="font-normal">{user.name}</strong> 님은, [일반회원] 회원이십니다.
          </p>
          {summary.map((item) => (
            <span key={item.label}>
              {item.label} : {item.value}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-[50px]">
        <OrderStatusBoard counts={counts} />
      </div>

      <div className="mt-[50px]">
        <OrderHistory title="최근 주문내역" orders={orders} />
        {orders && orders.length > 0 && (
          <Link href="/mypage/orders" className="mt-[12px] block text-right text-[12.5px] text-ink-muted hover:text-ink">
            전체 주문내역 보기 &gt;
          </Link>
        )}
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
