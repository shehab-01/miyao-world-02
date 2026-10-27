import PageTitle from "@/components/common/PageTitle";
import { ResetPasswordForm } from "@/components/auth/AccountSearch";

export const metadata = {
  title: "RESET PASSWORD | MIYAO WORLD",
  // The URL carries a one-time token
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <PageTitle>Reset Password</PageTitle>
      <div className="mt-[80px]">
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </>
  );
}
