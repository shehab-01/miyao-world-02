"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Search, Twitter } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Category } from "@/lib/catalog";
import { bankAccountInfo, secondaryNav, socialLinks, utilityNav, type NavItem } from "@/lib/site-config";

// Pages a link stands for besides its own: /order redirects to the order history
const alsoMatches: Record<string, string[]> = { "/order": ["/mypage/orders"] };

/** The href of the link for the current page: the longest one the path is in, so EDIT wins over MYPAGE. */
function activeHref(pathname: string, hrefs: string[]) {
  let best: string | null = null;
  let bestLength = 0;
  for (const href of hrefs) {
    for (const path of [href, ...(alsoMatches[href] ?? [])]) {
      const matches = pathname === path || pathname.startsWith(`${path}/`);
      if (matches && path.length > bestLength) {
        best = href;
        bestLength = path.length;
      }
    }
  }
  return best;
}

export default function SiteNav({
  categories,
  onNavigate,
}: {
  categories: Category[];
  onNavigate?: () => void;
}) {
  const { isLoggedIn, logout } = useAuth();
  const pathname = usePathname();
  const utilityRows = utilityNav[isLoggedIn ? "member" : "guest"];
  const activeUtility = activeHref(
    pathname,
    utilityRows.flat().filter((item) => !item.action).map((item) => item.href),
  );
  const activeCategory = activeHref(pathname, categories.map((category) => `/shop/${category.slug}`));
  // SHOP's submenu lists the categories managed in /admin/categories
  const primaryNav: NavItem[] = [
    {
      label: "SHOP",
      href: categories[0] ? `/shop/${categories[0].slug}` : "/",
      children: categories.map((category) => ({
        label: category.name,
        href: `/shop/${category.slug}`,
      })),
    },
  ];

  return (
    <>
      <div className="space-y-[11px] text-[12px] leading-none tracking-[0.05em] text-ink-muted">
        {utilityRows.map((row, i) => (
          <div key={i} className="flex gap-[6px]">
            {row.map((item, j) => (
              <span key={item.label} className="flex gap-[6px]">
                {j > 0 && <span aria-hidden>/</span>}
                {item.action === "logout" ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onNavigate?.();
                    }}
                    className="text-[length:inherit] leading-[inherit] tracking-[inherit] hover:text-ink"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={item.href === activeUtility ? "page" : undefined}
                    className={`hover:text-ink ${item.href === activeUtility ? "text-ink" : ""}`}
                  >
                    {item.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>

      <nav className="mt-[57px]">
        <ul className="space-y-[17px]">
          {primaryNav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block text-[12px] leading-none tracking-[0.05em] text-ink hover:opacity-60"
              >
                {item.label}
              </Link>
              {item.children && (
                <ul className="mt-[14px] space-y-[12px] pl-[7px]">
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={child.href === activeCategory ? "page" : undefined}
                        className={`block text-[12px] leading-none hover:text-ink ${
                          child.href === activeCategory ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <ul className="mt-[50px] space-y-[17px]">
          {/* No BANK ACCOUNT page while the account is hidden */}
          {secondaryNav.filter((item) => item.href !== "/bank-account" || bankAccountInfo.shown).map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block text-[12px] leading-none tracking-[0.05em] text-ink hover:opacity-60"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form
        role="search"
        className="mt-[50px] flex items-center gap-2 border-b border-ink pb-[6px]"
      >
        <input
          type="search"
          aria-label="Search"
          className="w-full bg-transparent text-[12px] outline-none"
        />
        <button type="submit" aria-label="Search" className="shrink-0">
          <Search size={14} strokeWidth={1.5} className="text-ink-soft" />
        </button>
      </form>

      <ul className="mt-[26px] flex items-center gap-[14px]">
        {socialLinks.map((item) => (
          <li key={item.label}>
            <Link href={item.href} aria-label={item.label} onClick={onNavigate}>
              {item.label === "Facebook" && (
                <Facebook size={14} fill="currentColor" strokeWidth={0} />
              )}
              {item.label === "Twitter" && (
                <Twitter size={14} fill="currentColor" strokeWidth={0} />
              )}
              {item.label === "Instagram" && <Instagram size={14} strokeWidth={1.6} />}
              {item.label === "Blog" && (
                <span className="font-serif text-[15px] leading-none">B</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
