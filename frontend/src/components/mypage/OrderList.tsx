"use client";

import { useEffect, useState } from "react";
import OrderHistory from "@/components/mypage/OrderHistory";
import { useRequireLogin } from "@/lib/auth";
import { getOrders, type Order } from "@/lib/shop";

export default function OrderList() {
  const user = useRequireLogin();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (user) getOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  return user ? <OrderHistory title="주문내역" orders={orders} /> : null;
}
