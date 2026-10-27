"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";

export type Page<T> = { items: T[]; total: number };

export type AdminAccount = {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type OrderStatus =
  | "pending_payment"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "exchanged"
  | "returned";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "입금전",
  preparing: "배송준비중",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
  exchanged: "교환",
  returned: "반품",
};

export const orderStatuses = Object.keys(orderStatusLabels) as OrderStatus[];

export const ADMIN_PAGE_SIZE = 20;

function toLogin() {
  window.location.href = "/admin/login";
}

/** GET an admin endpoint; re-runs when `path` changes or `reload()` is called. */
export function useAdminQuery<T>(path: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetch<T>(path, { cache: "no-store" })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) router.replace("/admin/login");
        else setError((err as Error).message);
      });
    return () => {
      active = false;
    };
  }, [path, version, router]);

  return { data, error, setData, reload: () => setVersion((v) => v + 1) };
}

/** POST/PUT/PATCH/DELETE an admin endpoint. Sends the user to the login page if the session expired. */
export async function adminRequest<T = void>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  try {
    return await apiFetch<T>(path, {
      method,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && path !== "/api/admin/auth/login") toLogin();
    throw err;
  }
}

export function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(value: string | null) {
  return value ? formatDateTime(value).slice(0, 12) : "-";
}

export function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}
