import PageTitle from "@/components/common/PageTitle";
import OrderList from "@/components/mypage/OrderList";

export const metadata = {
  title: "ORDER LIST | MIYAO WORLD",
};

export default function OrdersPage() {
  return (
    <>
      <PageTitle>Order List</PageTitle>
      <div className="mt-[80px]">
        <OrderList />
      </div>
    </>
  );
}
