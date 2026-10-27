"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { variantLabel, type ProductVariant } from "@/lib/catalog";

/**
 * The option picker. A custom list instead of <select> so each option can show
 * its picture (set per option in the admin).
 */
export default function OptionSelect({
  variants,
  minimum,
  disabled,
  onSelect,
}: {
  variants: ProductVariant[];
  // Options with less stock than this are sold out
  minimum: number;
  disabled?: boolean;
  onSelect: (variant: ProductVariant) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  // Keyboard highlight while the list is open
  const [focused, setFocused] = useState(-1);
  const available = (v: ProductVariant) => v.stock >= minimum;
  // Keep the picture column only if at least one option has a picture
  const withImages = variants.some((v) => v.image_url);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (variant: ProductVariant) => {
    if (!available(variant)) return;
    onSelect(variant);
    setOpen(false);
  };

  const step = (by: 1 | -1) => {
    // Skip sold-out options
    let next = focused;
    for (let n = 0; n < variants.length; n++) {
      next = (next + by + variants.length) % variants.length;
      if (available(variants[next])) return setFocused(next);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setFocused(-1);
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focused >= 0) choose(variants[focused]);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        role="combobox"
        aria-label="옵션 선택"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        className="flex h-[36px] w-full items-center justify-between gap-[8px] border border-hairline bg-white pr-[12px] pl-[12px] text-left text-[12.5px] disabled:opacity-50"
      >
        - [필수] 옵션을 선택해 주세요 -
        <ChevronDown size={16} strokeWidth={1.5} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="옵션"
          className="absolute inset-x-0 top-full z-20 -mt-px max-h-[340px] overflow-y-auto border border-hairline bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          {variants.map((variant, i) => {
            const soldOut = !available(variant);
            return (
              <li
                key={variant.id}
                role="option"
                aria-selected={i === focused}
                aria-disabled={soldOut}
                onMouseEnter={() => setFocused(i)}
                onClick={() => choose(variant)}
                className={`flex items-center gap-[10px] px-[12px] py-[7px] text-[12.5px] ${
                  soldOut ? "cursor-default text-ink-faint" : `cursor-pointer ${i === focused ? "bg-[#f4f4f4]" : ""}`
                }`}
              >
                {withImages && (
                  <span className="relative block h-[45px] w-[36px] shrink-0 overflow-hidden bg-placeholder">
                    {variant.image_url && (
                      <Image
                        src={variant.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="36px"
                        className={`object-cover ${soldOut ? "opacity-40" : ""}`}
                      />
                    )}
                  </span>
                )}
                <span className="flex-1">{variantLabel(variant)}</span>
                {variant.extra_price !== 0 && (
                  <span className="text-ink-muted">
                    {variant.extra_price > 0 ? "+" : ""}
                    {formatPrice(variant.extra_price)}
                  </span>
                )}
                {soldOut && <span>품절</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
