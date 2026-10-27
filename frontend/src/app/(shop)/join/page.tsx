import PageTitle from "@/components/common/PageTitle";
import JoinFields from "@/components/auth/JoinFields";
import JoinAgreements from "@/components/auth/JoinAgreements";

export const metadata = {
  title: "JOIN | MIYAO WORLD",
};

export default function JoinPage() {
  return (
    <>
      <PageTitle>Join</PageTitle>

      <div className="mt-[80px]">
        <JoinFields />
      </div>

      <div className="mt-[60px]">
        <JoinAgreements />
      </div>

      <div className="mt-[40px] flex justify-center">
        <button
          type="button"
          className="w-[150px] bg-ink py-[11px] text-[13px] leading-none text-white hover:opacity-85"
        >
          회원가입
        </button>
      </div>
    </>
  );
}
