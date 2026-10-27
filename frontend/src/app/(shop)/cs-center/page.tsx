import PageTitle from "@/components/common/PageTitle";
import FaqAccordion from "@/components/cs/FaqAccordion";
import { csCenterInfo } from "@/lib/site-config";

export const metadata = {
  title: "CS CENTER | MIYAO WORLD",
};

export default function CsCenterPage() {
  return (
    <>
      <PageTitle>CS Center</PageTitle>

      <section className="mt-[80px] border border-hairline">
        <div className="flex flex-wrap items-center gap-x-[14px] px-[24px] py-[20px]">
          <span className="text-[28px] leading-none tracking-[0.02em]">
            {csCenterInfo.tel}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-y-[6px] border-t border-hairline px-[24px] py-[16px] text-[12.5px] text-ink-soft sm:grid-cols-3">
          <p>운영시간 {csCenterInfo.hours}</p>
          <p>점심시간 {csCenterInfo.lunch}</p>
          <p>{csCenterInfo.offDays}</p>
        </div>
        <div className="border-t border-hairline px-[24px] py-[16px] text-[12.5px] text-ink-soft">
          <p>{csCenterInfo.bank}</p>
          <p>예금주 : {csCenterInfo.accountHolder}</p>
        </div>
      </section>

      <section className="mt-[60px]">
        <h2 className="text-[14px] text-ink-soft">자주 묻는 질문</h2>
        <FaqAccordion />
      </section>

      <section className="mt-[60px]">
        <h2 className="text-[14px] text-ink-soft">1:1 문의</h2>

        <div className="mt-[16px] border-y border-hairline">
          <p className="py-[40px] text-center text-[13px] text-ink-muted">
            문의 내역이 없습니다.
          </p>
        </div>

        <div className="mt-[16px] flex justify-end gap-[6px]">
          <button
            type="button"
            className="bg-ink px-[18px] py-[9px] text-[13px] leading-none text-white hover:opacity-85"
          >
            1:1 문의하기
          </button>
          <button
            type="button"
            className="border border-hairline px-[18px] py-[9px] text-[13px] leading-none hover:bg-muted"
          >
            모두 보기
          </button>
        </div>
      </section>
    </>
  );
}
