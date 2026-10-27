"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Plus, Trash2, Upload, X } from "lucide-react";
import {
  Button,
  Card,
  ErrorText,
  Field,
  PageHeader,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { adminRequest, useAdminQuery } from "@/lib/admin";

export type AdminCategory = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

type ImageKind = "gallery" | "detail";
type ProductImage = { url: string; kind: ImageKind };

export type AdminProduct = {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  note: string | null;
  material: string | null;
  size_guide: { title: string; lines: string[] }[];
  minimum_order: number;
  sort_order: number;
  is_active: boolean;
  images: ProductImage[];
  variants: {
    id: number;
    size: string | null;
    color: string | null;
    extra_price: number;
    stock: number;
    is_active: boolean;
  }[];
};

// Inputs hold strings; they're converted to numbers when saving
type VariantRow = {
  id?: number;
  size: string;
  color: string;
  extra_price: string;
  stock: string;
  is_active: boolean;
};

const newVariant = (size = ""): VariantRow => ({
  size,
  color: "",
  extra_price: "0",
  stock: "0",
  is_active: true,
});

function toForm(product?: AdminProduct) {
  return {
    category_id: product ? String(product.category_id) : "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    price: product ? String(product.price) : "",
    sale_price: product?.sale_price != null ? String(product.sale_price) : "",
    note: product?.note ?? "",
    material: product?.material ?? "",
    minimum_order: String(product?.minimum_order ?? 1),
    sort_order: String(product?.sort_order ?? 0),
    is_active: product?.is_active ?? true,
    images: product?.images ?? [],
    variants: product?.variants.map((v) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      extra_price: String(v.extra_price),
      stock: String(v.stock),
      is_active: v.is_active,
    })) ?? [newVariant()],
    size_guide: product?.size_guide.map((g) => ({ title: g.title, lines: g.lines.join("\n") })) ?? [],
  };
}

type FormState = ReturnType<typeof toForm>;

const isWholeNumber = (value: string) => /^\d+$/.test(value.trim());

function validate(form: FormState) {
  if (!form.category_id) return "카테고리를 선택해 주세요.";
  if (!form.name.trim()) return "상품명을 입력해 주세요.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
    return "슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.";
  }
  if (!isWholeNumber(form.price)) return "판매가를 숫자로 입력해 주세요.";
  if (form.sale_price && !isWholeNumber(form.sale_price)) return "할인가를 숫자로 입력해 주세요.";
  if (form.variants.length === 0) return "옵션을 1개 이상 추가해 주세요.";
  if (form.variants.some((v) => !isWholeNumber(v.stock) || !/^-?\d+$/.test(v.extra_price.trim()))) {
    return "옵션의 재고와 추가금액을 숫자로 입력해 주세요.";
  }
  return null;
}

function toPayload(form: FormState) {
  return {
    category_id: Number(form.category_id),
    name: form.name.trim(),
    slug: form.slug,
    price: Number(form.price),
    sale_price: form.sale_price ? Number(form.sale_price) : null,
    note: form.note.trim() || null,
    material: form.material.trim() || null,
    minimum_order: Number(form.minimum_order) || 1,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
    images: form.images,
    variants: form.variants.map((v) => ({
      id: v.id,
      size: v.size.trim() || null,
      color: v.color.trim() || null,
      extra_price: Number(v.extra_price),
      stock: Number(v.stock),
      is_active: v.is_active,
    })),
    size_guide: form.size_guide
      .filter((g) => g.title.trim())
      .map((g) => ({
        title: g.title.trim(),
        lines: g.lines.split("\n").map((line) => line.trim()).filter(Boolean),
      })),
  };
}

function ImageManager({
  title,
  hint,
  kind,
  images,
  onChange,
}: {
  title: string;
  hint: string;
  kind: ImageKind;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const own = images.filter((image) => image.kind === kind);
  const others = images.filter((image) => image.kind !== kind);
  const setOwn = (next: ProductImage[]) => onChange([...others, ...next]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const added: ProductImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const { url } = await adminRequest<{ url: string }>("POST", "/api/admin/uploads", body);
        added.push({ url, kind });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOwn([...own, ...added]);
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const move = (index: number, by: number) => {
    const next = [...own];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setOwn(next);
  };

  return (
    <div>
      <div className="mb-[10px] flex items-center justify-between gap-[12px]">
        <div>
          <p className="text-[13px] font-bold">{title}</p>
          <p className="text-[12px] text-ink-muted">{hint}</p>
        </div>
        <Button variant="secondary" disabled={uploading} onClick={() => fileInput.current?.click()}>
          <Upload size={14} />
          {uploading ? "업로드 중…" : "이미지 추가"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      {own.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-hairline py-[24px] text-center text-[12.5px] text-ink-muted">
          등록된 이미지가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-[10px]">
          {own.map((image, index) => (
            <li key={`${index}-${image.url}`} className="w-[110px]">
              <div className="relative h-[110px] w-[110px] overflow-hidden rounded-[4px] border border-hairline bg-[#f5f5f5]">
                <Image src={image.url} alt="" fill unoptimized className="object-cover" />
                {index === 0 && kind === "gallery" && (
                  <span className="absolute top-[4px] left-[4px] rounded-[3px] bg-ink px-[5px] py-[1px] text-[11px] text-white">
                    대표
                  </span>
                )}
              </div>
              <div className="mt-[4px] flex justify-between text-ink-muted">
                <button type="button" aria-label="앞으로" disabled={index === 0} onClick={() => move(index, -1)} className="disabled:opacity-30">
                  <ArrowLeft size={15} />
                </button>
                <button type="button" aria-label="삭제" onClick={() => setOwn(own.filter((_, i) => i !== index))} className="hover:text-[#e5484d]">
                  <X size={15} />
                </button>
                <button type="button" aria-label="뒤로" disabled={index === own.length - 1} onClick={() => move(index, 1)} className="disabled:opacity-30">
                  <ArrowRight size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { data: categories } = useAdminQuery<AdminCategory[]>("/api/admin/categories");
  const [form, setForm] = useState(() => toForm(product));
  const [sizes, setSizes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setVariant = (index: number, patch: Partial<VariantRow>) =>
    set({ variants: form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) });
  const setGuide = (index: number, patch: Partial<FormState["size_guide"][number]>) =>
    set({ size_guide: form.size_guide.map((g, i) => (i === index ? { ...g, ...patch } : g)) });

  const generateSlug = () => {
    const category = categories?.find((c) => String(c.id) === form.category_id);
    set({ slug: `${category?.slug ?? "item"}-${Date.now().toString(36)}` });
  };

  const addSizes = () => {
    const names = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    // Replace the untouched starter row instead of keeping an empty option
    const keep = form.variants.filter((v) => v.id || v.size || v.color || v.stock !== "0");
    set({ variants: [...keep, ...names.map((name) => newVariant(name))] });
    setSizes("");
  };

  const save = async () => {
    const problem = validate(form);
    setError(problem ?? "");
    setMessage("");
    if (problem) return;

    setSaving(true);
    try {
      const saved = product
        ? await adminRequest<AdminProduct>("PUT", `/api/admin/products/${product.id}`, toPayload(form))
        : await adminRequest<AdminProduct>("POST", "/api/admin/products", toPayload(form));
      if (product) {
        setForm(toForm(saved));
        setMessage("저장되었습니다.");
      } else {
        router.replace(`/admin/products/${saved.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product || !confirm(`'${product.name}' 상품을 삭제할까요? 되돌릴 수 없습니다.\n(판매를 잠시 멈추려면 '숨김'을 사용하세요.)`)) return;
    try {
      await adminRequest("DELETE", `/api/admin/products/${product.id}`);
      router.push("/admin/products");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        title={product ? "상품 수정" : "상품 등록"}
        back="/admin/products"
        actions={
          product && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              aria-label="쇼핑몰에서 보기"
              title="쇼핑몰에서 보기"
              className="flex h-[32px] w-[32px] items-center justify-center rounded-[4px] text-ink-soft hover:bg-[#ececec] hover:text-ink"
            >
              <ExternalLink size={17} strokeWidth={1.8} />
            </Link>
          )
        }
      />

      <div className="space-y-[16px]">
        <Card title="기본 정보">
          <div className="grid gap-[16px] md:grid-cols-2">
            <Field label="카테고리" required>
              <select value={form.category_id} onChange={(e) => set({ category_id: e.target.value })} className={inputClass}>
                <option value="">선택하세요</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.is_active && " (숨김)"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="상품명" required>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="슬러그 (상품 주소)" required hint={`쇼핑몰 주소: /product/${form.slug || "…"}  ·  영문 소문자, 숫자, 하이픈(-)`}>
              <div className="flex gap-[6px]">
                <input
                  value={form.slug}
                  onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
                  className={inputClass}
                />
                <Button variant="secondary" onClick={generateSlug}>
                  자동 생성
                </Button>
              </div>
            </Field>
            <Field label="소재">
              <input
                value={form.material}
                onChange={(e) => set({ material: e.target.value })}
                placeholder="예: Polyester 96 Span 4"
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="가격">
          <div className="grid gap-[16px] md:grid-cols-3">
            <Field label="판매가 (원)" required>
              <input inputMode="numeric" value={form.price} onChange={(e) => set({ price: e.target.value })} className={inputClass} />
            </Field>
            <Field label="할인가 (원)" hint="비워두면 할인 없음">
              <input inputMode="numeric" value={form.sale_price} onChange={(e) => set({ sale_price: e.target.value })} className={inputClass} />
            </Field>
            <Field label="최소 주문수량">
              <input inputMode="numeric" value={form.minimum_order} onChange={(e) => set({ minimum_order: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title="이미지">
          <div className="space-y-[24px]">
            <ImageManager
              title="상품 이미지"
              hint="목록과 상품 상단 슬라이드에 사용됩니다. 첫 번째 이미지가 대표 이미지입니다."
              kind="gallery"
              images={form.images}
              onChange={(images) => set({ images })}
            />
            <ImageManager
              title="상세 이미지"
              hint="상품 상세 설명 영역에 순서대로 표시됩니다."
              kind="detail"
              images={form.images}
              onChange={(images) => set({ images })}
            />
          </div>
        </Card>

        <Card
          title="옵션 / 재고"
          actions={
            <div className="flex gap-[6px]">
              <input
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSizes();
                  }
                }}
                placeholder="S, M, L"
                className={`${inputClass} w-[140px]`}
              />
              <Button variant="secondary" onClick={addSizes}>
                사이즈 일괄 추가
              </Button>
            </div>
          }
        >
          <p className="mb-[12px] text-[12.5px] text-ink-muted">
            옵션이 없는 상품은 사이즈·색상을 비워 한 줄만 두세요. 재고가 0이면 품절로 표시됩니다.
          </p>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>사이즈</th>
                  <th className={thClass}>색상</th>
                  <th className={thClass}>추가금액 (원)</th>
                  <th className={thClass}>재고</th>
                  <th className={thClass}>판매</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {form.variants.map((variant, index) => (
                  <tr key={variant.id ?? `new-${index}`}>
                    <td className={tdClass}>
                      <input value={variant.size} onChange={(e) => setVariant(index, { size: e.target.value })} className={inputClass} />
                    </td>
                    <td className={tdClass}>
                      <input value={variant.color} onChange={(e) => setVariant(index, { color: e.target.value })} className={inputClass} />
                    </td>
                    <td className={tdClass}>
                      <input inputMode="numeric" value={variant.extra_price} onChange={(e) => setVariant(index, { extra_price: e.target.value })} className={inputClass} />
                    </td>
                    <td className={tdClass}>
                      <input inputMode="numeric" value={variant.stock} onChange={(e) => setVariant(index, { stock: e.target.value })} className={inputClass} />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        aria-label="판매"
                        checked={variant.is_active}
                        onChange={(e) => setVariant(index, { is_active: e.target.checked })}
                        className="h-[15px] w-[15px] accent-ink"
                      />
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        aria-label="옵션 삭제"
                        disabled={form.variants.length === 1}
                        onClick={() => set({ variants: form.variants.filter((_, i) => i !== index) })}
                        className="text-ink-muted hover:text-[#e5484d] disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" className="mt-[12px]" onClick={() => set({ variants: [...form.variants, newVariant()] })}>
            <Plus size={14} />
            옵션 추가
          </Button>
        </Card>

        <Card title="상세 정보">
          <div className="space-y-[16px]">
            <Field label="상품 설명" hint="상세 영역 상단에 표시됩니다.">
              <textarea
                value={form.note}
                onChange={(e) => set({ note: e.target.value })}
                rows={4}
                className={`${inputClass} h-auto py-[8px]`}
              />
            </Field>
            <div>
              <p className="mb-[8px] text-[12.5px] text-ink-soft">사이즈 가이드</p>
              <div className="space-y-[10px]">
                {form.size_guide.map((guide, index) => (
                  <div key={index} className="flex gap-[8px] rounded-[4px] border border-hairline p-[12px]">
                    <div className="flex-1 space-y-[6px]">
                      <input
                        value={guide.title}
                        onChange={(e) => setGuide(index, { title: e.target.value })}
                        placeholder="[M Size]"
                        className={inputClass}
                      />
                      <textarea
                        value={guide.lines}
                        onChange={(e) => setGuide(index, { lines: e.target.value })}
                        placeholder={"Length 70cm / Shoulder Length 61cm\nChest 69cm / Sleeve Length 27cm"}
                        rows={2}
                        className={`${inputClass} h-auto py-[8px]`}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="사이즈 가이드 삭제"
                      onClick={() => set({ size_guide: form.size_guide.filter((_, i) => i !== index) })}
                      className="self-start text-ink-muted hover:text-[#e5484d]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                className="mt-[10px]"
                onClick={() => set({ size_guide: [...form.size_guide, { title: "", lines: "" }] })}
              >
                <Plus size={14} />
                사이즈 추가
              </Button>
            </div>
          </div>
        </Card>

        <Card title="진열">
          <div className="flex flex-wrap items-end gap-[24px]">
            <label className="flex items-center gap-[8px] text-[13px]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set({ is_active: e.target.checked })}
                className="h-[15px] w-[15px] accent-ink"
              />
              쇼핑몰에 진열 (해제하면 숨김)
            </label>
            <Field label="진열 순서" hint="작은 숫자가 먼저 표시됩니다." className="w-[160px]">
              <input inputMode="numeric" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-0 flex items-center justify-between gap-[12px] border-t border-hairline bg-[#f6f6f6] py-[14px]">
          <div>
            <ErrorText>{error}</ErrorText>
            {message && <p className="text-[13px] text-[#18794e]">{message}</p>}
          </div>
          <div className="flex gap-[8px]">
            {product && (
              <Button variant="danger" onClick={remove}>
                삭제
              </Button>
            )}
            <Button onClick={save} disabled={saving} className="min-w-[100px]">
              {saving ? "저장 중…" : product ? "저장" : "등록"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
