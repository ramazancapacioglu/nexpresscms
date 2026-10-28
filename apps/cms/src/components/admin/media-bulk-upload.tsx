"use client";

import { useRef, useState } from "react";
import type { MediaAssetDto } from "@nexpress/database";
import { Upload } from "lucide-react";

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 100;
const CONCURRENCY = 3;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const border = "border-[#E6E7EA] dark:border-[#23262E]";

interface Item { name: string; state: "waiting" | "uploading" | "done" | "error"; message?: string }

/** Çoklu ve sürükle-bırak yükleme: dosyalar sırayla (3 paralel) gider, her biri kendi durumunu gösterir; seçili klasöre eklenir. */
export function MediaBulkUpload({ folderId, folderName, onUploaded }: { folderId: string | null; folderName: string; onUploaded: (media: MediaAssetDto) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const [alt, setAlt] = useState("");
  const [note, setNote] = useState("");
  const running = items.some((i) => i.state === "waiting" || i.state === "uploading");

  const start = async (picked: File[]) => {
    const files = picked.filter((f) => ACCEPT.split(",").includes(f.type) || /\.(jpe?g|png|webp|avif)$/i.test(f.name));
    const skipped = picked.length - files.length;
    const batch = files.slice(0, MAX_FILES);
    setNote([skipped ? `${skipped} dosya desteklenmeyen türde olduğu için atlandı.` : "", files.length > MAX_FILES ? `En çok ${MAX_FILES} dosya birden yüklenir; ${files.length - MAX_FILES} dosya atlandı.` : ""].filter(Boolean).join(" "));
    if (batch.length === 0) return;
    const base = items.length;
    setItems((cur) => [...cur, ...batch.map((f): Item => ({ name: f.name, state: "waiting" }))]);
    const patch = (i: number, p: Partial<Item>) => setItems((cur) => cur.map((it, idx) => (idx === base + i ? { ...it, ...p } : it)));
    let next = 0;
    const worker = async () => {
      while (next < batch.length) {
        const i = next++;
        const file = batch[i]!;
        if (file.size > MAX_BYTES) { patch(i, { state: "error", message: "12 MB sınırını aşıyor" }); continue; }
        patch(i, { state: "uploading" });
        try {
          const body = new FormData();
          body.set("file", file);
          body.set("altText", alt.trim());
          if (folderId) body.set("folderId", folderId);
          const res = await fetch("/api/media/upload", { method: "POST", body });
          const json = (await res.json()) as { ok: boolean; error?: string; media?: MediaAssetDto };
          if (!json.ok || !json.media) throw new Error(json.error ?? "Yükleme başarısız");
          onUploaded({ ...json.media, createdAt: new Date(json.media.createdAt) });
          patch(i, { state: "done" });
        } catch (e) {
          patch(i, { state: "error", message: e instanceof Error ? e.message : "Yükleme başarısız" });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));
  };

  const done = items.filter((i) => i.state === "done").length;
  const failed = items.filter((i) => i.state === "error");
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void start([...e.dataTransfer.files]); }}
      className={`rounded-lg border border-dashed p-3 text-[12px] ${over ? "border-[#266DF0] bg-[#266DF0]/5" : border}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { void start([...(e.target.files ?? [])]); e.target.value = ""; }} />
        <button type="button" onClick={() => input.current?.click()} disabled={running} className="inline-flex h-7 items-center gap-1.5 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-60"><Upload className="h-3.5 w-3.5" /> Görselleri seç</button>
        <span className="text-[#5C5F66] dark:text-[#9CA3AF]">veya buraya sürükleyip bırakın → <strong>{folderName}</strong></span>
        <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ortak alt metin (isteğe bağlı)" className={`ml-auto h-7 min-w-48 flex-1 rounded border ${border} bg-transparent px-2 sm:max-w-xs`} aria-label="Ortak alt metin" />
      </div>
      <p className="mt-1.5 text-[11px] text-[#5F6570] dark:text-[#8C9099]">JPEG, PNG, WebP veya AVIF • dosya başına en çok 12 MB • tek seferde {MAX_FILES} dosya • EXIF/konum verisi silinir • animasyonlu ve SVG dosyalar desteklenmez.</p>
      {note && <p role="status" className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">{note}</p>}
      {items.length > 0 && (
        <div className="mt-2 space-y-1" aria-live="polite">
          <p className="text-[11px] font-medium">{running ? `Yükleniyor… ${done}/${items.length}` : `${done} dosya yüklendi${failed.length ? `, ${failed.length} hata` : ""}.`}{!running && <button type="button" onClick={() => setItems([])} className="ml-2 text-[#1D5ED8] dark:text-[#7AA7FF] underline">Temizle</button>}</p>
          {failed.length > 0 && <ul className="list-disc pl-5 text-[11px] text-red-600">{failed.map((f, i) => <li key={i}>{f.name}: {f.message}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
