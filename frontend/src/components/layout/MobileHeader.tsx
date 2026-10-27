"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/common/Logo";
import SiteNav from "@/components/layout/SiteNav";
import type { Category } from "@/lib/catalog";

export default function MobileHeader({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background lg:hidden">
      <div className="flex items-center justify-between px-[20px] py-[14px]">
        <Logo className="w-[85px]" />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} strokeWidth={1.4} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto bg-background px-[24px] pt-[20px] pb-20">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} strokeWidth={1.4} />
              </button>
            </div>
            <div className="mt-[20px]">
              <SiteNav categories={categories} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
