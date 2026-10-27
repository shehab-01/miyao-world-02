import PageTitle from "@/components/common/PageTitle";
import WishlistView from "@/components/mypage/WishlistView";

export const metadata = {
  title: "WISH LIST | MIYAO WORLD",
};

export default function WishlistPage() {
  return (
    <>
      <PageTitle>Wish List</PageTitle>
      <WishlistView />
    </>
  );
}
