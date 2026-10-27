import OrderList from "@/components/admin/OrderList";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return <OrderList initialStatus={status} />;
}
