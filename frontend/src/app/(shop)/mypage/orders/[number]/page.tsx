import PageTitle from "@/components/common/PageTitle";
import OrderDetail from "@/components/mypage/OrderDetail";

export const metadata = {
  title: "ORDER DETAIL | MIYAO WORLD",
  robots: { index: false },
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const [{ number }, { done }] = await Promise.all([params, searchParams]);

  return (
    <div className="lg:max-w-[950px]">
      <PageTitle>Order Detail</PageTitle>
      <OrderDetail number={number} done={done === "1"} />
    </div>
  );
}
