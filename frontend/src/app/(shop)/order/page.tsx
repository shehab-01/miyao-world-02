import { redirect } from "next/navigation";

// The ORDER link in the site menu: a member's order history
export default function OrderPage() {
  redirect("/mypage/orders");
}
