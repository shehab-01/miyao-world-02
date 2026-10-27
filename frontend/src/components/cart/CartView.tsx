"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartTable from "@/components/cart/CartTable";
import { useRequireLogin } from "@/lib/auth";
import {
  addToWishlist,
  checkoutHref,
  getCart,
  removeFromCart,
  setCartQuantity,
  type Basket,
  type Line,
} from "@/lib/shop";

const tabs = [
  { label: "국내배송상품", href: "/cart", oversea: false },
  { label: "해외배송상품", href: "/cart?delvtype=B", oversea: true },
];

const emptyBasket: Basket = { items: [], items_total: 0, shipping_fee: 0, total: 0 };

export default function CartView({ oversea }: { oversea: boolean }) {
  const user = useRequireLogin();
  const router = useRouter();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    getCart()
      .then((cart) => {
        setBasket(cart);
        setChecked(cart.items.map((item) => item.id!));
      })
      .catch((err: Error) => window.alert(err.message));
  }, [user]);

  const update = async (request: Promise<Basket>) => {
    try {
      const cart = await request;
      setBasket(cart);
      setChecked(checked.filter((id) => cart.items.some((item) => item.id === id)));
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  const remove = (ids?: number[]) => {
    const message = ids ? "선택하신 상품을 삭제하시겠습니까?" : "장바구니를 비우시겠습니까?";
    if (window.confirm(message)) void update(removeFromCart(ids));
  };

  const order = (lines: Line[]) => {
    if (lines.length === 0) return window.alert("주문하실 상품을 선택해 주세요.");
    const blocked = lines.find((line) => line.problem);
    if (blocked) return window.alert(`[${blocked.product_name}] ${blocked.problem}`);
    router.push(checkoutHref(lines, true));
  };

  const wish = async (line: Line) => {
    try {
      await addToWishlist(line.product_slug);
      window.alert("관심상품에 담았습니다.");
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  // Overseas shipping isn't offered yet: that tab is always empty
  const shown = oversea ? emptyBasket : (basket ?? emptyBasket);
  const domesticCount = basket?.items.length ?? 0;

  return (
    <>
      <nav className="mt-[120px] flex border-b border-ink text-[13px]">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`px-[30px] py-[10px] leading-none ${
              tab.oversea === oversea
                ? "bg-[#333] text-white"
                : "text-ink hover:opacity-60"
            }`}
          >
            {tab.label} ({tab.oversea ? 0 : domesticCount})
          </Link>
        ))}
      </nav>

      {basket === null ? (
        <p className="mt-[60px] text-center text-[13.5px] text-ink-muted">불러오는 중…</p>
      ) : (
        <CartTable
          basket={shown}
          checked={checked}
          onCheck={setChecked}
          onQuantity={(id, quantity) => void update(setCartQuantity(id, quantity))}
          onRemove={remove}
          onOrder={order}
          onWish={(line) => void wish(line)}
        />
      )}

      <div className="relative mt-[31px] flex justify-center gap-[5px] text-[13px]">
        {shown.items.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => order(shown.items)}
              className="w-[150px] bg-ink py-[11px] text-[13px] leading-none text-white hover:opacity-85"
            >
              전체상품주문
            </button>
            <button
              type="button"
              onClick={() => order(shown.items.filter((item) => checked.includes(item.id!)))}
              className="w-[150px] border border-hairline py-[11px] text-[13px] leading-none hover:bg-muted"
            >
              선택상품주문
            </button>
          </>
        )}
        <Link
          href="/"
          className={`${shown.items.length > 0 ? "absolute right-0" : ""} w-[150px] border border-hairline py-[11px] text-center leading-none hover:bg-muted`}
        >
          쇼핑계속하기
        </Link>
      </div>
    </>
  );
}
