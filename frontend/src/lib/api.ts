// In the browser, /api/* goes through the Next.js rewrite in next.config.ts
// (same origin, so the session cookie just works). Server code inside the
// frontend container calls the backend directly.
const baseUrl =
  typeof window === "undefined"
    ? (process.env.API_URL_INTERNAL ?? "http://localhost:8000")
    : "";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type ErrorBody = { detail?: string | { msg: string; loc?: (string | number)[] }[] };

function errorMessage(body: ErrorBody | null) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: show the first one
  if (Array.isArray(detail) && detail[0]) {
    if (detail[0].loc?.includes("email")) return "이메일 주소를 정확히 입력해 주세요.";
    return detail[0].msg.replace(/^Value error, /, "");
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      // FormData bodies (file uploads) set their own multipart content type
      ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(errorMessage(body), response.status);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
