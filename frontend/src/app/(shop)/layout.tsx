import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import Footer from "@/components/layout/Footer";
import ScrollNav from "@/components/layout/ScrollNav";
import { getCategories } from "@/lib/catalog";

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <>
      <MobileHeader categories={categories} />
      <div className="flex min-h-screen">
        <Sidebar categories={categories} />
        <div className="min-w-0 flex-1 px-[20px] pt-[20px] lg:pl-0 lg:pr-[var(--content-gutter)] lg:pt-[var(--content-top)]">
          <main>{children}</main>
          <Footer />
        </div>
      </div>
      <ScrollNav />
    </>
  );
}
