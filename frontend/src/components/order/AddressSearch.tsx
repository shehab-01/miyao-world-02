"use client";

// 주소검색 with the Daum (Kakao) postcode service: free, no API key.
// https://postcode.map.daum.net/guide

type PostcodeResult = {
  zonecode: string;
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

type DaumPostcode = new (options: { oncomplete: (data: PostcodeResult) => void }) => { open: () => void };

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
      reject(new Error("주소검색을 불러오지 못했습니다. 주소를 직접 입력해 주세요."));
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
  const open = async () => {
    try {
      await loadScript();
      new window.daum!.Postcode({
        oncomplete: (data) => onSelect(data.zonecode, fullAddress(data)),
      }).open();
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <button type="button" onClick={() => void open()} className={className}>
      주소검색
    </button>
  );
}
