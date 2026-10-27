import PageTitle from "@/components/common/PageTitle";
import JoinForm from "@/components/auth/JoinForm";
import SocialButtons from "@/components/auth/SocialButtons";

export const metadata = {
  title: "JOIN | MIYAO WORLD",
};

export default function JoinPage() {
  return (
    <>
      <PageTitle>Join</PageTitle>

      <section className="mx-auto mt-[80px] max-w-[328px]">
        <h2 className="text-center text-[13px]">SNS 계정으로 간편하게 가입하기</h2>
        <div className="mt-[16px]">
          <SocialButtons action="로 시작하기" />
        </div>
      </section>

      <div className="mt-[60px]">
        <JoinForm />
      </div>
    </>
  );
}
