import Logo from "@/components/common/Logo";
import SiteNav from "@/components/layout/SiteNav";
import type { Category } from "@/lib/catalog";

export default function Sidebar({ categories }: { categories: Category[] }) {
  return (
    // Stays put while the page scrolls; scrolls on its own only if the window is shorter than the menu
    <aside
      className="hidden shrink-0 pt-[50px] pb-20 [scrollbar-width:none] lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-y-auto [&::-webkit-scrollbar]:hidden"
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
