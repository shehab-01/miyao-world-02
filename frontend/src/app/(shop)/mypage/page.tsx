import PageTitle from "@/components/common/PageTitle";
import MyPageView from "@/components/mypage/MyPageView";

export const metadata = {
  title: "MY PAGE | MIYAO WORLD",
};

export default function MyPage() {
  return (
    <>
      <PageTitle>My Page</PageTitle>
      <MyPageView />
    </>
  );
}
