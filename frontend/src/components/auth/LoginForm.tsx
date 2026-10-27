"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Key, Lock, Search, User } from "lucide-react";
import SocialButtons from "@/components/auth/SocialButtons";
import { login } from "@/lib/auth";

// ?error= codes set by the backend's Kakao / Naver callback
const socialErrors: Record<string, string> = {
  cancelled: "로그인이 취소되었습니다.",
  expired: "로그인 시간이 만료되었습니다. 다시 시도해 주세요.",
  failed: "소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  inactive: "이용이 제한된 계정입니다. 고객센터로 문의해 주세요.",
  not_configured: "소셜 로그인 준비 중입니다. 아이디로 로그인해 주세요.",
};

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-[30px] items-center border border-hairline">
      <span className="flex h-full w-[52px] shrink-0 items-center justify-center border-r border-hairline">
        {icon}
      </span>
      <input
        type={type}
        aria-label={placeholder}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : "username"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full px-[14px] text-[12.5px] tracking-[0.05em] outline-none placeholder:text-ink"
      />
    </div>
  );
}

export default function LoginForm({ errorCode, next }: { errorCode?: string; next: string }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorCode ? (socialErrors[errorCode] ?? "") : "");
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await login(loginId, password);
      router.push(next);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[528px] border border-hairline px-[24px] pt-[54px] pb-[46px] sm:px-[100px]">
        <h2 className="text-center text-[14px] leading-none tracking-[0.1em]">
          MEMBER LOGIN
        </h2>

        <form onSubmit={signIn} noValidate>
          <div className="mt-[64px] space-y-[5px]">
            <Field
              icon={<User size={13} fill="currentColor" strokeWidth={0} />}
              type="text"
              placeholder="ID"
              value={loginId}
              onChange={setLoginId}
            />
            <Field
              icon={<Lock size={13} fill="currentColor" strokeWidth={0} />}
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={setPassword}
            />
          </div>

          <p className="mt-[13px] flex items-center gap-[5px] text-[12px]">
            <Lock size={12} strokeWidth={2} className="text-[#e8643c]" />
            보안접속
          </p>

          {error && (
            <p role="alert" className="mt-[10px] text-[12.5px] text-[#f0736b]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-[13px] w-full bg-ink py-[13px] text-[13px] leading-none tracking-[0.1em] text-white hover:opacity-85 disabled:opacity-50"
          >
            LOGIN
          </button>
        </form>

        <div className="mt-[10px]">
          <SocialButtons action="로그인" next={next} />
        </div>

        <div className="mt-[24px] flex items-start justify-between gap-[16px]">
          <p className="text-[12.5px] leading-[1.3]">
            회원가입을 하시면 다양하고 특별한
            <br />
            혜택이 준비되어 있습니다.
          </p>
          <Link
            href="/join"
            className="shrink-0 border border-hairline px-[18px] py-[8px] text-[12.5px] leading-none hover:bg-muted"
          >
            회원가입
          </Link>
        </div>

        <hr className="mt-[24px] border-hairline" />

        <div className="mt-[22px] flex items-center justify-between text-[12.5px]">
          <span>MEMBER SEARCH</span>
          <Link href="/find-id" className="flex items-center gap-[5px] hover:opacity-60">
            <Search size={12} strokeWidth={2} />
            아이디찾기
          </Link>
          <Link
            href="/find-password"
            className="flex items-center gap-[5px] hover:opacity-60"
          >
            <Key size={12} strokeWidth={2} />
            비밀번호찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
