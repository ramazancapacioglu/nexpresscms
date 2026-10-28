"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { createDraftPreviewLinkAction } from "@/app/admin/preview-actions";

/** Editör çubuğunda: kaydedilmiş taslak için paylaşılabilir, süreli önizleme bağlantısı üretir. */
export function PreviewLinkButton({ contentId, locale, dirty }: { contentId?: string; locale: string; dirty: boolean }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const create = () =>
    start(async () => {
      const r = await createDraftPreviewLinkAction({ contentId: contentId!, locale, days });
      setUrl(r.ok ? r.url : "");
      setMsg(r.ok ? `${new Date(r.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar geçerli.` : r.error);
    });
  return (
    <div className="relative">
      <button type="button" disabled={!contentId} title={contentId ? "Paylaşılabilir önizleme bağlantısı" : "Önce kaydedin"} onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50">
        <Link2 className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Önizleme bağlantısı</span>
      </button>
      {open && contentId && (
        <div className="absolute right-0 top-9 z-50 w-80 space-y-2 rounded-lg border border-border bg-background p-3 text-xs shadow-lg">
          <p>Bağlantıya sahip herkes bu sayfanın <strong>son kaydedilmiş</strong> halini, yayında olmasa bile görür. Arama motorlarına kapalıdır.</p>
          {dirty && <p className="text-amber-600">Kaydedilmemiş değişiklikler görünmez; önce kaydedin.</p>}
          <label className="flex items-center gap-2">Geçerlilik
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-7 rounded border border-border bg-background px-1">
              <option value={1}>1 gün</option><option value={7}>7 gün</option><option value={30}>30 gün</option>
            </select>
          </label>
          <button type="button" disabled={pending} onClick={create} className="h-7 rounded-md bg-blue-600 px-3 font-semibold text-white disabled:opacity-50">{pending ? "Üretiliyor…" : "Bağlantı üret"}</button>
          {url && (
            <div className="space-y-1">
              <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-7 w-full rounded border border-border bg-muted px-2 font-mono text-[10px]" />
              <button type="button" onClick={() => void navigator.clipboard?.writeText(url).then(() => setMsg("Kopyalandı."))} className="text-blue-600 underline">Kopyala</button>
            </div>
          )}
          {msg && <p role="status" className="text-muted-foreground">{msg}</p>}
        </div>
      )}
    </div>
  );
}
