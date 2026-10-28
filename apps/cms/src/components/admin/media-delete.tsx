"use client";

import React, { useState, useTransition } from "react";
import type { MediaAssetDto, MediaUsageDto } from "@nexpress/database";
import { deleteMediaAssetAction } from "@/app/admin/actions";
import { Trash2 } from "lucide-react";

/** İki adımlı silme: kullanımdaysa içerik listesini gösterir, ancak ikinci onayla zorla siler. */
export function MediaDelete({ media, onDeleted }: { media: MediaAssetDto; onDeleted: (id: string) => void }) {
  const [pending, start] = useTransition();
  const [usage, setUsage] = useState<MediaUsageDto[] | null>(null);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (force: boolean) =>
    start(async () => {
      setError(null);
      const res = await deleteMediaAssetAction({ id: media.id, force });
      if (res.ok) return onDeleted(media.id);
      if (res.reason === "in_use") return setUsage(res.usage);
      setError("Kayıt bulunamadı.");
    });

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 text-red-600 hover:bg-red-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" /> Görseli sil
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-red-500/40 bg-red-500/5 p-2.5">
      {usage ? (
        <>
          <p className="text-[11px] font-semibold text-red-700">Bu görsel {usage.length} içerikte kullanılıyor:</p>
          <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-4 text-[11px]">
            {usage.map((u) => (
              <li key={`${u.contentId}-${u.locale}`}>{u.title}</li>
            ))}
          </ul>
          <p className="text-[11px] text-red-700">Silinirse bu içeriklerde görsel kırılır.</p>
        </>
      ) : (
        <p className="text-[11px] text-red-700">Görsel ve tüm türevleri kalıcı olarak silinecek.</p>
      )}
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(usage !== null)}
          className="h-7 flex-1 rounded bg-red-600 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Siliniyor…" : usage ? "Yine de sil" : "Evet, sil"}
        </button>
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            setUsage(null);
          }}
          className="h-7 rounded border border-[#E6E7EA] dark:border-[#23262E] px-3"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
