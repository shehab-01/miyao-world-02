"use client";

import { use, useState } from "react";
import Link from "next/link";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import {
  Button,
  Card,
  ErrorText,
  Field,
  Loading,
  PageHeader,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import {
  adminRequest,
  formatDateTime,
  orderStatusLabels,
  orderStatuses,
  useAdminQuery,
  type OrderStatus,
} from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type Order = {
  id: number;
  order_number: string;
  user_id: number | null;
  status: OrderStatus;
  orderer_name: string;
  orderer_email: string;
  orderer_mobile: string;
  recipient_name: string;
  recipient_mobile: string;
  postal_code: string;
  address1: string;
  address2: string | null;
  delivery_message: string | null;
  depositor_name: string | null;
  paid_at: string | null;
  tracking_number: string | null;
  items_total: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  items: {
    product_id: number | null;
    product_name: string;
    option_label: string | null;
    unit_price: number;
    quantity: number;
  }[];
};

function Info({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[110px_1fr] gap-y-[10px] text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd>{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusForm({ order, onSaved }: { order: Order; onSaved: (order: Order) => void }) {
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (body: { status?: OrderStatus; tracking_number?: string }) => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await adminRequest<Order>("PATCH", `/api/admin/orders/${order.id}`, body);
      onSaved(updated);
      setStatus(updated.status);
      setMessage("저장되었습니다.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-[14px]">
      {order.status === "pending_payment" && (
        <div className="rounded-[4px] bg-[#fff8e6] p-[12px] text-[13px]">
          입금자 <b>{order.depositor_name ?? order.orderer_name}</b> 님의 {formatPrice(order.total)} 입금을
          확인하셨나요?
          <Button className="mt-[10px] w-full" disabled={saving} onClick={() => save({ status: "preparing" })}>
            입금 확인 → 배송준비중
          </Button>
        </div>
      )}
      <Field label="주문 상태">
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={inputClass}>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabels[value]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="송장번호">
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputClass} />
      </Field>
      <ErrorText>{error}</ErrorText>
      {message && <p className="text-[13px] text-[#18794e]">{message}</p>}
      <Button
        className="w-full"
        disabled={saving}
        onClick={() => save({ status, tracking_number: tracking })}
      >
        저장
      </Button>
    </div>
  );
}

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, error, setData } = useAdminQuery<Order>(`/api/admin/orders/${id}`);

  if (!order) return error ? <ErrorText>{error}</ErrorText> : <Loading />;

  return (
    <>
      <PageHeader title={`주문 ${order.order_number}`} back="/admin/orders" />
      <div className="grid gap-[16px] lg:grid-cols-[1fr_320px]">
        <div className="space-y-[16px]">
          <Card title="주문 상품">
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>상품</th>
                    <th className={thClass}>옵션</th>
                    <th className={thClass}>단가</th>
                    <th className={thClass}>수량</th>
                    <th className={thClass}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className={tdClass}>
                        {item.product_id ? (
                          <Link href={`/admin/products/${item.product_id}`} className="hover:underline">
                            {item.product_name}
                          </Link>
                        ) : (
                          item.product_name
                        )}
                      </td>
                      <td className={tdClass}>{item.option_label ?? "-"}</td>
                      <td className={tdClass}>{formatPrice(item.unit_price)}</td>
                      <td className={tdClass}>{item.quantity}</td>
                      <td className={tdClass}>{formatPrice(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-[16px] space-y-[4px] text-right text-[13px]">
              <p>상품 합계 {formatPrice(order.items_total)}</p>
              <p>배송비 {formatPrice(order.shipping_fee)}</p>
              <p className="text-[15px] font-bold">결제 금액 {formatPrice(order.total)}</p>
            </div>
          </Card>

          <Card title="주문자">
            <Info
              rows={[
                ["이름", <>{order.orderer_name}{order.user_id ? (
                  <Link href={`/admin/members?q=${encodeURIComponent(order.orderer_email)}`} className="ml-[6px] text-accent-blue">
                    회원
                  </Link>
                ) : (
                  <span className="ml-[6px] text-ink-muted">비회원</span>
                )}</>],
                ["이메일", order.orderer_email],
                ["휴대전화", order.orderer_mobile],
                ["주문일시", formatDateTime(order.created_at)],
              ]}
            />
          </Card>

          <Card title="배송지">
            <Info
              rows={[
                ["받는 분", order.recipient_name],
                ["휴대전화", order.recipient_mobile],
                ["주소", `(${order.postal_code}) ${order.address1} ${order.address2 ?? ""}`],
                ["배송 메시지", order.delivery_message],
              ]}
            />
          </Card>
        </div>

        <div className="space-y-[16px]">
          <Card title="처리" actions={<OrderStatusBadge status={order.status} />}>
            <StatusForm order={order} onSaved={setData} />
          </Card>
          <Card title="결제 (무통장입금)">
            <Info
              rows={[
                ["입금자명", order.depositor_name ?? order.orderer_name],
                ["입금 확인", formatDateTime(order.paid_at)],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
