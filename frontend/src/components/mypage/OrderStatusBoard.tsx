import { ChevronRight } from "lucide-react";
import { orderStatusNames, type OrderStatus } from "@/lib/shop";

const flow: OrderStatus[] = ["pending_payment", "preparing", "shipping", "delivered"];
const extra: OrderStatus[] = ["cancelled", "exchanged", "returned"];

function StatusCell({ status, count }: { status: OrderStatus; count: number | undefined }) {
  return (
    <div className="text-center">
      <p className="text-[12.5px] text-ink-muted">{orderStatusNames[status]}</p>
      <p className="mt-[8px] text-[20px] leading-none">{count ?? "-"}</p>
    </div>
  );
}

export default function OrderStatusBoard({ counts }: { counts: Record<OrderStatus, number> | null }) {
  return (
    <section>
      <h2 className="text-[14px] text-ink-soft">주문처리 현황</h2>

      <div className="mt-[14px] flex flex-wrap items-center gap-y-[24px] border border-hairline px-[40px] py-[28px]">
        {flow.map((status, index) => (
          <div key={status} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                size={16}
                strokeWidth={1.4}
                className="mx-[28px] text-ink-faint"
                aria-hidden
              />
            )}
            <StatusCell status={status} count={counts?.[status]} />
          </div>
        ))}

        <div className="ml-auto flex items-center gap-[40px] border-l border-hairline pl-[40px]">
          {extra.map((status) => (
            <StatusCell key={status} status={status} count={counts?.[status]} />
          ))}
        </div>
      </div>
    </section>
  );
}
