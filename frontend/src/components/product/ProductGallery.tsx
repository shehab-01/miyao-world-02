"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize2 } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { galleryImages, type ProductSummary } from "@/lib/catalog";

// Portrait, like most model / product shots (1200x1500 etc.)
const ASPECT = "4 / 5";

const roundButton =
  "z-10 h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.25)] opacity-0 transition-opacity";
// Prev / next on the main image: shown on mouse hover, hidden on touch screens (swipe there)
const sideButton = `${roundButton} absolute top-1/2 flex h-[38px] w-[38px] -translate-y-1/2 group-hover/main:opacity-100 [@media(hover:none)]:hidden`;

export default function ProductGallery({ product }: { product: ProductSummary }) {
  const images = galleryImages(product);
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const strip = useRef<HTMLUListElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Whether the (desktop, vertical) strip can scroll further up / down
  const [canScroll, setCanScroll] = useState({ up: false, down: false });

  const measure = useCallback(() => {
    const list = strip.current;
    if (!list) return;
    setCanScroll({
      up: list.scrollTop > 1,
      down: list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    const list = strip.current;
    if (!list) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  const select = (index: number) => {
    setActive(index);
    // Bring the picked thumbnail to the start of the strip (top on desktop,
    // left on mobile); the browser stops at the end when there's nothing more below
    const item = strip.current?.children[index] as HTMLElement | undefined;
    if (item) strip.current!.scrollTo({ top: item.offsetTop, left: item.offsetLeft, behavior: "smooth" });
  };

  const go = (by: 1 | -1) => select((active + by + images.length) % images.length);

  const scrollStrip = (direction: 1 | -1) => {
    const list = strip.current;
    if (list) list.scrollBy({ top: direction * list.clientHeight * 0.8, behavior: "smooth" });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    // A mostly-horizontal swipe changes the image; vertical moves scroll the page
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  return (
    // Desktop: thumbnail strip on the left. Mobile: a scrolling row under the image.
    // min-w-0: the thumbnail row scrolls instead of widening the page.
    // self-start: the main image alone sets the height, not the info column beside it.
    <div className="flex min-w-0 flex-col-reverse gap-[8px] lg:flex-row lg:items-start lg:self-start">
      {images.length > 1 && (
        // The strip is as tall as the main image and scrolls when there are many
        <div className="group/strip relative shrink-0 lg:w-[72px] lg:self-stretch">
          <ul
            ref={strip}
            onScroll={measure}
            className="relative flex gap-[6px] overflow-x-auto [scrollbar-width:none] lg:absolute lg:inset-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <li key={`${i}-${src}`} className="shrink-0">
                <button
                  type="button"
                  aria-label={`이미지 ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => select(i)}
                  className="relative block w-[64px] overflow-hidden bg-placeholder lg:w-[72px]"
                  style={{ aspectRatio: ASPECT }}
                >
                  <Image src={src} alt="" fill unoptimized sizes="72px" className="object-cover" />
                  {i === active && <span className="absolute inset-0 border-2 border-black" />}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop only, on hover, and only toward the side that has more thumbnails */}
          {canScroll.up && (
            <button
              type="button"
              aria-label="이전 이미지 보기"
              onClick={() => scrollStrip(-1)}
              className={`${roundButton} absolute top-[8px] left-1/2 hidden -translate-x-1/2 group-hover/strip:opacity-100 lg:flex`}
            >
              <ChevronUp size={18} strokeWidth={1.6} />
            </button>
          )}
          {canScroll.down && (
            <button
              type="button"
              aria-label="다음 이미지 보기"
              onClick={() => scrollStrip(1)}
              className={`${roundButton} absolute bottom-[8px] left-1/2 hidden -translate-x-1/2 group-hover/strip:opacity-100 lg:flex`}
            >
              <ChevronDown size={18} strokeWidth={1.6} />
            </button>
          )}
        </div>
      )}

      <div
        className="group/main relative flex-1 overflow-hidden bg-placeholder"
        style={{ aspectRatio: ASPECT }}
        onTouchStart={(e) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={onTouchEnd}
      >
        {images[active] && (
          <button type="button" aria-label="크게 보기" onClick={() => setZoomOpen(true)} className="absolute inset-0 cursor-zoom-in">
            <Image
              src={images[active]}
              alt={product.name}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </button>
        )}

        {images.length > 1 && (
          <>
            <button type="button" aria-label="이전 이미지" onClick={() => go(-1)} className={`${sideButton} left-[12px]`}>
              <ChevronLeft size={20} strokeWidth={1.6} />
            </button>
            <button type="button" aria-label="다음 이미지" onClick={() => go(1)} className={`${sideButton} right-[12px]`}>
              <ChevronRight size={20} strokeWidth={1.6} />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute right-[12px] bottom-[12px] flex items-center gap-[4px]">
          {images.length > 1 && (
            <span className="rounded-[3px] bg-black/40 px-[7px] py-[2px] text-[12px] text-white">
              {active + 1} / {images.length}
            </span>
          )}
          {images.length > 0 && (
            <button
              type="button"
              aria-label="확대해서 보기"
              onClick={() => setZoomOpen(true)}
              className="pointer-events-auto flex h-[22px] w-[22px] items-center justify-center rounded-[3px] bg-black/40 text-white"
            >
              <Maximize2 size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Full-screen viewer: zoom buttons, wheel / double-click zoom, drag to pan,
          pinch-zoom and swipe on phones. Browsing here moves the page gallery too. */}
      <Lightbox
        open={zoomOpen}
        close={() => setZoomOpen(false)}
        index={active}
        slides={images.map((src) => ({ src, alt: product.name }))}
        plugins={images.length > 1 ? [Zoom, Counter] : [Zoom]}
        on={{ view: ({ index }) => select(index) }}
        carousel={{ finite: images.length < 2 }}
        render={images.length < 2 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
}
