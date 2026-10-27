"use client";

// 주문서작성: orderer, delivery address and 무통장입금 details for the chosen items

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddressSearch from "@/components/order/AddressSearch";
import OrderItemsTable from "@/components/order/OrderItemsTable";
import { useRequireLogin, type User } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getQuote, placeOrder, type Basket, type LineInput } from "@/lib/shop";
import { bankAccountInfo } from "@/lib/site-config";

const inputClass = "h-[32px] border border-hairline px-[10px] text-[12.5px] outline-none focus:border-ink-muted";
const smallButtonClass = "h-[32px] shrink-0 border border-hairline px-[14px] text-[12px] leading-none hover:bg-muted";

const deliveryMessages = [
  "부재 시 문 앞에 놓아주세요.",
  "배송 전에 미리 연락 바랍니다.",
  "부재 시 경비실에 맡겨 주세요.",
  "택배함에 넣어 주세요.",
];
const CUSTOM_MESSAGE = "custom";

/** "01012345678" → "010-1234-5678" while typing. */
function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const middle = digits.length === 11 ? 4 : 3;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`;
}

const mobilePattern = /^01[016789]-\d{3,4}-\d{4}$/;

type Fields = {
  ordererName: string;
  ordererMobile: string;
  ordererEmail: string;
  recipientName: string;
  recipientMobile: string;
  postalCode: string;
  address1: string;
  address2: string;
  messageChoice: string;
  customMessage: string;
  depositorName: string;
};

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-hairline sm:flex-row">
      <div className="shrink-0 px-[18px] pt-[12px] text-[12.5px] text-ink-soft sm:w-[150px] sm:py-[14px]">
        {label}
        {required && <span className="ml-[3px] text-[#f0736b]">*</span>}
      </div>
      <div className="min-w-0 flex-1 px-[18px] py-[10px] text-[12.5px]">{children}</div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-[50px]">
      <div className="mb-[12px] flex items-end justify-between">
        <h2 className="text-[14px] text-ink-soft">{title}</h2>
        {aside}
      </div>
      <div className="border-t border-ink">{children}</div>
    </section>
  );
}

function validate(f: Fields) {
  if (!f.ordererName.trim()) return "주문자 이름을 입력해 주세요.";
  if (!mobilePattern.test(f.ordererMobile)) return "주문자 휴대전화 번호를 정확히 입력해 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.ordererEmail.trim())) return "이메일을 정확히 입력해 주세요.";
  if (!f.recipientName.trim()) return "받으시는 분 이름을 입력해 주세요.";
  if (!/^\d{5}$/.test(f.postalCode) || !f.address1.trim()) return "주소검색으로 배송지 주소를 입력해 주세요.";
  if (!mobilePattern.test(f.recipientMobile)) return "받으시는 분 휴대전화 번호를 정확히 입력해 주세요.";
  if (!f.depositorName.trim()) return "입금자명을 입력해 주세요.";
  return null;
}

export default function CheckoutForm({ items, fromCart }: { items: LineInput[]; fromCart: boolean }) {
  const user = useRequireLogin();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user || items.length === 0) return;
    getQuote(items)
      .then(setBasket)
      .catch((err: Error) => setLoadError(err.message));
  }, [user, items]);

  if (items.length === 0 || loadError) {
    return (
      <div className="mt-[80px] text-center text-[13px]">
        <p>{loadError || "주문하실 상품이 없습니다."}</p>
        <Link href="/cart" className="mt-[24px] inline-block border border-hairline px-[30px] py-[11px] leading-none hover:bg-muted">
          장바구니로 가기
        </Link>
      </div>
    );
  }
  if (!user || !basket) {
    return <p className="mt-[80px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;
  }
  return <OrderForm user={user} basket={basket} items={items} fromCart={fromCart} />;
}

function OrderForm({
  user,
  basket,
  items,
  fromCart,
}: {
  user: User;
  basket: Basket;
  items: LineInput[];
  fromCart: boolean;
}) {
  const router = useRouter();
  // The orderer is the member; their details are filled in to start with
  const [fields, setFields] = useState<Fields>({
    ordererName: user.name,
    ordererMobile: user.mobile ?? "",
    ordererEmail: user.email,
    recipientName: "",
    recipientMobile: "",
    postalCode: "",
    address1: "",
    address2: "",
    messageChoice: "",
    customMessage: "",
    depositorName: user.name,
  });
  const [sameAsOrderer, setSameAsOrderer] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<Fields>) => {
    const next = { ...fields, ...patch };
    // Keep the recipient in step with the orderer while the box is ticked
    if (sameAsOrderer) Object.assign(next, { recipientName: next.ordererName, recipientMobile: next.ordererMobile });
    setFields(next);
  };
  const toggleSame = (checked: boolean) => {
    setSameAsOrderer(checked);
    setFields({
      ...fields,
      recipientName: checked ? fields.ordererName : "",
      recipientMobile: checked ? fields.ordererMobile : "",
    });
  };

  const blocked = basket.items.find((line) => line.problem);
  const deliveryMessage =
    fields.messageChoice === CUSTOM_MESSAGE ? fields.customMessage.trim() : fields.messageChoice;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = blocked
      ? `[${blocked.product_name}] ${blocked.problem}`
      : (validate(fields) ?? (agreed ? null : "구매조건 확인 및 결제진행에 동의해 주세요."));
    setError(problem ?? "");
    if (problem) return;

    setSubmitting(true);
    try {
      const order = await placeOrder({
        items,
        from_cart: fromCart,
        orderer_name: fields.ordererName.trim(),
        orderer_email: fields.ordererEmail.trim(),
        orderer_mobile: fields.ordererMobile,
        recipient_name: fields.recipientName.trim(),
        recipient_mobile: fields.recipientMobile,
        postal_code: fields.postalCode,
        address1: fields.address1.trim(),
        address2: fields.address2.trim() || null,
        delivery_message: deliveryMessage || null,
        depositor_name: fields.depositorName.trim(),
        agree_purchase: true,
      });
      router.replace(`/mypage/orders/${order.order_number}?done=1`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <section className="mt-[80px]">
        <h2 className="mb-[12px] text-[14px] text-ink-soft">주문상품 ({basket.items.length})</h2>
        <OrderItemsTable
          rows={basket.items.map((line) => ({
            key: line.variant_id,
            slug: line.product_slug,
            image: line.image_url,
            name: line.product_name,
            option: line.option_label,
            unitPrice: line.unit_price,
            quantity: line.quantity,
            problem: line.problem,
          }))}
        />
        <p className="border-b border-hairline px-[14px] py-[16px] text-right text-[12.5px]">
          상품구매금액 {basket.items_total.toLocaleString("ko-KR")} + 배송비 {basket.shipping_fee.toLocaleString("ko-KR")} = 합계 :{" "}
          <strong className="ml-[6px] text-[16px]">{formatPrice(basket.total)}</strong>
        </p>
      </section>

      <Section title="주문 정보">
        <Row label="주문하시는 분" required>
          <input
            value={fields.ordererName}
            onChange={(e) => set({ ordererName: e.target.value })}
            autoComplete="name"
            className={`${inputClass} w-full max-w-[220px]`}
          />
        </Row>
        <Row label="휴대전화" required>
          <input
            value={fields.ordererMobile}
            onChange={(e) => set({ ordererMobile: formatMobile(e.target.value) })}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            className={`${inputClass} w-full max-w-[220px]`}
          />
        </Row>
        <Row label="이메일" required>
          <input
            type="email"
            value={fields.ordererEmail}
            onChange={(e) => set({ ordererEmail: e.target.value })}
            autoComplete="email"
            className={`${inputClass} w-full max-w-[320px]`}
          />
          <p className="mt-[6px] text-[11.5px] text-ink-muted">주문 접수와 입금 안내 메일을 보내드립니다.</p>
        </Row>
      </Section>

      <Section
        title="배송 정보"
        aside={
          <label className="flex items-center gap-[6px] text-[12.5px]">
            <input
              type="checkbox"
              checked={sameAsOrderer}
              onChange={(e) => toggleSame(e.target.checked)}
              className="h-[13px] w-[13px] accent-ink"
            />
            주문자 정보와 동일
          </label>
        }
      >
        <Row label="받으시는 분" required>
          <input
            value={fields.recipientName}
            onChange={(e) => set({ recipientName: e.target.value })}
            disabled={sameAsOrderer}
            className={`${inputClass} w-full max-w-[220px] disabled:bg-muted`}
          />
        </Row>
        <Row label="주소" required>
          <div className="flex max-w-[480px] flex-col gap-[6px]">
            <div className="flex gap-[6px]">
              <input
                value={fields.postalCode}
                onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                inputMode="numeric"
                aria-label="우편번호"
                placeholder="우편번호"
                className={`${inputClass} w-[110px]`}
              />
              <AddressSearch
                onSelect={(postalCode, address1) => set({ postalCode, address1 })}
                className={smallButtonClass}
              />
            </div>
            <input
              value={fields.address1}
              onChange={(e) => set({ address1: e.target.value })}
              aria-label="기본주소"
              placeholder="기본주소"
              className={`${inputClass} w-full`}
            />
            <input
              value={fields.address2}
              onChange={(e) => set({ address2: e.target.value })}
              aria-label="나머지주소"
              placeholder="나머지주소 (선택입력 가능)"
              className={`${inputClass} w-full`}
            />
          </div>
        </Row>
        <Row label="휴대전화" required>
          <input
            value={fields.recipientMobile}
            onChange={(e) => set({ recipientMobile: formatMobile(e.target.value) })}
            disabled={sameAsOrderer}
            inputMode="numeric"
            placeholder="010-0000-0000"
            className={`${inputClass} w-full max-w-[220px] disabled:bg-muted`}
          />
        </Row>
        <Row label="배송메시지">
          <div className="flex max-w-[480px] flex-col gap-[6px]">
            <select
              value={fields.messageChoice}
              onChange={(e) => set({ messageChoice: e.target.value })}
              aria-label="배송메시지 선택"
              className={`${inputClass} w-full bg-white`}
            >
              <option value="">-- 메시지 선택 (선택사항) --</option>
              {deliveryMessages.map((message) => (
                <option key={message} value={message}>
                  {message}
                </option>
              ))}
              <option value={CUSTOM_MESSAGE}>직접 입력</option>
            </select>
            {fields.messageChoice === CUSTOM_MESSAGE && (
              <input
                value={fields.customMessage}
                onChange={(e) => set({ customMessage: e.target.value })}
                maxLength={255}
                aria-label="배송메시지"
                className={`${inputClass} w-full`}
              />
            )}
          </div>
        </Row>
      </Section>

      <Section title="결제 정보">
        <Row label="결제수단">무통장입금</Row>
        <Row label="입금계좌">
          {bankAccountInfo.bankName} {bankAccountInfo.accountNumber} (예금주: {bankAccountInfo.accountHolder})
        </Row>
        <Row label="입금자명" required>
          <input
            value={fields.depositorName}
            onChange={(e) => set({ depositorName: e.target.value })}
            className={`${inputClass} w-full max-w-[220px]`}
          />
          <p className="mt-[6px] text-[11.5px] text-ink-muted">
            주문 후 3일 이내 미입금 시 주문이 자동 취소됩니다. 입금자명이 다르면 입금 확인이 늦어질 수 있습니다.
          </p>
        </Row>
      </Section>

      <section className="mt-[50px] border border-ink">
        <div className="grid grid-cols-[1fr_1fr_1.5fr] bg-[#f7f7f7] text-center text-[12.5px] text-ink-soft">
          <span className="py-[14px]">총 상품금액</span>
          <span className="py-[14px]">배송비</span>
          <span className="py-[14px]">최종결제금액</span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.5fr] text-center">
          <p className="py-[14px] text-[18px]">{formatPrice(basket.items_total)}</p>
          <p className="py-[14px] text-[18px]">+ {formatPrice(basket.shipping_fee)}</p>
          <p className="py-[14px] text-[22px] font-bold">{formatPrice(basket.total)}</p>
        </div>
      </section>

      <label className="mt-[24px] flex items-center justify-center gap-[8px] text-[12.5px]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="h-[14px] w-[14px] accent-ink"
        />
        주문 상품정보 및 결제금액을 확인하였으며, 구매조건 확인 및 결제진행에 동의합니다. (필수)
      </label>

      <div className="mt-[30px] flex flex-col items-center gap-[14px]">
        {error && (
          <p role="alert" className="text-[12.5px] text-[#f0736b]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-[240px] bg-ink py-[15px] text-[14px] leading-none tracking-[0.05em] text-white hover:opacity-85 disabled:opacity-50"
        >
          {formatPrice(basket.total)} 주문하기
        </button>
      </div>
    </form>
  );
}
