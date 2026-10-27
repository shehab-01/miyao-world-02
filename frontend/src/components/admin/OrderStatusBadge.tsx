import { Badge } from "@/components/admin/ui";
import { orderStatusLabels, type OrderStatus } from "@/lib/admin";

const tones = {
  pending_payment: "amber",
  preparing: "blue",
  shipping: "blue",
  delivered: "green",
  cancelled: "neutral",
  exchanged: "red",
  returned: "red",
} as const;

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={tones[status]}>{orderStatusLabels[status]}</Badge>;
}
