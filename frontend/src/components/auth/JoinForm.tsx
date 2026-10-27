"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JoinAgreements from "@/components/auth/JoinAgreements";
import JoinFields, { type FieldNote } from "@/components/auth/JoinFields";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";
import { register } from "@/lib/auth";
import {
  isValidPassword,
  loginIdPattern,
  profileError,
  profilePayload,
  type Checks,
  type FormValues,
} from "@/lib/join";

export default function JoinForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({});
  const [checked, setChecked] = useState<Checks>({});
  const [notes, setNotes] = useState<Record<string, FieldNote | undefined>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkLoginId = async (loginId: string) => {
    if (!loginId) return setNotes((n) => ({ ...n, memberId: undefined }));
    if (!loginIdPattern.test(loginId)) {
      return setNotes((n) => ({
        ...n,
        memberId: { text: "아이디는 영문소문자 또는 숫자 4~16자로 입력해 주세요.", ok: false },
      }));
    }
    try {
      const { available } = await apiFetch<{ available: boolean }>(
        `/api/auth/login-id-available?login_id=${loginId}`,
      );
      setNotes((n) => ({
        ...n,
        memberId: available
          ? { text: `${loginId}는 사용 가능한 아이디입니다.`, ok: true }
          : { text: `${loginId}는 이미 사용중인 아이디입니다.`, ok: false },
      }));
    } catch {
      // The server re-checks on submit
    }
  };

  const validate = () => {
    if (!loginIdPattern.test(values.memberId ?? "")) {
      return "아이디는 영문소문자 또는 숫자 4~16자로 입력해 주세요.";
    }
    if (!isValidPassword(values.password ?? "")) {
      return "비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10~16자로 입력해 주세요.";
    }
    if (values.password !== values.passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    return profileError(values, checked);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem ?? "");
    if (problem) return;

    setSubmitting(true);
    try {
      await register({
        login_id: values.memberId,
        password: values.password,
        ...profilePayload(values, checked),
      });
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <JoinFields
        values={values}
        notes={notes}
        onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))}
        onBlur={(id) => id === "memberId" && checkLoginId(values.memberId ?? "")}
      />

      <div className="mt-[60px]">
        <JoinAgreements checked={checked} onChange={setChecked} />
      </div>

      <SubmitButton error={error} submitting={submitting}>
        회원가입
      </SubmitButton>
    </form>
  );
}
