"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, Upload, X } from "lucide-react";
import { Button, ErrorText } from "@/components/admin/ui";
import { adminRequest } from "@/lib/admin";

export type ImageKind = "gallery" | "detail";

// Same limit as the backend (app/uploads.py)
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

/** An uploaded image as the API returns it (see /api/admin/uploads). */
export type AdminImage = {
  url: string;
  width: number | null;
  height: number | null;
  slices: { url: string; width: number; height: number }[];
};

export default function ImageManager({
  title,
  hint,
  kind,
  images,
  onChange,
}: {
  title: string;
  hint: string;
  // "gallery": the first image is the main (대표) one.
  // "detail": long images — tall previews, and very tall uploads are sliced.
  kind: ImageKind;
  images: AdminImage[];
  onChange: (images: AdminImage[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Index of the thumbnail being dragged to reorder (null: not reordering)
  const [dragging, setDragging] = useState<number | null>(null);
  const [fileOver, setFileOver] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const added: AdminImage[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name}: 이미지는 30MB 이하만 업로드할 수 있습니다.`);
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);
        added.push(await adminRequest<AdminImage>("POST", "/api/admin/uploads", body));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      onChange([...images, ...added]);
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const moveTo = (from: number, to: number) => {
    const next = [...images];
    next.splice(to, 0, ...next.splice(from, 1));
    onChange(next);
  };

  const tall = kind === "detail";

  return (
    <div
      // Files dropped from the computer are uploaded; thumbnail drags are handled per item
      onDragOver={(e) => {
        if (dragging !== null || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setFileOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFileOver(false)}
      onDrop={(e) => {
        if (dragging !== null) return;
        e.preventDefault();
        setFileOver(false);
        upload(e.dataTransfer.files);
      }}
      className={`rounded-[4px] ${fileOver ? "outline-2 outline-offset-4 outline-dashed outline-ink-muted" : ""}`}
    >
      <div className="mb-[10px] flex items-center justify-between gap-[12px]">
        <div>
          <p className="text-[13px] font-bold">
            {title}
            {images.length > 0 && <span className="ml-[6px] font-normal text-ink-muted">{images.length}</span>}
          </p>
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
      {images.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-hairline py-[24px] text-center text-[12.5px] text-ink-muted">
          등록된 이미지가 없습니다. 여러 장을 한 번에 선택하거나 여기로 끌어다 놓으세요.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-[10px]">
          {images.map((image, index) => (
            <li
              key={`${index}-${image.url}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(index));
                setDragging(index);
              }}
              onDragOver={(e) => dragging !== null && e.preventDefault()}
              onDrop={(e) => {
                if (dragging === null) return;
                e.preventDefault();
                moveTo(dragging, index);
                setDragging(null);
              }}
              onDragEnd={() => setDragging(null)}
              className={`w-[110px] cursor-grab ${dragging === index ? "opacity-40" : ""}`}
            >
              <a
                href={image.url}
                target="_blank"
                title="원본 보기"
                draggable={false}
                className={`relative block w-[110px] overflow-hidden rounded-[4px] border bg-[#f5f5f5] ${
                  index === 0 && kind === "gallery" ? "border-ink" : "border-hairline"
                } ${tall ? "h-[220px]" : "h-[110px]"}`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  unoptimized
                  draggable={false}
                  className={tall ? "object-cover object-top" : "object-cover"}
                />
                {index === 0 && kind === "gallery" && (
                  <span className="absolute top-[4px] left-[4px] rounded-[3px] bg-ink px-[5px] py-[1px] text-[11px] text-white">
                    대표
                  </span>
                )}
              </a>
              {tall && image.width && image.height && (
                <p className="mt-[3px] text-center text-[11px] text-ink-muted">
                  {image.width}×{image.height}
                  {image.slices.length > 0 && ` · ${image.slices.length}분할`}
                </p>
              )}
              <div className="mt-[4px] flex justify-between text-ink-muted">
                <button type="button" aria-label="앞으로" disabled={index === 0} onClick={() => moveTo(index, index - 1)} className="disabled:opacity-30">
                  <ArrowLeft size={15} />
                </button>
                {kind === "gallery" && (
                  <button
                    type="button"
                    aria-label="대표 이미지로 지정"
                    title={index === 0 ? "대표 이미지" : "대표 이미지로 지정"}
                    disabled={index === 0}
                    onClick={() => moveTo(index, 0)}
                    className="hover:text-ink disabled:text-ink"
                  >
                    <Star size={15} fill={index === 0 ? "currentColor" : "none"} />
                  </button>
                )}
                <button type="button" aria-label="삭제" onClick={() => onChange(images.filter((_, i) => i !== index))} className="hover:text-[#e5484d]">
                  <X size={15} />
                </button>
                <button type="button" aria-label="뒤로" disabled={index === images.length - 1} onClick={() => moveTo(index, index + 1)} className="disabled:opacity-30">
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
