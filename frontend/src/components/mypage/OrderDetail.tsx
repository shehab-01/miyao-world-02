"use client";

// 주문상세 — also the 주문완료 page right after checkout (?done=1)

import { useEffect, useState } from "react";
import Link from "next/link";
import OrderItemsTable from "@/components/order/OrderItemsTable";
import { useRequireLogin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { cancelOrder, getOrder, orderStatusNames, type Order } from "@/lib/shop";
import { bankAccountInfo } from "@/lib/site-config";

function Rows({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <section className="mt-[50px]">
      <h2 className="mb-[12px] text-[14px] text-ink-soft">{title}</h2>
      <dl className="border-t border-ink text-[12.5px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex border-b border-hairline">
            <dt className="w-[130px] shrink-0 px-[18px] py-[12px] text-ink-soft sm:w-[150px]">{label}</dt>
            <dd className="min-w-0 flex-1 px-[18px] py-[12px]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function OrderDetail({ number, done }: { number: string; done: boolean }) {
  const user = useRequireLogin();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) getOrder(number).then(setOrder).catch((err: Error) => setError(err.message));
  }, [user, number]);

  if (error) {
    return (
      <div className="mt-[80px] text-center text-[13px]">
        <p>{error}</p>
        <Link href="/mypage/orders" className="mt-[24px] inline-block border border-hairline px-[30px] py-[11px] leading-none hover:bg-muted">
          주문내역 보기
        </Link>
      </div>
    );
  }
  if (!order) return <p className="mt-[80px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;

  const awaitingPayment = order.status === "pending_payment";

  const cancel = async () => {
    if (!window.confirm("주문을 취소하시겠습니까?")) return;
    setCancelling(true);
    try {
      setOrder(await cancelOrder(order.order_number));
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {done && (
        <section className="mt-[80px] border border-hairline px-[24px] py-[44px] text-center">
          <p className="text-[16px] tracking-[0.05em]">주문이 완료되었습니다.</p>
          <p className="mt-[10px] text-[12.5px] text-ink-muted">
            주문번호 <strong className="font-normal text-ink">{order.order_number}</strong>
          </p>
        </section>
      )}

      {awaitingPayment && (
        <section className={`${done ? "mt-[20px]" : "mt-[80px]"} border border-ink px-[24px] py-[28px] text-center`}>
          <p className="text-[13px] text-ink-soft">아래 계좌로 입금해 주시면 주문이 확정됩니다.</p>
          <p className="mt-[14px] text-[15px]">{bankAccountInfo.bankName}</p>
          <p className="mt-[6px] text-[24px] leading-none tracking-[0.02em]">{bankAccountInfo.accountNumber}</p>
          <p className="mt-[8px] text-[12.5px] text-ink-soft">예금주 : {bankAccountInfo.accountHolder}</p>
          <p className="mt-[16px] text-[13px]">
            입금액 <strong className="text-[16px]">{formatPrice(order.total)}</strong>
            <span className="mx-[10px] text-ink-faint">|</span>
            입금자명 <strong className="font-normal">{order.depositor_name}</strong>
          </p>
          <p className="mt-[12px] text-[11.5px] text-ink-muted">
            주문 후 3일 이내 미입금 시 주문이 자동 취소됩니다. 안내 메일을 {order.orderer_email} 로 보내드렸습니다.
          </p>
        </section>
      )}

      <Rows
        title="주문정보"
        rows={[
          ["주문번호", order.order_number],
          ["주문일자", new Date(order.created_at).toLocaleString("ko-KR")],
          ["주문자", order.orderer_name],
          ["주문처리상태", orderStatusNames[order.status]],
          ...(order.tracking_number ? [["송장번호", order.tracking_number] as [string, string]] : []),
        ]}
      />

      <section className="mt-[50px]">
        <h2 className="mb-[12px] text-[14px] text-ink-soft">주문상품</h2>
        <OrderItemsTable
          rows={order.items.map((item, index) => ({
            key: index,
            slug: item.product_slug,
            image: item.image_url,
            name: item.product_name,
            option: item.option_label,
            unitPrice: item.unit_price,
            quantity: item.quantity,
          }))}
        />
      </section>

      <Rows
        title="결제정보"
        rows={[
          ["상품구매금액", formatPrice(order.items_total)],
          ["배송비", formatPrice(order.shipping_fee)],
          ["총 결제금액", <strong key="total">{formatPrice(order.total)}</strong>],
          ["결제수단", "무통장입금"],
          ["입금자명", order.depositor_name ?? "-"],
          ["입금확인", order.paid_at ? new Date(order.paid_at).toLocaleString("ko-KR") : "입금 확인 전"],
        ]}
      />

      <Rows
        title="배송지정보"
        rows={[
          ["받으시는 분", order.recipient_name],
          ["주소", `(${order.postal_code}) ${order.address1}${order.address2 ? ` ${order.address2}` : ""}`],
          ["휴대전화", order.recipient_mobile],
          ["배송메시지", order.delivery_message ?? "-"],
        ]}
      />

      <div className="mt-[40px] flex justify-center gap-[5px] text-[13px]">
        <Link href="/mypage/orders" className="w-[150px] border border-hairline py-[11px] text-center leading-none hover:bg-muted">
          주문내역 보기
        </Link>
        {awaitingPayment && (
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={cancelling}
            className="w-[150px] border border-hairline py-[11px] text-[13px] leading-none hover:bg-muted disabled:opacity-50"
          >
            주문취소
          </button>
        )}
        <Link href="/" className="w-[150px] bg-ink py-[11px] text-center leading-none text-white hover:opacity-85">
          쇼핑계속하기
        </Link>
      </div>
    </>
  );
}
