"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  Empty,
  ErrorText,
  Loading,
  PageHeader,
  Pagination,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import type { AdminCategory } from "@/components/admin/ProductForm";
import { ADMIN_PAGE_SIZE, toQuery, useAdminQuery, type Page } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  category_name: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  image: string | null;
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const { data: categories } = useAdminQuery<AdminCategory[]>("/api/admin/categories");
  const { data, error } = useAdminQuery<Page<ProductRow>>(
    `/api/admin/products${toQuery({ q, category_id: categoryId, page })}`,
  );

  return (
    <>
      <PageHeader
        title="상품 관리"
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus size={15} />
            상품 등록
          </ButtonLink>
        }
      />
      <Card>
        <div className="mb-[16px] flex flex-wrap gap-[8px]">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-[180px]`}
          >
            <option value="">전체 카테고리</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQ(search.trim());
              setPage(1);
            }}
            className="relative w-full max-w-[280px]"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명 또는 슬러그"
              className={`${inputClass} pr-[34px]`}
            />
            <button type="submit" aria-label="검색" className="absolute top-[9px] right-[10px]">
              <Search size={15} />
            </button>
          </form>
        </div>

        <ErrorText>{error}</ErrorText>
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <Empty>상품이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>상품</th>
                  <th className={thClass}>카테고리</th>
                  <th className={thClass}>판매가</th>
                  <th className={thClass}>재고</th>
                  <th className={thClass}>진열</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-[#fafafa]">
                    <td className={tdClass}>
                      <Link href={`/admin/products/${product.id}`} className="flex items-center gap-[12px]">
                        <span className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[3px] bg-[#eee]">
                          {product.image && (
                            <Image src={product.image} alt="" fill unoptimized className="object-cover" />
                          )}
                        </span>
                        <span>
                          <span className="block hover:underline">{product.name}</span>
                          <span className="text-[12px] text-ink-muted">{product.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={tdClass}>{product.category_name}</td>
                    <td className={tdClass}>
                      {product.sale_price !== null ? (
                        <>
                          {formatPrice(product.sale_price)}
                          <span className="ml-[6px] text-[12px] text-ink-muted line-through">
                            {formatPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        formatPrice(product.price)
                      )}
                    </td>
                    <td className={tdClass}>
                      {product.stock > 0 ? product.stock : <Badge tone="red">품절</Badge>}
                    </td>
                    <td className={tdClass}>
                      {product.is_active ? <Badge tone="green">진열중</Badge> : <Badge>숨김</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination page={page} total={data.total} pageSize={ADMIN_PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </>
  );
}
