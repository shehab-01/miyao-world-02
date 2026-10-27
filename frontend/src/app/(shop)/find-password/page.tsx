import PageTitle from "@/components/common/PageTitle";
import { FindPasswordForm } from "@/components/auth/AccountSearch";

export const metadata = {
  title: "FIND PASSWORD | MIYAO WORLD",
};

export default function FindPasswordPage() {
  return (
    <>
      <PageTitle>Find Password</PageTitle>
      <div className="mt-[80px]">
        <FindPasswordForm />
      </div>
    </>
  );
}
