import Logo from "@/components/common/Logo";
import SiteNav from "@/components/layout/SiteNav";
import type { Category } from "@/lib/catalog";

export default function Sidebar({ categories }: { categories: Category[] }) {
  return (
    <aside
      className="hidden shrink-0 pt-[50px] pb-20 lg:block"
      style={{ width: "var(--sidebar-width)", paddingLeft: "var(--sidebar-gutter)" }}
    >
      <div style={{ width: "var(--sidebar-column)" }}>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-[60px]">
          <SiteNav categories={categories} />
        </div>
      </div>
    </aside>
  );
}
