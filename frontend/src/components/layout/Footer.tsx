import Link from "next/link";
import { company, footerNav } from "@/lib/site-config";

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <span>
      <span className="tracking-[0.05em]">{label}</span>
      {value && <span className="ml-[6px]">{value}</span>}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="mt-[60px] pb-20 text-[12px] leading-[1.6] text-ink-soft lg:mt-[130px]">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="shrink-0">
          {company.tel && <p className="mb-[30px]">{company.tel}</p>}
          {company.bank && (
            <div>
              <p>{company.bank}</p>
              <p>Account holder : {company.accountHolder}</p>
            </div>
          )}
        </div>

        <div className="lg:text-right">
          <nav className="flex flex-wrap gap-[26px] tracking-[0.05em] lg:justify-end">
            {footerNav.map((item) => (
              <Link key={item.label} href={item.href} className="hover:opacity-60">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-[32px] space-y-[10px]">
            <p className="flex flex-wrap gap-x-[22px] lg:justify-end">
              <Field label="COMPANY" value={company.name} />
              <Field label="OWNER" value={company.owner} />
              {company.tel && <Field label="TEL" value={company.tel} />}
            </p>
            <p className="flex flex-wrap gap-x-[22px] lg:justify-end">
              <Field label="ADDRESS" value={company.address} />
              <Field label="WEB MASTER" value={company.webMaster} />
            </p>
            <p className="flex flex-wrap gap-x-[22px] lg:justify-end">
              <Field label="BUSINESS LICENCE" value={company.businessLicence} />
              <Field label="MAIL-ORDER LICENCE" value={company.mailOrderLicence} />
              <Link href="#" className="hover:opacity-60">
                [사업자정보확인]
              </Link>
            </p>
          </div>

          <p className="mt-[24px] flex flex-wrap gap-x-[22px] lg:justify-end">
            <span className="tracking-[0.02em]">
              COPYRIGHT © {company.copyright} ALL RIGHTS RESERVED.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
