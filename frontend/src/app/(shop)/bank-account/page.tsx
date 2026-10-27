import PageTitle from "@/components/common/PageTitle";
import { bankAccountInfo } from "@/lib/site-config";

export const metadata = {
  title: "BANK ACCOUNT | MIYAO WORLD",
};

export default function BankAccountPage() {
  return (
    <>
      <PageTitle>Bank Account</PageTitle>

      <section className="mt-[80px] border border-hairline">
        <div className="flex flex-col items-center gap-[10px] px-[24px] py-[50px] text-center">
          <p className="text-[13px] tracking-[0.05em] text-ink-soft">
            무통장입금 계좌안내
          </p>
          <p className="text-[15px] tracking-[0.05em]">{bankAccountInfo.bankName}</p>
          <p className="text-[28px] leading-none tracking-[0.02em]">
            {bankAccountInfo.accountNumber}
          </p>
          <p className="mt-[4px] text-[13px] text-ink-soft">
            예금주 : {bankAccountInfo.accountHolder}
          </p>
        </div>

        <ul className="space-y-[8px] border-t border-hairline px-[24px] py-[20px] text-[12.5px] leading-[1.6] text-ink-muted">
          {bankAccountInfo.notices.map((notice) => (
            <li key={notice} className="flex gap-[8px]">
              <span className="text-ink-faint" aria-hidden>
                -
              </span>
              {notice}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
