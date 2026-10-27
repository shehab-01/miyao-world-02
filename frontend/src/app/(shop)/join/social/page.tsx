import PageTitle from "@/components/common/PageTitle";
import SocialJoinForm from "@/components/auth/SocialJoinForm";

export const metadata = {
  title: "JOIN | MIYAO WORLD",
};

export default function SocialJoinPage() {
  return (
    <>
      <PageTitle>Join</PageTitle>
      <div className="mt-[80px]">
        <SocialJoinForm />
      </div>
    </>
  );
}
