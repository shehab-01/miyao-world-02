import PageTitle from "@/components/common/PageTitle";
import { deliveryInfo } from "@/lib/site-config";

export const metadata = {
  title: "DELIVERY | MIYAO WORLD",
};

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-[14px] text-ink-soft">{children}</h2>;
}

export default function DeliveryPage() {
  return (
    <>
      <PageTitle>Delivery</PageTitle>

      <section className="mt-[80px]">
        <SectionTitle>배송비 안내</SectionTitle>
        <div className="mt-[16px] border border-hairline px-[24px] py-[20px] text-[13px]">
          <p>
            {deliveryInfo.fee.carrier} {deliveryInfo.fee.base}
            <span className="ml-[8px] text-ink-soft">
              ({deliveryInfo.fee.freeThreshold})
            </span>
          </p>
        </div>
      </section>

      <section className="mt-[50px]">
        <SectionTitle>배송 소요 안내</SectionTitle>
        <ul className="mt-[16px] space-y-[8px] border-y border-hairline px-[24px] py-[20px] text-[12.5px] leading-[1.6] text-ink-muted">
          {deliveryInfo.schedule.map((line) => (
            <li key={line} className="flex gap-[8px]">
              <span className="text-ink-faint" aria-hidden>
                -
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-[50px]">
        <SectionTitle>제주 / 도서산간 추가배송비</SectionTitle>
        <div className="mt-[16px] border-t border-ink text-[13px]">
          {deliveryInfo.remoteAreas.map((row) => (
            <div
              key={row.area}
              className="flex items-center justify-between border-b border-hairline px-[24px] py-[14px]"
            >
              <span className="text-ink-soft">{row.area}</span>
              <span>{row.fee}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-[50px]">
        <SectionTitle>교환 / 반품 배송비 안내</SectionTitle>
        <div className="mt-[16px] border-t border-ink text-[13px]">
          {deliveryInfo.returns.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-hairline px-[24px] py-[14px]"
            >
              <span className="text-ink-soft">{row.label}</span>
              <span>{row.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
