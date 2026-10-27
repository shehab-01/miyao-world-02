"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import OptionSelect from "@/components/product/OptionSelect";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { finalPrice, variantLabel, type ProductDetail, type ProductVariant } from "@/lib/catalog";
import { addToCart, addToWishlist, checkoutHref, loginHref } from "@/lib/shop";

type Line = { variant: ProductVariant; quantity: number };

function QuantityStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex h-[28px] w-[62px] items-center border border-hairline">
      <input
        type="text"
        inputMode="numeric"
        aria-label="수량"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
        className="w-full px-[6px] text-[12px] outline-none"
      />
      <div className="flex h-full flex-col border-l border-hairline">
        <button
          type="button"
          aria-label="수량 증가"
          onClick={() => onChange(clamp(value + 1))}
          className="flex flex-1 items-center px-[3px] text-ink-muted hover:text-ink"
        >
          <ChevronUp size={10} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="수량 감소"
          onClick={() => onChange(clamp(value - 1))}
          className="flex flex-1 items-center border-t border-hairline px-[3px] text-ink-muted hover:text-ink"
        >
          <ChevronDown size={10} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function ProductPurchase({ product }: { product: ProductDetail }) {
  const unitPrice = finalPrice(product);
  const min = product.minimum_order;
  // A product without sizes/colors has one unnamed variant: no option picker needed
  const single = product.variants.length === 1 && !variantLabel(product.variants[0]);
  const soldOut = product.variants.every((v) => v.stock < min);

  const [lines, setLines] = useState<Line[]>(() =>
    single && !soldOut ? [{ variant: product.variants[0], quantity: min }] : [],
  );

  const addVariant = (variant: ProductVariant) => {
    if (lines.some((line) => line.variant.id === variant.id)) return;
    setLines([...lines, { variant, quantity: min }]);
  };
  const setQuantity = (id: number, quantity: number) =>
    setLines(lines.map((line) => (line.variant.id === id ? { ...line, quantity } : line)));

  const linePrice = (line: Line) => (unitPrice + line.variant.extra_price) * line.quantity;
  const total = lines.reduce((sum, line) => sum + linePrice(line), 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const items = lines.map((line) => ({ variant_id: line.variant.id, quantity: line.quantity }));

  /** Cart and wishlist are for members; guests are offered the login page. */
  const memberOnly = () => {
    if (isLoggedIn) return true;
    if (window.confirm("회원만 이용할 수 있습니다. 로그인하시겠습니까?")) router.push(loginHref(pathname));
    return false;
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const buyNow = () => {
    if (lines.length === 0) return window.alert("필수 옵션을 선택해 주세요.");
    // Guests log in first and land on the order form with the same items
    router.push(isLoggedIn ? checkoutHref(items) : loginHref(checkoutHref(items)));
  };
  const addCart = () => {
    if (lines.length === 0) return window.alert("필수 옵션을 선택해 주세요.");
    if (!memberOnly()) return;
    run(async () => {
      await addToCart(items);
      if (window.confirm("장바구니에 담았습니다. 장바구니로 이동하시겠습니까?")) router.push("/cart");
    });
  };
  const addWish = () => {
    if (!memberOnly()) return;
    run(async () => {
      await addToWishlist(product.slug);
      if (window.confirm("관심상품에 담았습니다. 관심상품 목록으로 이동하시겠습니까?")) router.push("/mypage/wishlist");
    });
  };

  return (
    <div>
      {!single && (
        <div className="mb-[16px]">
          <OptionSelect variants={product.variants} minimum={min} disabled={soldOut} onSelect={addVariant} />
        </div>
      )}

      {lines.map((line) => (
        <div
          key={line.variant.id}
          className="flex items-center justify-between gap-[12px] border-t border-hairline py-[16px] text-[13px]"
        >
          <span className="min-w-0 flex-1">
            {product.name}
            {!single && (
              <span className="mt-[4px] block text-[12px] text-ink-muted">
                {variantLabel(line.variant)}
              </span>
            )}
          </span>

          <QuantityStepper
            value={line.quantity}
            min={min}
            max={line.variant.stock}
            onChange={(quantity) => setQuantity(line.variant.id, quantity)}
          />

          <span className="w-[80px] text-right">{formatPrice(linePrice(line))}</span>

          {!single && (
            <button
              type="button"
              aria-label="옵션 삭제"
              onClick={() => setLines(lines.filter((l) => l.variant.id !== line.variant.id))}
              className="text-ink-muted hover:text-ink"
            >
              <X size={13} strokeWidth={1.6} />
            </button>
          )}
        </div>
      ))}

      {soldOut ? (
        <p className="border-t border-hairline pt-[20px] text-[16px] tracking-[0.08em]">SOLD OUT</p>
      ) : (
        <p className="mt-[20px] text-[16px]">
          <strong className="font-bold">Total</strong>(Quantity) : {formatPrice(total)} ({count}개)
        </p>
      )}

      <div className="mt-[22px] grid grid-cols-3 gap-[5px] text-[13px] tracking-[0.08em]">
        <button
          type="button"
          disabled={soldOut || busy}
          onClick={buyNow}
          className="bg-ink py-[12px] text-[13px] leading-none tracking-[0.08em] text-white hover:opacity-85 disabled:opacity-40"
        >
          BUY NOW
        </button>
        <button
          type="button"
          disabled={soldOut || busy}
          onClick={addCart}
          className="border border-hairline py-[12px] text-[13px] leading-none tracking-[0.08em] hover:bg-muted disabled:opacity-40"
        >
          ADD TO CART
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={addWish}
          className="border border-hairline py-[12px] text-[13px] leading-none tracking-[0.08em] hover:bg-muted disabled:opacity-40"
        >
          ADD TO WISH
        </button>
      </div>
    </div>
  );
}
