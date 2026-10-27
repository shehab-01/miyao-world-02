"use client";

// 우편번호 + 주소검색 + 기본주소 + 나머지주소, shared by checkout and the address book

import AddressSearch from "@/components/order/AddressSearch";

export const inputClass = "h-[32px] border border-hairline px-[10px] text-[12.5px] outline-none focus:border-ink-muted";
export const smallButtonClass = "h-[32px] shrink-0 border border-hairline px-[14px] text-[12px] leading-none hover:bg-muted";

export type AddressValue = { postalCode: string; address1: string; address2: string };

export default function AddressFields({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
}) {
  return (
    <div className="flex max-w-[480px] flex-col gap-[6px]">
      <div className="flex gap-[6px]">
        <input
          value={value.postalCode}
          readOnly
          aria-label="우편번호"
          placeholder="우편번호"
          className={`${inputClass} w-[110px] bg-muted`}
        />
        <AddressSearch onSelect={(postalCode, address1) => onChange({ postalCode, address1 })} className={smallButtonClass} />
      </div>
      <input
        value={value.address1}
        readOnly
        aria-label="기본주소"
        placeholder="주소검색 버튼을 눌러 주소를 찾아 주세요"
        className={`${inputClass} w-full bg-muted`}
      />
      <input
        value={value.address2}
        onChange={(e) => onChange({ address2: e.target.value })}
        maxLength={255}
        aria-label="나머지주소"
        placeholder="나머지주소 (동·호수 등)"
        className={`${inputClass} w-full`}
      />
    </div>
  );
}
