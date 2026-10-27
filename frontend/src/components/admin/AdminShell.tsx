"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Loading } from "@/components/admin/ui";
import { adminRequest, useAdminQuery, type AdminAccount } from "@/lib/admin";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/orders", label: "주문 관리", icon: ReceiptText },
  { href: "/admin/products", label: "상품 관리", icon: Package },
  { href: "/admin/categories", label: "카테고리", icon: FolderTree },
  { href: "/admin/members", label: "회원 관리", icon: Users },
  { href: "/admin/admins", label: "관리자 계정", icon: ShieldCheck },
];

const AdminContext = createContext<AdminAccount | null>(null);

/** The signed-in admin. Only usable inside the admin pages (not /admin/login). */
export function useCurrentAdmin() {
  return useContext(AdminContext)!;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Redirects to /admin/login when there's no admin session
  const { data: admin } = useAdminQuery<AdminAccount>("/api/admin/auth/me");

  if (!admin) return <Loading />;

  const logout = async () => {
    await adminRequest("POST", "/api/admin/auth/logout");
    window.location.href = "/admin/login";
  };

  return (
    <AdminContext.Provider value={admin}>
      <div className="flex min-h-screen bg-[#f6f6f6] text-ink">
        <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-hairline bg-white md:flex">
          <Link href="/admin" className="px-[24px] py-[22px] text-[15px] font-bold tracking-[0.05em]">
            MIYAO WORLD
            <span className="ml-[6px] text-[12px] font-normal text-ink-muted">ADMIN</span>
          </Link>
          <nav className="flex-1 space-y-[2px] px-[12px]">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-[10px] rounded-[4px] px-[12px] py-[9px] text-[13.5px]",
                    active ? "bg-ink text-white" : "text-ink-soft hover:bg-[#f2f2f2]",
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-[8px] border-t border-hairline px-[24px] py-[14px] text-[12.5px] text-ink-muted hover:text-ink"
          >
            <ExternalLink size={14} />
            쇼핑몰 보기
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[56px] items-center justify-between gap-[12px] border-b border-hairline bg-white px-[24px]">
            {/* Narrow screens: the side nav collapses into a scrolling row */}
            <nav className="flex gap-[14px] overflow-x-auto text-[13px] md:hidden">
              {nav.map(({ href, label }) => (
                <Link key={href} href={href} className="whitespace-nowrap">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-[14px] text-[13px]">
              <span className="hidden text-ink-soft sm:inline">
                {admin.name} ({admin.email})
              </span>
              <button type="button" onClick={logout} className="flex items-center gap-[5px] hover:opacity-60">
                <LogOut size={14} />
                로그아웃
              </button>
            </div>
          </header>
          <main className="p-[24px]">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return children;
  return <AdminFrame>{children}</AdminFrame>;
}
