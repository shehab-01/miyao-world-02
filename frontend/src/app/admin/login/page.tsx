"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorText, Field, inputClass } from "@/components/admin/ui";
import { adminRequest } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await adminRequest("POST", "/api/admin/auth/login", { email, password });
      router.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f6] px-[16px]">
      <form
        onSubmit={submit}
        className="w-full max-w-[360px] space-y-[16px] rounded-[6px] border border-hairline bg-white p-[32px]"
      >
        <h1 className="text-center text-[16px] font-bold tracking-[0.05em]">
          MIYAO WORLD <span className="font-normal text-ink-muted">ADMIN</span>
        </h1>
        <Field label="이메일">
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="비밀번호">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={submitting} className="w-full">
          로그인
        </Button>
      </form>
    </div>
  );
}
