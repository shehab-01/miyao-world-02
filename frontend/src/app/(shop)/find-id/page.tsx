import PageTitle from "@/components/common/PageTitle";
import { FindIdForm } from "@/components/auth/AccountSearch";

export const metadata = {
  title: "FIND ID | MIYAO WORLD",
};

export default function FindIdPage() {
  return (
    <>
      <PageTitle>Find ID</PageTitle>
      <div className="mt-[80px]">
        <FindIdForm />
      </div>
    </>
  );
}
