"use client";

import { useState } from "react";
import type { AdminCategory } from "@/components/admin/ProductForm";
import {
  Button,
  Card,
  ErrorText,
  Loading,
  PageHeader,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { adminRequest, useAdminQuery } from "@/lib/admin";

type Draft = { name: string; slug: string; sort_order: string; is_active: boolean };

const toDraft = (c?: AdminCategory): Draft => ({
  name: c?.name ?? "",
  slug: c?.slug ?? "",
  sort_order: String(c?.sort_order ?? 0),
  is_active: c?.is_active ?? true,
});

const toPayload = (d: Draft) => ({ ...d, name: d.name.trim(), sort_order: Number(d.sort_order) || 0 });

function CategoryRow({ category, onChanged }: { category: AdminCategory; onChanged: () => void }) {
  const [draft, setDraft] = useState(() => toDraft(category));
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(category));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <tr>
      <td className={tdClass}>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
      </td>
      <td className={tdClass}>
        <input value={draft.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} className={inputClass} />
      </td>
      <td className={tdClass}>
        <input inputMode="numeric" value={draft.sort_order} onChange={(e) => set({ sort_order: e.target.value })} className={`${inputClass} w-[70px]`} />
      </td>
      <td className={tdClass}>
        <input
          type="checkbox"
          aria-label="진열"
          checked={draft.is_active}
          onChange={(e) => set({ is_active: e.target.checked })}
          className="h-[15px] w-[15px] accent-ink"
        />
      </td>
      <td className={tdClass}>{category.product_count}</td>
      <td className={tdClass}>
        <div className="flex gap-[6px]">
          <Button
            disabled={!dirty}
            onClick={() => run(() => adminRequest("PUT", `/api/admin/categories/${category.id}`, toPayload(draft)))}
          >
            저장
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              confirm(`'${category.name}' 카테고리를 삭제할까요?`) &&
              run(() => adminRequest("DELETE", `/api/admin/categories/${category.id}`))
            }
          >
            삭제
          </Button>
        </div>
        <ErrorText>{error}</ErrorText>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const { data, error, reload } = useAdminQuery<AdminCategory[]>("/api/admin/categories");
  const [draft, setDraft] = useState(toDraft());
  const [addError, setAddError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    try {
      await adminRequest("POST", "/api/admin/categories", toPayload(draft));
      setDraft(toDraft());
      reload();
    } catch (err) {
      setAddError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="카테고리" />
      <div className="space-y-[16px]">
        <Card>
          <p className="mb-[12px] text-[12.5px] text-ink-muted">
            슬러그는 쇼핑몰 주소(/shop/슬러그)에 쓰입니다. 진열을 해제하면 쇼핑몰 메뉴와 목록에서 숨겨집니다.
          </p>
          <ErrorText>{error}</ErrorText>
          {!data ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>이름</th>
                    <th className={thClass}>슬러그</th>
                    <th className={thClass}>순서</th>
                    <th className={thClass}>진열</th>
                    <th className={thClass}>상품 수</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {data.map((category) => (
                    // Re-mount after a save so the row starts from the saved values
                    <CategoryRow key={JSON.stringify(category)} category={category} onChanged={reload} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="카테고리 추가">
          <form onSubmit={add} className="flex flex-wrap items-center gap-[8px]">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="이름 (예: Caps)"
              className={`${inputClass} max-w-[200px]`}
            />
            <input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })}
              placeholder="슬러그 (예: caps)"
              className={`${inputClass} max-w-[200px]`}
            />
            <input
              inputMode="numeric"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
              aria-label="순서"
              className={`${inputClass} w-[70px]`}
            />
            <Button type="submit">추가</Button>
          </form>
          <div className="mt-[8px]">
            <ErrorText>{addError}</ErrorText>
          </div>
        </Card>
      </div>
    </>
  );
}
