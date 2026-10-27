import PageTitle from "@/components/common/PageTitle";
import CheckoutForm from "@/components/order/CheckoutForm";
import { parseCheckoutItems } from "@/lib/shop";

export const metadata = {
  title: "ORDER | MIYAO WORLD",
  robots: { index: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string; from?: string }>;
}) {
  const { items, from } = await searchParams;

  return (
    <div className="lg:max-w-[950px]">
      <PageTitle>Order</PageTitle>
      <CheckoutForm items={parseCheckoutItems(items)} fromCart={from === "cart"} />
    </div>
  );
}
