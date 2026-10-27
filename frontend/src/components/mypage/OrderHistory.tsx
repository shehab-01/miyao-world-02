import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { formatDate, orderStatusNames, type Order } from "@/lib/shop";

const headers = ["주문일자 [주문번호]", "이미지", "상품정보", "수량", "상품구매금액", "주문처리상태"];

export default function OrderHistory({ title, orders }: { title: string; orders: Order[] | null }) {
  return (
    <section>
      <h2 className="text-[14px] text-ink-soft">{title}</h2>

      {orders === null || orders.length === 0 ? (
        <div className="mt-[14px] border-y border-hairline">
          <p className="py-[40px] text-center text-[13px] text-ink-muted">
            {orders === null ? "불러오는 중…" : "주문 내역이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="mt-[14px] overflow-x-auto">
          <table className="w-full min-w-[860px] border-t border-ink text-[12.5px]">
            <colgroup>
              <col style={{ width: "170px" }} />
              <col style={{ width: "92px" }} />
              <col />
              <col style={{ width: "75px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
            </colgroup>

            <thead>
              <tr className="border-b border-hairline text-ink-soft">
                {headers.map((header) => (
                  <th key={header} scope="col" className="py-[12px] font-normal">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {orders.flatMap((order) =>
                order.items.map((item, index) => (
                  <tr
                    key={`${order.order_number}-${index}`}
                    className="border-b border-hairline text-center align-middle"
                  >
                    {/* One order, several items: the order cells span its rows */}
                    {index === 0 && (
                      <td rowSpan={order.items.length} className="border-r border-hairline py-[16px]">
                        {formatDate(order.created_at)}
                        <br />
                        <Link
                          href={`/mypage/orders/${order.order_number}`}
                          className="text-ink-muted underline-offset-2 hover:underline"
                        >
                          [{order.order_number}]
                        </Link>
                      </td>
                    )}

                    <td className="py-[16px]">
                      <Link href={`/mypage/orders/${order.order_number}`} className="block px-[10px]">
                        <span
                          className="relative block overflow-hidden bg-placeholder"
                          style={{ aspectRatio: "0.8" }}
                        >
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              unoptimized
                              sizes="72px"
                              className="object-cover"
                            />
                          )}
                        </span>
                      </Link>
                    </td>

                    <td className="py-[16px] pr-[16px] text-left">
                      {item.product_slug ? (
                        <Link href={`/product/${item.product_slug}`} className="hover:opacity-60">
                          {item.product_name}
                        </Link>
                      ) : (
                        item.product_name
                      )}
                      {item.option_label && (
                        <p className="mt-[6px] text-ink-muted">[옵션: {item.option_label}]</p>
                      )}
                    </td>

                    <td className="py-[16px]">{item.quantity}</td>

                    <td className="py-[16px]">
                      {formatPrice(item.unit_price * item.quantity)}
                    </td>

                    {index === 0 && (
                      <td rowSpan={order.items.length} className="border-l border-hairline py-[16px]">
                        {orderStatusNames[order.status]}
                      </td>
                    )}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
