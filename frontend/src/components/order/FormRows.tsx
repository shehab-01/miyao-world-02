// Labelled form rows used by the order form and the address book

export function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-hairline sm:flex-row">
      <div className="shrink-0 px-[18px] pt-[12px] text-[12.5px] text-ink-soft sm:w-[150px] sm:py-[14px]">
        {label}
        {required && <span className="ml-[3px] text-[#f0736b]">*</span>}
      </div>
      <div className="min-w-0 flex-1 px-[18px] py-[10px] text-[12.5px]">{children}</div>
    </div>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-[50px]">
      <div className="mb-[12px] flex items-end justify-between gap-[12px]">
        <h2 className="text-[14px] text-ink-soft">{title}</h2>
        {aside}
      </div>
      <div className="border-t border-ink">{children}</div>
    </section>
  );
}
