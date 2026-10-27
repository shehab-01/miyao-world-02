"use client";

// 아이디 찾기 / 비밀번호 찾기 / 비밀번호 재설정 forms

import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { isValidPassword } from "@/lib/join";

const PROVIDER_NAMES = { kakao: "카카오", naver: "네이버" } as const;

const inputClass = "h-[34px] w-full border border-hairline px-[12px] text-[12.5px] outline-none focus:border-ink-muted";
const buttonClass =
  "mt-[16px] w-full bg-ink py-[13px] text-[13px] leading-none tracking-[0.1em] text-white hover:opacity-85 disabled:opacity-50";
const linkButtonClass =
  "flex-1 border border-hairline py-[11px] text-center text-[12.5px] leading-none hover:bg-muted";

function Box({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[528px] border border-hairline px-[24px] pt-[54px] pb-[46px] sm:px-[100px]">
        <h2 className="text-center text-[14px] leading-none tracking-[0.1em]">{title}</h2>
        <p className="mt-[20px] text-center text-[12.5px] leading-[1.6] text-ink-muted">{intro}</p>
        <div className="mt-[36px]">{children}</div>
      </div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block text-[12.5px]">
      <span className="mb-[6px] block">{label}</span>
      <input type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

function ErrorLine({ children }: { children: string }) {
  return children ? (
    <p role="alert" className="mt-[12px] text-[12.5px] text-[#f0736b]">
      {children}
    </p>
  ) : null;
}

/** Runs a submit handler with the shared submitting / error state. */
function useSubmit() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setError("");
    setSubmitting(true);
    try {
      await action();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  return { error, setError, submitting, run };
}

type FoundAccount = { login_id: string | null; providers: ("kakao" | "naver")[]; created_at: string };

export function FindIdForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<FoundAccount | null>(null);
  const { error, setError, submitting, run } = useSubmit();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return setError("이름과 이메일을 입력해 주세요.");
    run(async () => setFound(await apiPost<FoundAccount>("/api/auth/find-id", { name, email })));
  };

  if (found) {
    const joined = new Date(found.created_at).toLocaleDateString("ko-KR");
    return (
      <Box title="FIND ID" intro="회원님의 정보와 일치하는 계정입니다.">
        <div className="border-y border-hairline py-[24px] text-center text-[13px] leading-[1.8]">
          {found.login_id ? (
            <>
              <p>
                아이디 <strong className="text-[15px] tracking-[0.05em]">{found.login_id}</strong>
              </p>
              <p className="text-ink-muted">가입일 {joined}</p>
              <p className="mt-[10px] text-[12px] text-ink-muted">전체 아이디를 가입하신 이메일로 보내드렸습니다.</p>
            </>
          ) : (
            <>
              <p>{found.providers.map((p) => PROVIDER_NAMES[p]).join(", ")} 계정으로 가입한 회원입니다.</p>
              <p className="text-ink-muted">가입일 {joined} · 로그인 화면에서 해당 버튼으로 로그인해 주세요.</p>
            </>
          )}
        </div>
        <div className="mt-[20px] flex gap-[6px]">
          <Link href="/login" className={linkButtonClass}>
            로그인
          </Link>
          {found.login_id && (
            <Link href="/find-password" className={linkButtonClass}>
              비밀번호 찾기
            </Link>
          )}
        </div>
      </Box>
    );
  }

  return (
    <Box title="FIND ID" intro="가입하실 때 입력한 이름과 이메일을 입력해 주세요.">
      <form onSubmit={submit} noValidate className="space-y-[14px]">
        <Input label="이름" value={name} onChange={setName} autoComplete="name" />
        <Input label="이메일" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <ErrorLine>{error}</ErrorLine>
        <button type="submit" disabled={submitting} className={buttonClass}>
          아이디 찾기
        </button>
      </form>
    </Box>
  );
}

export function FindPasswordForm() {
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { error, setError, submitting, run } = useSubmit();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !email.trim()) return setError("아이디와 이메일을 입력해 주세요.");
    run(async () => {
      await apiPost("/api/auth/password-reset", { login_id: loginId, email });
      setSent(true);
    });
  };

  if (sent) {
    return (
      <Box title="FIND PASSWORD" intro="메일을 확인해 주세요.">
        <p className="border-y border-hairline py-[24px] text-center text-[13px] leading-[1.8]">
          입력하신 정보와 일치하는 계정이 있으면
          <br />
          비밀번호 재설정 링크를 이메일로 보내드렸습니다.
          <br />
          <span className="text-[12px] text-ink-muted">링크는 30분 동안 유효합니다. 메일이 없다면 스팸함도 확인해 주세요.</span>
        </p>
        <div className="mt-[20px] flex">
          <Link href="/login" className={linkButtonClass}>
            로그인
          </Link>
        </div>
      </Box>
    );
  }

  return (
    <Box title="FIND PASSWORD" intro="아이디와 가입하실 때 입력한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.">
      <form onSubmit={submit} noValidate className="space-y-[14px]">
        <Input label="아이디" value={loginId} onChange={setLoginId} autoComplete="username" />
        <Input label="이메일" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <ErrorLine>{error}</ErrorLine>
        <button type="submit" disabled={submitting} className={buttonClass}>
          재설정 메일 받기
        </button>
        <p className="text-center text-[12px] text-ink-muted">
          카카오·네이버로 가입한 회원은 비밀번호가 없습니다. 로그인 화면에서 해당 버튼으로 로그인해 주세요.
        </p>
      </form>
    </Box>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const { error, setError, submitting, run } = useSubmit();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword(password)) {
      return setError("비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10~16자로 입력해 주세요.");
    }
    if (password !== confirm) return setError("비밀번호가 일치하지 않습니다.");
    run(async () => {
      await apiPost("/api/auth/password-reset/confirm", { token, password });
      setDone(true);
    });
  };

  if (!token || done) {
    return (
      <Box
        title="RESET PASSWORD"
        intro={done ? "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요." : "링크가 올바르지 않습니다. 비밀번호 찾기를 다시 진행해 주세요."}
      >
        <div className="flex">
          <Link href={done ? "/login" : "/find-password"} className={linkButtonClass}>
            {done ? "로그인" : "비밀번호 찾기"}
          </Link>
        </div>
      </Box>
    );
  }

  return (
    <Box title="RESET PASSWORD" intro="새 비밀번호를 입력해 주세요. 변경하면 다른 기기에서는 자동으로 로그아웃됩니다.">
      <form onSubmit={submit} noValidate className="space-y-[14px]">
        <Input label="새 비밀번호" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Input label="새 비밀번호 확인" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <p className="text-[12px] text-ink-muted">영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10~16자</p>
        <ErrorLine>{error}</ErrorLine>
        <button type="submit" disabled={submitting} className={buttonClass}>
          비밀번호 변경
        </button>
      </form>
    </Box>
  );
}
