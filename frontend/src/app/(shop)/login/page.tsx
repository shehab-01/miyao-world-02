import PageTitle from "@/components/common/PageTitle";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "LOGIN | MIYAO WORLD",
};

export default function LoginPage() {
  return (
    <>
      <PageTitle>Login</PageTitle>
      <div className="mt-[80px]">
        <LoginForm />
      </div>
    </>
  );
}
