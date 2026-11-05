"use client";

import React, { useState } from "react";
import { runOps } from "../content-ops/ops-client";

/** Ürün başlığı ve kısa yanıt önerisi. Uygula kaydı yazar; öneri kendiliğinden kaydolmaz. */
export function CatalogRewrite({ contentId }: { contentId: string }) {
  const [title, setTitle] = useState("");
  const [tldr, setTldr] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggest = async () => {
    setBusy(true);
    const res = await runOps("catalog.suggest", { contentId });
    setBusy(false);
    if (!res.ok) {
      setNote(res.error ?? "Öneri alınamadı.");
      return;
    }
    setTitle(String(res.data?.title ?? ""));
    setTldr(String(res.data?.tldr ?? ""));
    const method = res.data?.method === "model" ? "Model önerisi" : "Kural önerisi";
    setNote(method);
  };

  const apply = async () => {
    setBusy(true);
    const res = await runOps("catalog.apply", { contentId, title, tldr });
    setBusy(false);
    setNote(res.ok ? "Ürün kaydına yazıldı." : (res.error ?? "Yazılamadı."));
  };

  return (
    <div className="mt-2 space-y-1.5">
      <button type="button" onClick={() => void suggest()} disabled={busy} className="rounded border border-nx-line bg-nx-card px-2 py-0.5 text-[10px] font-semibold text-nx-fg disabled:opacity-50">
        Yeniden yaz
      </button>
      {note && <p className="text-[10px] text-nx-soft">{note}</p>}
      {title && (
        <div className="space-y-1">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border border-nx-line bg-nx-card px-2 py-1 text-[11px] text-nx-fg" />
          <textarea value={tldr} onChange={(e) => setTldr(e.target.value)} rows={2} className="w-full rounded border border-nx-line bg-nx-card px-2 py-1 text-[11px] text-nx-fg" />
          <button type="button" onClick={() => void apply()} disabled={busy} className="rounded bg-nx-primary px-2 py-0.5 text-[10px] font-semibold text-nx-primary-fg disabled:opacity-50">
            Ürüne uygula
          </button>
        </div>
      )}
    </div>
  );
}
