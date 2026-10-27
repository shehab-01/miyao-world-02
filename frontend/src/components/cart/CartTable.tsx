"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Basket, Line } from "@/lib/shop";

const columns = [27, 92, 0, 98, 95, 98, 98, 85, 98, 110];
const headers = [
  "이미지",
  "상품정보",
  "판매가",
  "수량",
  "적립금",
  "배송구분",
  "배송비",
  "합계",
  "선택",
];

export default function CartTable({
  basket,
  checked,
  onCheck,
  onQuantity,
  onRemove,
  onOrder,
  onWish,
}: {
  basket: Basket;
  checked: number[];
  onCheck: (ids: number[]) => void;
  onQuantity: (id: number, quantity: number) => void;
  onRemove: (ids?: number[]) => void;
  onOrder: (lines: Line[]) => void;
  onWish: (line: Line) => void;
}) {
  const rows = basket.items;
  const [drafts, setDrafts] = useState<Record<number, number>>({});

  const quantityOf = (row: Line) => drafts[row.id!] ?? row.quantity;
  const setDraft = (row: Line, value: number) =>
    setDrafts({ ...drafts, [row.id!]: Math.max(1, value) });

  // Cafe24 keeps the stepper as a draft until [변경] is pressed.
  const apply = (row: Line) => {
    const { [row.id!]: quantity, ...rest } = drafts;
    setDrafts(rest);
    if (quantity !== undefined && quantity !== row.quantity) onQuantity(row.id!, quantity);
  };

  if (rows.length === 0) {
    return (
      <p className="mt-[60px] text-center text-[13.5px]">
        장바구니가 비어 있습니다.
      </p>
    );
  }

  return (
    <section className="mt-[28px]">
      <h2 className="mb-[20px] text-[13.5px] text-ink-soft">
        일반상품 ({rows.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-t border-ink text-[12.5px]">
          <colgroup>
            {columns.map((width, index) => (
              <col
                key={index}
                style={width > 0 ? { width: `${width}px` } : undefined}
              />
            ))}
          </colgroup>

          <thead>
            <tr className="border-b border-hairline text-ink-soft">
              <th scope="col" className="py-[14px]">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={checked.length === rows.length}
                  onChange={(e) =>
                    onCheck(e.target.checked ? rows.map((r) => r.id!) : [])
                  }
                  className="h-[13px] w-[13px] accent-ink"
                />
              </th>
              {headers.map((header) => (
                <th key={header} scope="col" className="py-[14px] font-normal">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-hairline text-center align-middle"
              >
                <td className="py-[12px]">
                  <input
                    type="checkbox"
                    aria-label={`${row.product_name} 선택`}
                    checked={checked.includes(row.id!)}
                    onChange={(e) =>
                      onCheck(
                        e.target.checked
                          ? [...checked, row.id!]
                          : checked.filter((value) => value !== row.id),
                      )
                    }
                    className="h-[13px] w-[13px] accent-ink"
                  />
                </td>

                <td className="py-[12px]">
                  <Link href={`/product/${row.product_slug}`} className="block px-[10px]">
                    <span
                      className="relative block overflow-hidden bg-placeholder"
                      style={{ aspectRatio: "0.8" }}
                    >
                      {row.image_url && (
                        <Image
                          src={row.image_url}
                          alt={row.product_name}
                          fill
                          unoptimized
                          sizes="72px"
                          className="object-cover"
                        />
                      )}
                    </span>
                  </Link>
                </td>

                <td className="py-[12px] pr-[16px] text-left">
                  <Link href={`/product/${row.product_slug}`} className="hover:opacity-60">
                    {row.product_name}
                  </Link>
                  {row.option_label && (
                    <p className="mt-[6px] text-ink-muted">[옵션: {row.option_label}]</p>
                  )}
                  {row.problem && (
                    <p className="mt-[6px] text-[#f0736b]">{row.problem}</p>
                  )}
                </td>

                <td className="py-[12px]">{formatPrice(row.unit_price)}</td>

                <td className="py-[12px]">
                  <div className="mx-auto flex h-[26px] w-[54px] items-center border border-hairline">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`${row.product_name} 수량`}
                      value={quantityOf(row)}
                      onChange={(e) => setDraft(row, Number(e.target.value) || 1)}
                      className="w-full px-[4px] text-center outline-none"
                    />
                    <div className="flex h-full flex-col border-l border-hairline">
                      <button
                        type="button"
                        aria-label="수량 증가"
                        onClick={() => setDraft(row, quantityOf(row) + 1)}
                        className="flex flex-1 items-center px-[2px] text-ink-muted hover:text-ink"
                      >
                        <ChevronUp size={9} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        aria-label="수량 감소"
                        onClick={() => setDraft(row, quantityOf(row) - 1)}
                        className="flex flex-1 items-center border-t border-hairline px-[2px] text-ink-muted hover:text-ink"
                      >
                        <ChevronDown size={9} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => apply(row)}
                    className="mx-auto mt-[6px] block border border-hairline px-[14px] py-[6px] text-[11px] leading-none hover:bg-muted"
                  >
                    변경
                  </button>
                </td>

                <td className="py-[12px] text-ink-muted">-</td>

                <td className="py-[12px] text-ink-muted">기본배송</td>

                {index === 0 && (
                  <td rowSpan={rows.length} className="py-[12px] text-ink-muted">
                    {formatPrice(basket.shipping_fee)}
                    <br />
                    조건
                  </td>
                )}

                <td className="py-[12px]">
                  {formatPrice(row.unit_price * row.quantity)}
                </td>

                <td className="px-[10px] py-[12px]">
                  <div className="mx-auto flex w-[66px] flex-col gap-[4px]">
                    <button
                      type="button"
                      onClick={() => onOrder([row])}
                      className="bg-ink py-[4px] text-[10.5px] leading-none text-white hover:opacity-85"
                    >
                      주문하기
                    </button>
                    <button
                      type="button"
                      onClick={() => onWish(row)}
                      className="border border-hairline py-[4px] text-[10.5px] leading-none hover:bg-muted"
                    >
                      관심상품
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove([row.id!])}
                      className="border border-hairline py-[4px] text-[10.5px] leading-none hover:bg-muted"
                    >
                      삭제하기
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-b border-hairline">
              <td colSpan={10} className="px-[14px] py-[20px]">
                <span className="float-left">[기본배송]</span>
                <span className="block text-right">
                  상품구매금액 {basket.items_total.toLocaleString("ko-KR")} + 배송비{" "}
                  {basket.shipping_fee.toLocaleString("ko-KR")} = 합계 :{" "}
                  <strong className="ml-[6px] text-[16px]">
                    {formatPrice(basket.total)}
                  </strong>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="flex items-center gap-[8px] border-b border-hairline py-[10px] text-[12.5px]">
        <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border border-[#e05a5a] text-[10px] leading-none text-[#e05a5a]">
          !
        </span>
        50,000원 이상 구매 시 배송비가 무료입니다.
      </p>

      <div className="mt-[13px] flex flex-wrap items-center gap-[6px] text-[11.5px]">
        <span className="mr-[6px]">선택상품을</span>
        <button
          type="button"
          onClick={() => checked.length > 0 && onRemove(checked)}
          className="w-[98px] bg-ink py-[7px] text-[11px] leading-none text-white hover:opacity-85"
        >
          삭제하기
        </button>

        <span className="ml-auto flex gap-[9px]">
          <button
            type="button"
            onClick={() => onRemove()}
            className="w-[108px] border border-hairline py-[4px] text-[11px] leading-none hover:bg-muted"
          >
            장바구니비우기
          </button>
        </span>
      </div>

      <div className="mt-[35px] border-t border-ink">
        <div className="grid grid-cols-[1fr_1fr_3fr] bg-[#f7f7f7] text-center text-[12.5px] text-ink-soft">
          <span className="py-[16px]">총 상품금액</span>
          <span className="py-[16px]">총 배송비</span>
          <span className="py-[16px]">결제예정금액</span>
        </div>

        <div className="grid grid-cols-[1fr_1fr_3fr] border-b border-hairline text-center">
          <Amount value={basket.items_total} />
          <Amount value={basket.shipping_fee} sign="+" />
          <Amount value={basket.total} sign="=" />
        </div>
      </div>
    </section>
  );
}

function Amount({ value, sign }: { value: number; sign?: string }) {
  return (
    <p className="py-[12px]">
      {sign && <span className="mr-[4px] text-[24px]">{sign}</span>}
      <span className="text-[24px]">{value.toLocaleString("ko-KR")}</span>
      <span className="ml-[2px] text-[14px]">원</span>
    </p>
  );
}
