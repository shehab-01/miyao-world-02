"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";

/** Picks an option's picture from the product's gallery images. */
export default function VariantImagePicker({
  value,
  images,
  onChange,
}: {
  value: string | null;
  images: string[];
  onChange: (url: string | null) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  // Where the popup opens (viewport coordinates); null when closed. It's
  // position: fixed because the options table scrolls sideways and would clip it.
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const open = at !== null;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setAt(null);
    const closeNow = () => setAt(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeNow, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeNow, true);
    };
  }, [open]);

  const toggle = (button: HTMLElement) => {
    if (open) return setAt(null);
    const rect = button.getBoundingClientRect();
    setAt({ top: rect.bottom + 4, left: rect.left });
  };

  const pick = (url: string | null) => {
    onChange(url);
    setAt(null);
  };

  return (
    <div ref={root}>
      <button
        type="button"
        aria-label="옵션 이미지 선택"
        onClick={(e) => toggle(e.currentTarget)}
        className="relative flex h-[45px] w-[36px] items-center justify-center overflow-hidden rounded-[3px] border border-dashed border-hairline bg-[#f5f5f5] text-ink-muted hover:border-ink-muted"
      >
        {value ? <Image src={value} alt="" fill unoptimized className="object-cover" /> : <ImagePlus size={15} />}
      </button>

      {at && (
        <div
          style={at}
          className="fixed z-50 w-[252px] rounded-[4px] border border-hairline bg-white p-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          {images.length === 0 ? (
            <p className="p-[8px] text-[12px] text-ink-muted">위의 &lsquo;상품 이미지&rsquo;를 먼저 추가해 주세요.</p>
          ) : (
            <ul className="grid grid-cols-5 gap-[4px]">
              {images.map((url, i) => (
                <li key={`${i}-${url}`}>
                  <button
                    type="button"
                    onClick={() => pick(url)}
                    className={`relative block h-[55px] w-full overflow-hidden rounded-[2px] ${
                      url === value ? "outline-2 -outline-offset-2 outline-ink" : "hover:opacity-80"
                    }`}
                  >
                    <Image src={url} alt="" fill unoptimized className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {value && (
            <button type="button" onClick={() => pick(null)} className="mt-[8px] w-full text-[12px] text-ink-muted hover:text-[#e5484d]">
              이미지 빼기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
