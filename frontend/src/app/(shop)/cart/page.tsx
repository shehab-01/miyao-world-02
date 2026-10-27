import PageTitle from "@/components/common/PageTitle";
import CartGuide from "@/components/cart/CartGuide";
import CartView from "@/components/cart/CartView";

export const metadata = {
  title: "SHOPPING BAG | MIYAO WORLD",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ delvtype?: string }>;
}) {
  const { delvtype } = await searchParams;

  return (
    <div className="lg:max-w-[950px]">
      <PageTitle>Shopping Bag</PageTitle>

      <CartView oversea={delvtype === "B"} />

      <div className="mt-[66px]">
        <CartGuide />
      </div>
    </div>
  );
}
