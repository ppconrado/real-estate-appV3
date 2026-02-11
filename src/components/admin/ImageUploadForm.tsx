"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ImageUploadFormProps = {
  propertyId: number;
  maxMb: number;
};

export default function ImageUploadForm({
  propertyId,
  maxMb,
}: ImageUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxBytes = useMemo(() => maxMb * 1024 * 1024, [maxMb]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      setError(null);
      return;
    }

    if (!next.type.startsWith("image/")) {
      setError("Please select an image file.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (next.size > maxBytes) {
      setError(`File exceeds ${maxMb}MB limit.`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 md:flex-row md:items-center"
      action="/api/admin/property-images"
      method="post"
      encType="multipart/form-data"
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="flex flex-1 flex-col gap-2">
        <input
          name="file"
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          onChange={handleFileChange}
          required
        />
        {error ? (
          <span className="text-xs text-rose-600">{error}</span>
        ) : (
          <span className="text-xs text-zinc-500">
            Max {maxMb}MB. JPG/PNG/WebP supported.
          </span>
        )}
      </div>
      {previewUrl ? (
        <div className="relative h-20 w-28 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <Image
            src={previewUrl}
            alt={file?.name || "Preview"}
            fill
            sizes="112px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!file || Boolean(error)}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Upload image
      </button>
    </form>
  );
}
