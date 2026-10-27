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
  // Only same-site paths, so ?next= can't send people to another site. Resolved the
  // way the browser will (it reads "/\evil.com" as "//evil.com"), then checked.
  const resolved = new URL(next ?? "/", "http://same.site");
  const safeNext = resolved.origin === "http://same.site" ? resolved.pathname + resolved.search + resolved.hash : "/";

  return (
    <>
      <PageTitle>Login</PageTitle>
      <div className="mt-[80px]">
        <LoginForm errorCode={error} next={safeNext} />
      </div>
    </>
  );
}
