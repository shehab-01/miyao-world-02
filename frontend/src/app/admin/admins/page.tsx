"use client";

import { useState } from "react";
import { useCurrentAdmin } from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Loading,
  PageHeader,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { adminRequest, formatDateTime, useAdminQuery, type AdminAccount } from "@/lib/admin";

function AddAdminForm({ onAdded }: { onAdded: () => void }) {
  const empty = { email: "", name: "", password: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return setError("비밀번호는 8자 이상으로 입력해 주세요.");
    setError("");
    try {
      await adminRequest("POST", "/api/admin/admins", form);
      setForm(empty);
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-[12px]">
      <Field label="이메일 (로그인 아이디)" required>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} required />
      </Field>
      <Field label="이름" required>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
      </Field>
      <Field label="임시 비밀번호" required hint="8자 이상. 새 관리자가 로그인 후 직접 변경하도록 안내하세요.">
        <input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} required />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="w-full">
        관리자 추가
      </Button>
    </form>
  );
}

function PasswordForm() {
  const empty = { current: "", next: "", confirm: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (form.next.length < 8) return setError("새 비밀번호는 8자 이상으로 입력해 주세요.");
    if (form.next !== form.confirm) return setError("새 비밀번호가 일치하지 않습니다.");
    setError("");
    try {
      await adminRequest("POST", "/api/admin/admins/me/password", {
        current_password: form.current,
        new_password: form.next,
      });
      setForm(empty);
      setMessage("비밀번호가 변경되었습니다.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-[12px]">
      <Field label="현재 비밀번호">
        <input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={inputClass} required />
      </Field>
      <Field label="새 비밀번호" hint="8자 이상">
        <input type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={inputClass} required />
      </Field>
      <Field label="새 비밀번호 확인">
        <input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass} required />
      </Field>
      <ErrorText>{error}</ErrorText>
      {message && <p className="text-[13px] text-[#18794e]">{message}</p>}
      <Button type="submit" className="w-full">
        비밀번호 변경
      </Button>
    </form>
  );
}

export default function AdminAccountsPage() {
  const me = useCurrentAdmin();
  const { data, error: loadError, reload } = useAdminQuery<AdminAccount[]>("/api/admin/admins");
  const [error, setError] = useState("");

  const toggle = async (admin: AdminAccount) => {
    if (!confirm(`${admin.email} 계정을 ${admin.is_active ? "비활성화" : "활성화"}할까요?`)) return;
    setError("");
    try {
      await adminRequest("PATCH", `/api/admin/admins/${admin.id}`, { is_active: !admin.is_active });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="관리자 계정" />
      <div className="grid gap-[16px] lg:grid-cols-[1fr_320px]">
        <Card title="관리자 목록">
          <ErrorText>{loadError || error}</ErrorText>
          {!data ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>이메일</th>
                    <th className={thClass}>이름</th>
                    <th className={thClass}>최근 로그인</th>
                    <th className={thClass}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((admin) => (
                    <tr key={admin.id}>
                      <td className={tdClass}>
                        {admin.email}
                        {admin.id === me.id && <span className="ml-[6px] text-[12px] text-ink-muted">(나)</span>}
                      </td>
                      <td className={tdClass}>{admin.name}</td>
                      <td className={tdClass}>{formatDateTime(admin.last_login_at)}</td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-[8px]">
                          {admin.is_active ? <Badge tone="green">활성</Badge> : <Badge>비활성</Badge>}
                          {admin.id !== me.id && (
                            <Button variant="secondary" className="h-[28px] px-[10px]" onClick={() => toggle(admin)}>
                              {admin.is_active ? "비활성화" : "활성화"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-[16px]">
          <Card title="관리자 추가">
            <AddAdminForm onAdded={reload} />
          </Card>
          <Card title="내 비밀번호 변경">
            <PasswordForm />
          </Card>
        </div>
      </div>
    </>
  );
}
