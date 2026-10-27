"use client";

import { useSyncExternalStore } from "react";
import { apiFetch, apiPost } from "@/lib/api";

export type SocialProvider = "kakao" | "naver";

export type User = {
  id: number;
  login_id: string | null;
  name: string;
  email: string;
  mobile: string | null;
  mileage: number;
  providers: SocialProvider[];
};

type AuthState = { user: User | null; loaded: boolean };

const initialState: AuthState = { user: null, loaded: false };
let state = initialState;
let listeners: (() => void)[] = [];
let started = false;

function setUser(user: User | null) {
  state = { user, loaded: true };
  listeners.forEach((notify) => notify());
}

export async function refreshAuth() {
  try {
    // null for guests
    setUser(await apiFetch<User | null>("/api/auth/me", { cache: "no-store" }));
  } catch {
    setUser(null);
  }
}

function subscribe(notify: () => void) {
  listeners.push(notify);
  if (!started) {
    started = true;
    void refreshAuth();
  }
  return () => {
    listeners = listeners.filter((l) => l !== notify);
  };
}

export async function login(loginId: string, password: string) {
  setUser(await apiPost<User>("/api/auth/login", { login_id: loginId, password }));
}

export async function register(payload: Record<string, unknown>) {
  setUser(await apiPost<User>("/api/auth/register", payload));
}

export async function completeSocialSignup(payload: Record<string, unknown>) {
  setUser(await apiPost<User>("/api/auth/social/complete", payload));
}

async function logout() {
  await apiPost("/api/auth/logout");
  setUser(null);
}

export function useAuth() {
  const { user, loaded } = useSyncExternalStore(subscribe, () => state, () => initialState);

  return { user, loaded, isLoggedIn: user !== null, logout };
}
