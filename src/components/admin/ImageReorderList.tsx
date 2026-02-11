"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ImageItem = {
  id: number;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
};

type ImageReorderListProps = {
  propertyId: number;
  images: ImageItem[];
};

export default function ImageReorderList({
  propertyId,
  images,
}: ImageReorderListProps) {
  const initial = useMemo(
    () => [...images].sort((a, b) => a.displayOrder - b.displayOrder),
    [images]
  );
  const [items, setItems] = useState<ImageItem[]>(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    items.length !== initial.length ||
    items.some((item, index) => item.id !== initial[index]?.id);

  async function saveOrder() {
    if (!hasChanges) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/property-images/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          orderedImageIds: items.map(item => item.id),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save order");
      }

      setSaved(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Save failed";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDragStart(id: number) {
    setDragId(id);
    setSaved(false);
  }

  function handleDragOver(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) {
      return;
    }

    const next = [...items];
    const fromIndex = next.findIndex(item => item.id === dragId);
    const toIndex = next.findIndex(item => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Reorder images</p>
          <p className="text-xs text-zinc-500">
            Drag a thumbnail to change its position.
          </p>
        </div>
        <button
          type="button"
          onClick={saveOrder}
          disabled={!hasChanges || isSaving}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save order"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Order saved.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(item.id)}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-left"
            title="Drag to reorder"
          >
            <div className="relative h-24 overflow-hidden rounded-lg bg-zinc-100">
              <Image
                src={item.imageUrl}
                alt={item.caption || "Property image"}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-zinc-600 line-clamp-1">
              {item.caption || "Untitled image"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
