"use client";

import { use } from "react";
import ProductForm, { type AdminProduct } from "@/components/admin/ProductForm";
import { ErrorText, Loading } from "@/components/admin/ui";
import { useAdminQuery } from "@/lib/admin";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useAdminQuery<AdminProduct>(`/api/admin/products/${id}`);

  if (!data) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return <ProductForm product={data} />;
}
