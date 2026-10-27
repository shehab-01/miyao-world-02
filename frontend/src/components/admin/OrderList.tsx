"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import {
  Card,
  Empty,
  ErrorText,
  Loading,
  PageHeader,
  Pagination,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import {
  ADMIN_PAGE_SIZE,
  formatDateTime,
  orderStatusLabels,
  orderStatuses,
  toQuery,
  useAdminQuery,
  type OrderStatus,
  type Page,
} from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: number;
  order_number: string;
  status: OrderStatus;
  orderer_name: string;
  depositor_name: string | null;
  total: number;
  item_count: number;
  is_member: boolean;
  created_at: string;
};

// initialStatus is the raw ?status= value; anything unknown means "all"
export default function OrderList({ initialStatus }: { initialStatus?: string }) {
  const [status, setStatus] = useState(() =>
    orderStatuses.find((value) => value === initialStatus),
  );
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error } = useAdminQuery<Page<OrderRow>>(
    `/api/admin/orders${toQuery({ status, q, page })}`,
  );

  const tabs: { value?: OrderStatus; label: string }[] = [
    { label: "전체" },
    ...orderStatuses.map((value) => ({ value, label: orderStatusLabels[value] })),
  ];

  return (
    <>
      <PageHeader title="주문 관리" />
      <Card>
        <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
          <div className="flex flex-wrap gap-[6px]">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-[4px] border px-[12px] py-[6px] text-[13px]",
                  status === tab.value
                    ? "border-ink bg-ink text-white"
                    : "border-hairline hover:bg-[#f5f5f5]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQ(search.trim());
              setPage(1);
            }}
            className="relative w-full max-w-[280px]"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="주문번호, 주문자, 입금자, 연락처"
              className={`${inputClass} pr-[34px]`}
            />
            <button type="submit" aria-label="검색" className="absolute top-[9px] right-[10px]">
              <Search size={15} />
            </button>
          </form>
        </div>

        <ErrorText>{error}</ErrorText>
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <Empty>주문이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>주문번호</th>
                  <th className={thClass}>주문일시</th>
                  <th className={thClass}>주문자 / 입금자</th>
                  <th className={thClass}>수량</th>
                  <th className={thClass}>결제금액</th>
                  <th className={thClass}>상태</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafafa]">
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${order.id}`} className="text-accent-blue hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className={tdClass}>{formatDateTime(order.created_at)}</td>
                    <td className={tdClass}>
                      {order.orderer_name}
                      {!order.is_member && <span className="ml-[4px] text-ink-muted">(비회원)</span>}
                      {order.depositor_name && order.depositor_name !== order.orderer_name && (
                        <span className="block text-[12px] text-ink-muted">입금자 {order.depositor_name}</span>
                      )}
                    </td>
                    <td className={tdClass}>{order.item_count}개</td>
                    <td className={tdClass}>{formatPrice(order.total)}</td>
                    <td className={tdClass}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination page={page} total={data.total} pageSize={ADMIN_PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </>
  );
}
