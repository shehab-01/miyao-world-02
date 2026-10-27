"use client";

import Link from "next/link";
import { Card, ErrorText, Loading, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type Dashboard = {
  members_total: number;
  members_today: number;
  products_active: number;
  products_out_of_stock: number;
  orders_today: number;
  sales_today: number;
  orders_pending_payment: number;
  orders_preparing: number;
};

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="rounded-[6px] border border-hairline bg-white p-[20px] hover:border-ink-muted">
      <p className="text-[12.5px] text-ink-muted">{label}</p>
      <p className="mt-[8px] text-[22px] font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const { data, error } = useAdminQuery<Dashboard>("/api/admin/dashboard");

  return (
    <>
      <PageHeader title="대시보드" />
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <Loading />
      ) : (
        <div className="space-y-[24px]">
          <div className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="오늘 주문" value={`${data.orders_today}건`} href="/admin/orders" />
            <Stat label="오늘 매출 (입금 확인 기준)" value={formatPrice(data.sales_today)} />
            <Stat
              label="입금 확인 대기"
              value={`${data.orders_pending_payment}건`}
              href="/admin/orders?status=pending_payment"
            />
            <Stat
              label="배송 준비중"
              value={`${data.orders_preparing}건`}
              href="/admin/orders?status=preparing"
            />
          </div>
          <div className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="전체 회원" value={`${data.members_total}명`} href="/admin/members" />
            <Stat label="오늘 가입" value={`${data.members_today}명`} href="/admin/members" />
            <Stat label="판매중 상품" value={`${data.products_active}개`} href="/admin/products" />
            <Stat label="품절 상품" value={`${data.products_out_of_stock}개`} href="/admin/products" />
          </div>
          <Card title="오늘 할 일">
            <ul className="list-disc space-y-[6px] pl-[18px] text-[13px] text-ink-soft">
              <li>입금 확인 대기 주문의 입금 여부를 확인하고 상태를 &lsquo;배송준비중&rsquo;으로 변경하세요.</li>
              <li>배송을 시작한 주문은 송장번호를 입력하고 &lsquo;배송중&rsquo;으로 변경하세요.</li>
              <li>품절 상품은 재고를 채우거나 숨김 처리하세요.</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
