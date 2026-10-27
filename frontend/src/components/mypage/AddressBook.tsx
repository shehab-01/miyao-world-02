"use client";

// 배송 주소록 관리: saved delivery addresses; the default one is filled in at checkout

import { useEffect, useState } from "react";
import AddressForm from "@/components/mypage/AddressForm";
import { useRequireLogin } from "@/lib/auth";
import {
  createAddress,
  deleteAddress,
  formatAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "@/lib/shop";

// Same limit as the backend
const MAX_ADDRESSES = 10;
const buttonClass = "border border-hairline px-[12px] py-[7px] text-[12px] leading-none hover:bg-muted disabled:opacity-50";

export default function AddressBook() {
  const user = useRequireLogin();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  // null: the list; "new" or an address: the form
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) getAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, [user]);

  if (!user || !addresses) return <p className="mt-[80px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;

  if (editing) {
    const current = editing === "new" ? null : editing;
    const save = async (value: AddressInput) => {
      setAddresses(current ? await updateAddress(current.id, value) : await createAddress(value));
      setEditing(null);
    };
    return (
      <div className="mt-[30px]">
        <AddressForm
          key={current?.id ?? "new"}
          address={current}
          firstAddress={addresses.length === 0}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  const run = async (action: () => Promise<Address[]>) => {
    setBusy(true);
    try {
      setAddresses(await action());
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = (address: Address) => {
    if (window.confirm(`'${address.label}' 배송지를 삭제하시겠습니까?`)) void run(() => deleteAddress(address.id));
  };

  return (
    <>
      <section className="mt-[80px]">
        <div className="mb-[12px] flex items-end justify-between">
          <h2 className="text-[14px] text-ink-soft">배송 주소록</h2>
          <p className="text-[12px] text-ink-muted">
            {addresses.length} / {MAX_ADDRESSES}
          </p>
        </div>
        <ul className="border-t border-ink">
          {addresses.length === 0 && (
            <li className="border-b border-hairline py-[50px] text-center text-[13px] text-ink-muted">
              등록된 배송지가 없습니다.
            </li>
          )}
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-[12px] border-b border-hairline px-[18px] py-[16px] sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 text-[12.5px] leading-[1.7]">
                <p className="flex items-center gap-[8px] text-[13px]">
                  {address.label}
                  {address.is_default && (
                    <span className="border border-ink px-[6px] py-[3px] text-[11px] leading-none">기본배송지</span>
                  )}
                </p>
                <p className="text-ink-soft">
                  {address.recipient_name}
                  <span className="mx-[8px] text-ink-faint">|</span>
                  {address.recipient_mobile}
                </p>
                <p className="break-keep text-ink-soft">{formatAddress(address)}</p>
              </div>
              <div className="flex shrink-0 gap-[4px]">
                {!address.is_default && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => setDefaultAddress(address.id))}
                    className={buttonClass}
                  >
                    기본배송지 설정
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => setEditing(address)} className={buttonClass}>
                  수정
                </button>
                <button type="button" disabled={busy} onClick={() => remove(address)} className={buttonClass}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-[30px] flex justify-center">
        <button
          type="button"
          disabled={addresses.length >= MAX_ADDRESSES}
          onClick={() => setEditing("new")}
          className="w-[180px] bg-ink py-[11px] text-[13px] leading-none text-white hover:opacity-85 disabled:opacity-50"
        >
          배송지 등록
        </button>
      </div>

      <ul className="mt-[40px] space-y-[6px] text-[12px] leading-[1.6] text-ink-muted">
        <li>- 배송지는 최대 {MAX_ADDRESSES}개까지 등록할 수 있습니다.</li>
        <li>- 기본배송지는 주문서 작성 시 배송지로 자동 입력됩니다.</li>
      </ul>
    </>
  );
}
