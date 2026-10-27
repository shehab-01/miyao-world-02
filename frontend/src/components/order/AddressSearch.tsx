"use client";

// 주소검색 with the Daum (Kakao) postcode service: free, no API key.
// https://postcode.map.daum.net/guide
// Opens as a layer on the page rather than a popup window, which phones often block.

import { useEffect, useEffectEvent, useRef, useState } from "react";

type PostcodeResult = {
  zonecode: string;
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

type DaumPostcode = new (options: {
  oncomplete: (data: PostcodeResult) => void;
  width: string;
  height: string;
}) => { embed: (element: HTMLElement) => void };

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcode };
  }
}

const SCRIPT_URL = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let loading: Promise<void> | null = null;

function loadScript() {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("주소검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Road-name address with the usual (동, 건물명) note, or the 지번 address if that was picked. */
function fullAddress(data: PostcodeResult) {
  if (data.userSelectedType === "J") return data.jibunAddress;
  const extra = [
    /[동로가]$/.test(data.bname) ? data.bname : "",
    data.apartment === "Y" ? data.buildingName : "",
  ].filter(Boolean);
  return extra.length ? `${data.roadAddress} (${extra.join(", ")})` : data.roadAddress;
}

export default function AddressSearch({
  onSelect,
  className,
}: {
  onSelect: (postalCode: string, address: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const select = useEffectEvent((data: PostcodeResult) => {
    onSelect(data.zonecode, fullAddress(data));
    setOpen(false);
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !frameRef.current) return;
        new window.daum!.Postcode({ oncomplete: select, width: "100%", height: "100%" }).embed(frameRef.current);
        setReady(true);
      })
      .catch((err: Error) => {
        window.alert(err.message);
        setOpen(false);
      });

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setReady(false);
          setOpen(true);
        }}
        className={className}
      >
        주소검색
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div role="dialog" aria-modal="true" aria-label="주소검색" className="flex h-[min(560px,90vh)] w-full max-w-[500px] flex-col bg-white">
            <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-hairline px-[16px]">
              <p className="text-[13px]">주소검색</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="text-[20px] leading-none text-ink-soft hover:text-ink">
                ×
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              {/* The postcode service fills this box itself, so React keeps no children in it */}
              <div ref={frameRef} className="h-full" />
              {!ready && (
                <p className="absolute inset-x-0 top-[40px] text-center text-[12.5px] text-ink-muted">불러오는 중…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
