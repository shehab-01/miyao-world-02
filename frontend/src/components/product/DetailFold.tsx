"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FOLDED_HEIGHT = 1400;

/**
 * Folds a long detail area behind "상품정보 더보기". It's clamped from the first
 * render so the page doesn't jump, and the content stays in the HTML so search
 * engines still read it.
 */
export default function DetailFold({ children }: { children: React.ReactNode }) {
  const top = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [foldable, setFoldable] = useState(false);

  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setFoldable(element.offsetHeight > FOLDED_HEIGHT));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    if (open) top.current?.scrollIntoView();
    setOpen(!open);
  };

  return (
    <div ref={top} className="scroll-mt-[20px]">
      <div className={open ? undefined : "relative overflow-hidden"} style={open ? undefined : { maxHeight: FOLDED_HEIGHT }}>
        <div ref={content}>{children}</div>
        {foldable && !open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {foldable && (
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className="mx-auto mt-[30px] flex h-[46px] w-full max-w-[400px] items-center justify-center gap-[6px] border border-ink text-[13px] tracking-[0.05em] hover:bg-ink hover:text-white"
        >
          {open ? "상품정보 접기" : "상품정보 더보기"}
          {open ? <ChevronUp size={16} strokeWidth={1.4} /> : <ChevronDown size={16} strokeWidth={1.4} />}
        </button>
      )}
    </div>
  );
}
