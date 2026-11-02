"use client";

import { useState, useTransition } from "react";
import { Eye, ExternalLink } from "lucide-react";
import { createDraftPreviewLinkAction } from "@/app/admin/preview-actions";

const btn = "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50";

/** Son kaydedilmiş taslağı (yayında olmasa da) yeni sekmede açar; bağlantı süreli ve imzalıdır, arama motorlarına kapalıdır. */
export function PreviewButton({ contentId, locale, dirty }: { contentId?: string; locale: string; dirty: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const open = () => {
    // Açılır pencere engelini aşmak için sekme tıklamayla eşzamanlı açılır, adres sonra atanır.
    const tab = window.open("about:blank", "_blank");
    setMsg("");
    start(async () => {
      const r = await createDraftPreviewLinkAction({ contentId: contentId!, locale, days: 1 });
      if (!r.ok) {
        tab?.close();
        setMsg(r.error);
        return;
      }
      if (tab) tab.location.href = window.location.origin + r.path;
      else setMsg("Açılır pencere engellendi; tarayıcıda bu site için izin verin.");
    });
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" disabled={!contentId || pending} onClick={open} title={contentId ? (dirty ? "Son kaydedilmiş hali açılır; kaydedilmemiş değişiklikler görünmez" : "Yeni sekmede önizle") : "Önce kaydedin"} className={btn}>
        <Eye className="h-3.5 w-3.5" /> <span className="hidden lg:inline">{pending ? "Açılıyor…" : "Önizle"}</span>
      </button>
      {dirty && contentId && <span className="hidden text-[10px] text-amber-800 dark:text-amber-300 xl:inline">kayıtlı hali</span>}
      {msg && <span role="status" className="text-[11px] text-rose-700 dark:text-rose-300">{msg}</span>}
    </span>
  );
}

/** Ziyaretçinin gördüğü gerçek sayfayı (son kayıtlı, yayındaki hali) yeni sekmede açar. */
export function ViewLiveButton({ slug, locale, published, saved, dirty }: { slug: string; locale: string; published: boolean; saved: boolean; dirty: boolean }) {
  const ok = saved && published && Boolean(slug);
  const title = !saved ? "Önce kaydedin" : !published ? "Henüz yayında değil; önce Yayınla" : dirty ? "Yayındaki hali açılır; kaydedilmemiş değişiklikler görünmez" : "Gerçek sayfayı yeni sekmede göster";
  const path = `/${locale}/${encodeURIComponent(slug)}`;
  return ok ? (
    <a href={path} target="_blank" rel="noopener" title={title} className={btn}>
      <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Göster</span>
    </a>
  ) : (
    <button type="button" disabled title={title} className={btn}>
      <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Göster</span>
    </button>
  );
}
