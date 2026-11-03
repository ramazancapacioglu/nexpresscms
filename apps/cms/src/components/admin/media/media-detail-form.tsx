"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Copy, Info, XCircle } from "lucide-react";
import { thumbnailUrl } from "@nexpress/core";
import type { MediaAssetDto } from "@nexpress/database";
import { saveMediaAssetAction } from "@/app/admin/actions";
import { formatBytes, liveReport } from "./media-filter";
import { MediaThumb, kindLabel } from "./media-thumb";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const input = `w-full rounded border ${border} bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const label = "block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]";
const SEVERITY = { error: XCircle, warn: AlertTriangle, info: Info } as const;
const SEVERITY_CLASS = { error: "text-red-600", warn: "text-amber-700 dark:text-amber-400", info: "text-[#5F6570] dark:text-[#8C9099]" } as const;

export interface MediaFields {
  titleText: string;
  altText: string;
  caption: string;
  description: string;
  focalX: number;
  focalY: number;
}

const fieldsOf = (a: MediaAssetDto): MediaFields => ({ titleText: a.titleText ?? "", altText: a.altText, caption: a.caption ?? "", description: a.description ?? "", focalX: a.focalPoint?.x ?? 50, focalY: a.focalPoint?.y ?? 50 });

/**
 * Medya bilgileri (WordPress'teki "Ek ayrıntıları"): başlık, alt metin, alt yazı, açıklama; canlı SEO raporu.
 * Hem kitaplıkta hem editördeki medya seçicide kullanılır. `primary` verilirse kaydetme sonrası onu çalıştıran
 * ikinci bir düğme çıkar (ör. "Kaydet ve ekle").
 */
export function MediaDetailForm({ asset, onSaved, primary, children }: { asset: MediaAssetDto; onSaved: (a: MediaAssetDto) => void; primary?: { label: string; onDone: (a: MediaAssetDto) => void }; children?: React.ReactNode }) {
  const [f, setF] = useState<MediaFields>(() => fieldsOf(asset));
  const [prevId, setPrevId] = useState(asset.id);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  if (prevId !== asset.id) {
    setPrevId(asset.id);
    setF(fieldsOf(asset));
    setNote(null);
  }
  const dirty = JSON.stringify(f) !== JSON.stringify(fieldsOf(asset));
  const report = liveReport(asset, f);
  const isImage = asset.kind === "image";

  const save = (then?: (a: MediaAssetDto) => void) =>
    start(async () => {
      const res = await saveMediaAssetAction({
        id: asset.id, filename: asset.filename, url: asset.url, mimeType: asset.mimeType,
        width: asset.width, height: asset.height, sizeBytes: asset.sizeBytes,
        altText: f.altText.trim(), titleText: f.titleText.trim(), caption: f.caption.trim(), description: f.description.trim(),
        focalPoint: { x: f.focalX, y: f.focalY },
      }).catch(() => null);
      if (!res?.ok) return setNote({ kind: "error", text: "Kaydedilemedi." });
      const saved = { ...res.media, createdAt: new Date(res.media.createdAt) } as MediaAssetDto;
      onSaved({ ...saved, kind: asset.kind, description: f.description.trim() || null });
      setNote({ kind: "ok", text: `Kaydedildi (SEO ${saved.seoScore}/100).` });
      then?.(saved);
    });

  const field = (k: keyof MediaFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((cur) => ({ ...cur, [k]: e.target.value }));
  const absolute = typeof window !== "undefined" ? new URL(asset.url, window.location.origin).toString() : asset.url;

  return (
    <div className="space-y-3 text-[12px]">
      {primary && (
        <div className="sticky top-0 z-10 -mx-1 bg-white/95 pb-2 pt-0.5 backdrop-blur-xs dark:bg-[#15171C]/95">
          <button
            type="button"
            disabled={pending}
            onClick={() => (dirty ? save(primary.onDone) : primary.onDone(asset))}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#266DF0] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {pending ? "Kaydediliyor…" : dirty ? primary.label : "Seç ve Ekle"}
          </button>
        </div>
      )}
      <div className={`h-40 overflow-hidden rounded border ${border} bg-slate-900`}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl(asset.url, 480)} alt={f.altText} style={{ objectPosition: `${f.focalX}% ${f.focalY}%` }} className="h-full w-full object-cover" />
        ) : (
          <MediaThumb asset={asset} />
        )}
      </div>
      <div className="font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
        <div className="truncate" title={asset.filename}>{asset.filename}</div>
        <div>{kindLabel(asset.kind)} • {asset.mimeType.split("/")[1]?.toUpperCase()} • {formatBytes(asset.sizeBytes)}{isImage ? ` • ${asset.width}×${asset.height}px` : ""}</div>
      </div>

      <div><label className={label} htmlFor="md-title">Başlık</label><input id="md-title" value={f.titleText} onChange={field("titleText")} className={input} /></div>
      {isImage && (
        <div>
          <label className={label} htmlFor="md-alt">Alt metin (görseli betimleyin)</label>
          <textarea id="md-alt" rows={2} value={f.altText} onChange={field("altText")} className={`${input} resize-none`} />
          <p className="mt-0.5 text-[10px] text-[#5F6570] dark:text-[#8C9099]">{f.altText.trim().length}/125 • Süs görseli ise boş bırakmak yerine kısa bir betimleme yazın.</p>
        </div>
      )}
      <div><label className={label} htmlFor="md-caption">Alt yazı (görselin altında görünür)</label><textarea id="md-caption" rows={2} value={f.caption} onChange={field("caption")} className={`${input} resize-none`} /></div>
      <div><label className={label} htmlFor="md-desc">Açıklama</label><textarea id="md-desc" rows={3} value={f.description} onChange={field("description")} className={`${input} resize-none`} /></div>

      {isImage && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label} htmlFor="md-fx">Odak X ({f.focalX}%)</label><input id="md-fx" type="range" min={0} max={100} value={f.focalX} onChange={(e) => setF({ ...f, focalX: Number(e.target.value) })} className="w-full" /></div>
          <div><label className={label} htmlFor="md-fy">Odak Y ({f.focalY}%)</label><input id="md-fy" type="range" min={0} max={100} value={f.focalY} onChange={(e) => setF({ ...f, focalY: Number(e.target.value) })} className="w-full" /></div>
        </div>
      )}

      <div className={`rounded border ${border} p-2`}>
        <div className="mb-1 flex items-center justify-between"><span className={label}>SEO denetimi</span><span className="rounded bg-[#266DF0]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold">{report.score}/100</span></div>
        {report.issues.length === 0 ? <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Sorun görünmüyor.</p> : (
          <ul className="space-y-1">{report.issues.map((i) => { const Icon = SEVERITY[i.severity]; return <li key={i.code} className={`flex gap-1.5 text-[11px] ${SEVERITY_CLASS[i.severity]}`}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{i.message}</span></li>; })}</ul>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input readOnly aria-label="Dosya adresi" value={absolute} onFocus={(e) => e.currentTarget.select()} className={`${input} font-mono text-[10px]`} />
        <button type="button" aria-label="Adresi kopyala" onClick={() => { void navigator.clipboard?.writeText(absolute).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border ${border}`}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
      </div>

      {note && <p role={note.kind === "error" ? "alert" : "status"} className={`text-[11px] ${note.kind === "error" ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>{note.text}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !dirty} onClick={() => save()} className={`h-8 flex-1 rounded border ${border} font-medium disabled:opacity-50`}>{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        {primary && <button type="button" disabled={pending} onClick={() => (dirty ? save(primary.onDone) : primary.onDone(asset))} className="h-8 flex-1 rounded bg-[#266DF0] font-medium text-white disabled:opacity-50">{primary.label}</button>}
      </div>
      {children}
    </div>
  );
}
