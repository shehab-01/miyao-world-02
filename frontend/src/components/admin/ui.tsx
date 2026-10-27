// Small building blocks shared by the admin pages.
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-[34px] w-full rounded-[4px] border border-hairline bg-white px-[10px] text-[13px] outline-none focus:border-ink disabled:bg-[#f5f5f5]";

const buttonVariants = {
  primary: "bg-ink text-white hover:opacity-85",
  secondary: "border border-hairline bg-white text-ink hover:bg-[#f5f5f5]",
  danger: "border border-[#e5484d] bg-white text-[#e5484d] hover:bg-[#fff1f1]",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center justify-center gap-[6px] rounded-[4px] px-[14px] text-[13px] disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center justify-center gap-[6px] rounded-[4px] px-[14px] text-[13px]",
        buttonVariants[variant],
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-[6px] block text-[12.5px] text-ink-soft">
        {label}
        {required && <span className="ml-[3px] text-[#e5484d]">*</span>}
      </span>
      {children}
      {hint && <span className="mt-[5px] block text-[12px] text-ink-muted">{hint}</span>}
    </label>
  );
}

export function Card({
  title,
  actions,
  className,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[6px] border border-hairline bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-hairline px-[20px] py-[14px]">
          <h2 className="text-[14px] font-bold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-[20px]">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  back,
  actions,
}: {
  title: string;
  /** Where the back arrow goes (e.g. the list page) */
  back?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-[20px] flex flex-wrap items-center justify-between gap-[12px]">
      <div className="flex items-center gap-[6px]">
        {back && (
          <Link
            href={back}
            aria-label="뒤로"
            title="뒤로"
            className="-ml-[6px] flex h-[32px] w-[32px] items-center justify-center rounded-[4px] text-ink-soft hover:bg-[#ececec] hover:text-ink"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        )}
        <h1 className="text-[20px] font-bold">{title}</h1>
      </div>
      {actions && <div className="flex gap-[8px]">{actions}</div>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-[#f0f0f0] text-ink-soft",
    green: "bg-[#e6f6ec] text-[#18794e]",
    blue: "bg-[#e8f0ff] text-[#1a56db]",
    amber: "bg-[#fff4d6] text-[#a35200]",
    red: "bg-[#ffeaea] text-[#c62a2f]",
  };
  return (
    <span className={cn("inline-block rounded-[3px] px-[7px] py-[2px] text-[12px] whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[13px] text-[#e5484d]">
      {children}
    </p>
  );
}

export function Loading() {
  return <p className="py-[40px] text-center text-[13px] text-ink-muted">불러오는 중…</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-[40px] text-center text-[13px] text-ink-muted">{children}</p>;
}

export const tableClass = "w-full border-collapse text-[13px]";
export const thClass =
  "border-b border-hairline bg-[#fafafa] px-[12px] py-[10px] text-left font-normal text-ink-soft whitespace-nowrap";
export const tdClass = "border-b border-hairline px-[12px] py-[10px] align-middle";

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-[16px] flex items-center justify-center gap-[8px] text-[13px]">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span className="px-[8px]">
        {page} / {pages}
      </span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </div>
  );
}
