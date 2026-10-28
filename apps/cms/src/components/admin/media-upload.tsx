"use client";

import React, { useRef, useState } from "react";
import type { MediaAssetDto } from "@nexpress/database";
import { Upload } from "lucide-react";

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Dosya yükler; sunucu AVIF/WebP/JPG türevlerini ilk istekte üretir. */
export function MediaUpload({ onUploaded }: { onUploaded: (media: MediaAssetDto) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!file) return setError("Bir görsel seçin.");
    if (file.size > MAX_BYTES) return setError("Dosya 12 MB sınırını aşıyor.");
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("altText", alt.trim());
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; error?: string; media?: MediaAssetDto };
      if (!json.ok || !json.media) throw new Error(json.error ?? "Yükleme başarısız.");
      onUploaded({ ...json.media, createdAt: new Date(json.media.createdAt) });
      setAlt("");
      if (input.current) input.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-[#E6E7EA] dark:border-[#23262E] p-3 space-y-2 text-[12px]">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept={ACCEPT} className="text-[12px]" aria-label="Görsel dosyası" />
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Alt metin (SEO için önerilir)"
          className="h-7 min-w-48 flex-1 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-2"
        />
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="inline-flex h-7 items-center gap-1.5 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {busy ? "Yükleniyor…" : "Yükle"}
        </button>
      </div>
      <p className="text-[11px] text-[#8C9099]">JPEG, PNG, WebP veya AVIF • en çok 12 MB • EXIF/konum verisi silinir • animasyonlu ve SVG dosyalar desteklenmez.</p>
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
