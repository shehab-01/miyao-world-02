import PageTitle from "@/components/common/PageTitle";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "LOGIN | MIYAO WORLD",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  // Only same-site paths, so ?next= can't send people to another site
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <>
      <PageTitle>Login</PageTitle>
      <div className="mt-[80px]">
        <LoginForm errorCode={error} next={safeNext} />
      </div>
    </>
  );
}
