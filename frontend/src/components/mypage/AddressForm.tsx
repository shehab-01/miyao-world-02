"use client";

// 배송지 등록/수정

import { useState } from "react";
import AddressFields, { inputClass } from "@/components/order/AddressFields";
import { Row, Section } from "@/components/order/FormRows";
import { formatMobile, mobilePattern, type Address, type AddressInput } from "@/lib/shop";

function validate(a: AddressInput) {
  if (!a.label.trim()) return "배송지명을 입력해 주세요.";
  if (!a.recipient_name.trim()) return "받으시는 분 이름을 입력해 주세요.";
  if (!/^\d{5}$/.test(a.postal_code) || !a.address1.trim()) return "주소검색으로 주소를 입력해 주세요.";
  if (!mobilePattern.test(a.recipient_mobile)) return "휴대전화 번호를 정확히 입력해 주세요.";
  return null;
}

export default function AddressForm({
  address,
  firstAddress,
  onSave,
  onCancel,
}: {
  address: Address | null; // null: a new one
  firstAddress: boolean; // the first address always becomes the default
  onSave: (value: AddressInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<AddressInput>(
    address ?? {
      label: "",
      recipient_name: "",
      recipient_mobile: "",
      postal_code: "",
      address1: "",
      address2: "",
      is_default: false,
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<AddressInput>) => setValue({ ...value, ...patch });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(value);
    setError(problem ?? "");
    if (problem) return;
    setSaving(true);
    try {
      await onSave({
        ...value,
        label: value.label.trim(),
        recipient_name: value.recipient_name.trim(),
        address2: value.address2?.trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  // The current default stays the default until another one is picked
  const defaultLocked = firstAddress || Boolean(address?.is_default);

  return (
    <form onSubmit={submit} noValidate>
      <Section title={address ? "배송지 수정" : "배송지 등록"}>
        <Row label="배송지명" required>
          <input
            value={value.label}
            onChange={(e) => set({ label: e.target.value })}
            maxLength={20}
            placeholder="예) 우리집, 회사"
            className={`${inputClass} w-full max-w-[220px]`}
          />
        </Row>
        <Row label="받으시는 분" required>
          <input
            value={value.recipient_name}
            onChange={(e) => set({ recipient_name: e.target.value })}
            maxLength={50}
            className={`${inputClass} w-full max-w-[220px]`}
          />
        </Row>
        <Row label="주소" required>
          <AddressFields
            value={{ postalCode: value.postal_code, address1: value.address1, address2: value.address2 ?? "" }}
            onChange={(patch) =>
              set({
                ...(patch.postalCode !== undefined && { postal_code: patch.postalCode }),
                ...(patch.address1 !== undefined && { address1: patch.address1 }),
                ...(patch.address2 !== undefined && { address2: patch.address2 }),
              })
            }
          />
        </Row>
        <Row label="휴대전화" required>
          <input
            value={value.recipient_mobile}
            onChange={(e) => set({ recipient_mobile: formatMobile(e.target.value) })}
            inputMode="numeric"
            placeholder="010-0000-0000"
            className={`${inputClass} w-full max-w-[220px]`}
          />
        </Row>
        <Row label="기본 배송지">
          <label className="flex items-center gap-[6px]">
            <input
              type="checkbox"
              checked={defaultLocked || value.is_default}
              disabled={defaultLocked}
              onChange={(e) => set({ is_default: e.target.checked })}
              className="h-[13px] w-[13px] accent-ink"
            />
            기본 배송지로 저장
          </label>
          {defaultLocked && (
            <p className="mt-[6px] text-[11.5px] text-ink-muted">
              {firstAddress ? "처음 등록하는 배송지는 기본 배송지가 됩니다." : "다른 배송지를 기본으로 설정하면 바뀝니다."}
            </p>
          )}
        </Row>
      </Section>

      {error && (
        <p role="alert" className="mt-[16px] text-center text-[12.5px] text-[#f0736b]">
          {error}
        </p>
      )}

      <div className="mt-[30px] flex justify-center gap-[5px] text-[13px]">
        <button type="button" onClick={onCancel} className="w-[150px] border border-hairline py-[11px] leading-none hover:bg-muted">
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-[150px] bg-ink py-[11px] leading-none text-white hover:opacity-85 disabled:opacity-50"
        >
          {address ? "수정" : "등록"}
        </button>
      </div>
    </form>
  );
}
