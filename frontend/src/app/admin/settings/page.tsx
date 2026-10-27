"use client";

import { useState } from "react";
import ImageManager, { type AdminImage } from "@/components/admin/ImageManager";
import { Button, Card, ErrorText, Loading, PageHeader } from "@/components/admin/ui";
import { adminRequest, useAdminQuery } from "@/lib/admin";

type DetailCommon = { header: AdminImage[]; footer: AdminImage[] };

function DetailCommonForm({ initial }: { initial: DetailCommon }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      setValue(await adminRequest<DetailCommon>("PUT", "/api/admin/settings/detail-images", value));
      setMessage("저장되었습니다.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="상세 공통 이미지">
      <p className="mb-[20px] text-[12.5px] text-ink-muted">
        모든 상품의 상세 이미지 위·아래에 표시됩니다. 판매처 안내, 교환/반품 주의사항, 세탁 방법처럼 모든 상품에 쓰는
        이미지를 한 번만 올려 두세요. 상품 수정 화면에서 상품별로 끌 수 있습니다.
      </p>
      <div className="space-y-[24px]">
        <ImageManager
          title="상단 이미지"
          hint="상품 상세 이미지 위에 표시됩니다."
          kind="detail"
          images={value.header}
          onChange={(header) => setValue((v) => ({ ...v, header }))}
        />
        <ImageManager
          title="하단 이미지"
          hint="상품 상세 이미지와 사이즈 정보 아래에 표시됩니다."
          kind="detail"
          images={value.footer}
          onChange={(footer) => setValue((v) => ({ ...v, footer }))}
        />
      </div>
      <div className="mt-[20px] flex items-center justify-end gap-[12px]">
        <ErrorText>{error}</ErrorText>
        {message && <p className="text-[13px] text-[#18794e]">{message}</p>}
        <Button onClick={save} disabled={saving} className="min-w-[100px]">
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { data, error } = useAdminQuery<DetailCommon>("/api/admin/settings/detail-images");

  return (
    <>
      <PageHeader title="쇼핑몰 설정" />
      <ErrorText>{error}</ErrorText>
      {!data ? <Loading /> : <DetailCommonForm initial={data} />}
    </>
  );
}
