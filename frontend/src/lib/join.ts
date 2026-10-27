// Validation and payloads shared by the ID/password join and the social join.
// Rules mirror backend/app/schemas/auth.py.
import { requiredAgreementIds } from "@/lib/site-config";

export type FormValues = Record<string, string>;
export type Checks = Record<string, boolean>;

export const loginIdPattern = /^[a-z0-9]{4,16}$/;

export function isValidPassword(password: string) {
  const kinds = [/[A-Za-z]/, /\d/, /[^A-Za-z\d\s]/].filter((re) => re.test(password)).length;
  return password.length >= 10 && password.length <= 16 && kinds >= 2 && !/\s/.test(password);
}

/** "010-1234-5678", null when left empty, undefined when partly filled. */
export function mobileValue(values: FormValues) {
  const [first, middle, last] = [values.mobile1 ?? "010", values.mobile2 ?? "", values.mobile3 ?? ""];
  if (!middle && !last) return null;
  return /^\d{3,4}$/.test(middle) && /^\d{4}$/.test(last) ? `${first}-${middle}-${last}` : undefined;
}

export function mobileFields(mobile: string | null): FormValues {
  const [mobile1 = "010", mobile2 = "", mobile3 = ""] = mobile?.split("-") ?? [];
  return { mobile1, mobile2, mobile3 };
}

export function profileError(values: FormValues, checks: Checks) {
  if (!values.name?.trim()) return "이름을 입력해 주세요.";
  if (mobileValue(values) === undefined) return "휴대전화 번호를 정확히 입력해 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim() ?? "")) {
    return "이메일을 정확히 입력해 주세요.";
  }
  if (!requiredAgreementIds.every((id) => checks[id])) return "필수 약관에 모두 동의해 주세요.";
  return null;
}

export function profilePayload(values: FormValues, checks: Checks) {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    mobile: mobileValue(values) ?? null,
    agree_terms: Boolean(checks.service),
    agree_privacy: Boolean(checks.privacy),
    is_over_14: Boolean(checks.over14),
    agree_sms: Boolean(checks.sms),
    agree_email: Boolean(checks.newsMail),
  };
}
