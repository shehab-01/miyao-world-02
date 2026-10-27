"use client";

// 주문서작성: orderer, delivery address and 무통장입금 details for the chosen items

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddressFields, { inputClass } from "@/components/order/AddressFields";
import { Row, Section } from "@/components/order/FormRows";
import OrderItemsTable from "@/components/order/OrderItemsTable";
import { useRequireLogin, type User } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import {
  createAddress,
  formatAddress,
  formatMobile,
  getAddresses,
  getQuote,
  mobilePattern,
  placeOrder,
  type Address,
  type Basket,
  type LineInput,
} from "@/lib/shop";
import { bankAccountInfo } from "@/lib/site-config";

const MAX_ADDRESSES = 10;
const NEW_ADDRESS = "new";

const deliveryMessages = [
  "부재 시 문 앞에 놓아주세요.",
  "배송 전에 미리 연락 바랍니다.",
  "부재 시 경비실에 맡겨 주세요.",
  "택배함에 넣어 주세요.",
];
const CUSTOM_MESSAGE = "custom";

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

/** The recipient half of the form, filled from a saved address or left blank for a new one. */
function recipientFields(address: Address | undefined) {
  return {
    recipientName: address?.recipient_name ?? "",
    recipientMobile: address?.recipient_mobile ?? "",
    postalCode: address?.postal_code ?? "",
    address1: address?.address1 ?? "",
    address2: address?.address2 ?? "",
  };
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
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user || items.length === 0) return;
    getQuote(items)
      .then(setBasket)
      .catch((err: Error) => setLoadError(err.message));
    // Without the address book the order can still be placed with a typed address
    getAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
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
  if (!user || !basket || !addresses) {
    return <p className="mt-[80px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;
  }
  return <OrderForm user={user} basket={basket} addresses={addresses} items={items} fromCart={fromCart} />;
}

function OrderForm({
  user,
  basket,
  addresses,
  items,
  fromCart,
}: {
  user: User;
  basket: Basket;
  addresses: Address[];
  items: LineInput[];
  fromCart: boolean;
}) {
  const router = useRouter();
  // The list comes default first
  const defaultAddress = addresses.find((address) => address.is_default);
  // A saved address's id, or NEW_ADDRESS
  const [addressChoice, setAddressChoice] = useState<string>(
    defaultAddress ? String(defaultAddress.id) : NEW_ADDRESS,
  );
  // The orderer is the member and the recipient their default address, to start with
  const [fields, setFields] = useState<Fields>({
    ordererName: user.name,
    ordererMobile: user.mobile ?? "",
    ordererEmail: user.email,
    ...recipientFields(defaultAddress),
    messageChoice: "",
    customMessage: "",
    depositorName: user.name,
  });
  // A new address goes into the address book after ordering; ticked for the very first one
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
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
    const saved = addresses.find((address) => String(address.id) === addressChoice);
    setFields({
      ...fields,
      recipientName: checked ? fields.ordererName : (saved?.recipient_name ?? ""),
      recipientMobile: checked ? fields.ordererMobile : (saved?.recipient_mobile ?? ""),
    });
  };
  const chooseAddress = (choice: string) => {
    setAddressChoice(choice);
    setSameAsOrderer(false);
    setFields({ ...fields, ...recipientFields(addresses.find((address) => String(address.id) === choice)) });
  };
  const newAddress = addressChoice === NEW_ADDRESS;
  const canSaveAddress = newAddress && addresses.length < MAX_ADDRESSES;

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
      if (canSaveAddress && saveAddress) {
        // The order is placed either way; a failed save only means typing it again next time
        await createAddress({
          label: fields.recipientName.trim().slice(0, 20),
          recipient_name: fields.recipientName.trim(),
          recipient_mobile: fields.recipientMobile,
          postal_code: fields.postalCode,
          address1: fields.address1.trim(),
          address2: fields.address2.trim() || null,
          is_default: false,
        }).catch(() => undefined);
      }
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
        {addresses.length > 0 && (
          <Row label="배송지 선택">
            <div role="radiogroup" aria-label="배송지 선택" className="flex flex-col gap-[8px] py-[4px]">
              {addresses.map((address) => (
                <label key={address.id} className="flex cursor-pointer items-start gap-[8px] leading-[1.6]">
                  <input
                    type="radio"
                    name="address-choice"
                    checked={addressChoice === String(address.id)}
                    onChange={() => chooseAddress(String(address.id))}
                    className="mt-[4px] h-[13px] w-[13px] shrink-0 accent-ink"
                  />
                  <span className="min-w-0">
                    <span className="mr-[6px]">{address.label}</span>
                    {address.is_default && (
                      <span className="mr-[6px] border border-ink px-[5px] py-[2px] text-[10.5px] leading-none">기본</span>
                    )}
                    <span className="block break-keep text-[12px] text-ink-muted">
                      {address.recipient_name} · {formatAddress(address)}
                    </span>
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-[8px]">
                <input
                  type="radio"
                  name="address-choice"
                  checked={newAddress}
                  onChange={() => chooseAddress(NEW_ADDRESS)}
                  className="h-[13px] w-[13px] shrink-0 accent-ink"
                />
                새로운 배송지
              </label>
              <Link href="/mypage/address" target="_blank" className="self-start text-[12px] text-ink-muted underline hover:text-ink">
                배송 주소록 관리
              </Link>
            </div>
          </Row>
        )}
        <Row label="받으시는 분" required>
          <input
            value={fields.recipientName}
            onChange={(e) => set({ recipientName: e.target.value })}
            disabled={sameAsOrderer}
            className={`${inputClass} w-full max-w-[220px] disabled:bg-muted`}
          />
        </Row>
        <Row label="주소" required>
          <AddressFields value={fields} onChange={set} />
          {canSaveAddress && (
            <label className="mt-[8px] flex items-center gap-[6px]">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-[13px] w-[13px] accent-ink"
              />
              배송 주소록에 저장{addresses.length === 0 && " (기본 배송지로 저장됩니다)"}
            </label>
          )}
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
          {bankAccountInfo.shown
            ? `${bankAccountInfo.bankName} ${bankAccountInfo.accountNumber} (예금주: ${bankAccountInfo.accountHolder})`
            : bankAccountInfo.pendingNotice}
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
