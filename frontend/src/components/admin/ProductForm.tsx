"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
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
import ImageManager, { type AdminImage, type ImageKind } from "@/components/admin/ImageManager";
import VariantImagePicker from "@/components/admin/VariantImagePicker";
import { adminRequest, useAdminQuery } from "@/lib/admin";

export type AdminCategory = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

type ProductImage = AdminImage & { kind: ImageKind };

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
  hide_common_detail: boolean;
  images: ProductImage[];
  variants: {
    id: number;
    size: string | null;
    color: string | null;
    image_url: string | null;
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
  image_url: string | null;
  extra_price: string;
  stock: string;
  is_active: boolean;
};

const newVariant = (size = ""): VariantRow => ({
  size,
  color: "",
  image_url: null,
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
    hide_common_detail: product?.hide_common_detail ?? false,
    images: product?.images ?? [],
    variants: product?.variants.map((v) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      image_url: v.image_url,
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
    hide_common_detail: form.hide_common_detail,
    images: form.images,
    variants: form.variants.map((v) => ({
      id: v.id,
      size: v.size.trim() || null,
      color: v.color.trim() || null,
      image_url: v.image_url,
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
  const imagesOf = (kind: ImageKind) => form.images.filter((image) => image.kind === kind);
  // Functional update: uploads finish after other edits may have happened.
  // Gallery images stay first; the admin list uses the first image as the thumbnail.
  const setImages = (kind: ImageKind, images: AdminImage[]) =>
    setForm((f) => {
      const mine = images.map((image) => ({ ...image, kind }));
      const rest = f.images.filter((image) => image.kind !== kind);
      return { ...f, images: kind === "gallery" ? [...mine, ...rest] : [...rest, ...mine] };
    });
  // An option's picture usually belongs to its color, so it's copied to the
  // other options of the same color (S / Black, M / Black, …)
  const setVariantImage = (index: number, url: string | null) => {
    const color = form.variants[index].color.trim();
    set({
      variants: form.variants.map((v, i) =>
        i === index || (color && v.color.trim() === color) ? { ...v, image_url: url } : v,
      ),
    });
  };
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
              hint="상품 상단 갤러리에 순서대로 표시됩니다. ★ 대표 이미지는 상품 목록 썸네일로 쓰입니다. 끌어서 순서를 바꿀 수 있습니다."
              kind="gallery"
              images={imagesOf("gallery")}
              onChange={(images) => setImages("gallery", images)}
            />
            <div>
              <ImageManager
                title="상세 이미지"
                hint="상세 영역에 순서대로 이어 붙여 표시됩니다. 권장 가로 900px · 최대 30MB (아주 긴 이미지는 자동으로 나눠 저장)"
                kind="detail"
                images={imagesOf("detail")}
                onChange={(images) => setImages("detail", images)}
              />
              <label className="mt-[12px] flex items-center gap-[8px] text-[13px]">
                <input
                  type="checkbox"
                  checked={form.hide_common_detail}
                  onChange={(e) => set({ hide_common_detail: e.target.checked })}
                  className="h-[15px] w-[15px] accent-ink"
                />
                이 상품에는 공통 상세 이미지(상단·하단)를 표시하지 않음
                <Link href="/admin/settings" className="text-ink-muted underline">
                  공통 이미지 설정
                </Link>
              </label>
            </div>
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
            <br />
            옵션 이미지는 쇼핑몰 옵션 목록에 작게 표시됩니다. 상품 이미지 중에서 고르며, 같은 색상의 옵션에 함께 적용됩니다.
          </p>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>이미지</th>
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
                      <VariantImagePicker
                        value={variant.image_url}
                        images={imagesOf("gallery").map((image) => image.url)}
                        onChange={(url) => setVariantImage(index, url)}
                      />
                    </td>
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
