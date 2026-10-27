"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JoinAgreements from "@/components/auth/JoinAgreements";
import JoinFields from "@/components/auth/JoinFields";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";
import { completeSocialSignup, type SocialProvider } from "@/lib/auth";
import {
  mobileFields,
  profileError,
  profilePayload,
  type Checks,
  type FormValues,
} from "@/lib/join";
import { joinFields, socialProviders } from "@/lib/site-config";

type Pending = {
  provider: SocialProvider;
  name: string | null;
  email: string | null;
  mobile: string | null;
};

// Social members sign in with Kakao / Naver, so no id or password here
const fields = joinFields.filter((field) => ["name", "mobile", "email"].includes(field.id));

export default function SocialJoinForm() {
  const router = useRouter();
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [checked, setChecked] = useState<Checks>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Pending>("/api/auth/social/pending")
      .then((pending) => {
        setProvider(pending.provider);
        setValues({
          name: pending.name ?? "",
          email: pending.email ?? "",
          ...mobileFields(pending.mobile),
        });
      })
      // No (or an expired) Kakao / Naver sign-in to finish
      .catch(() => router.replace("/login?error=expired"));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = profileError(values, checked);
    setError(problem ?? "");
    if (problem) return;

    setSubmitting(true);
    try {
      await completeSocialSignup(profilePayload(values, checked));
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  if (!provider) return null;
  const providerName = socialProviders.find((p) => p.id === provider)?.name;

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-[24px] text-[13px] leading-[1.8]">
        {providerName} 계정으로 회원가입을 진행합니다.
        <br />
        아래 정보를 확인하시고 약관에 동의해 주세요.
      </p>

      <JoinFields
        fields={fields}
        values={values}
        onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))}
      />

      <div className="mt-[60px]">
        <JoinAgreements checked={checked} onChange={setChecked} />
      </div>

      <SubmitButton error={error} submitting={submitting}>
        가입하기
      </SubmitButton>
    </form>
  );
}
