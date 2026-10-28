"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { activateUploadedThemeAction, deleteUploadedThemeAction } from "./actions";

export interface ThemeCardData {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  tagline: string;
  checksum: string;
  isActive: boolean;
  screenshot: string | null;
  swatches: string[];
  pages: number;
  hasChrome: boolean;
  hasCss: boolean;
  installedAt: string;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = "h-7 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50";

export function ThemeCard({ theme, previewPath }: { theme: ThemeCardData; previewPath: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState(false);
  const [applyChrome, setApplyChrome] = useState(theme.hasChrome);
  const [addPages, setAddPages] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const activate = () =>
    start(async () => {
      try {
        const res = await activateUploadedThemeAction({ themeId: theme.id, applyChrome, addPages });
        if (res.ok) {
          setDialog(false);
          setMsg({ tone: "ok", text: `Etkinleştirildi${res.chromeApplied ? " · üst/alt şablon uygulandı" : ""}${addPages ? ` · ${res.pagesAdded} sayfa taslak eklendi, ${res.pagesSkipped} atlandı` : ""}.` });
          router.refresh();
        } else setMsg({ tone: "err", text: res.error });
      } catch {
        setMsg({ tone: "err", text: "İşlem tamamlanamadı." });
      }
    });

  const remove = () => {
    if (!window.confirm(`“${theme.name}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    start(async () => {
      const res = await deleteUploadedThemeAction({ themeId: theme.id });
      if (res.ok) router.refresh();
      else setMsg({ tone: "err", text: res.error });
    });
  };

  return (
    <article className={`flex flex-col overflow-hidden rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
      <div className="relative h-36 bg-[#F4F5F7] dark:bg-[#1C1E24]">
        {theme.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.screenshot} alt={`${theme.name} önizleme görseli`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end gap-1 p-3">
            {theme.swatches.map((c, i) => (
              <span key={i} title={c} className="h-10 flex-1 rounded" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        {theme.isActive && <span className="absolute right-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">Etkin</span>}
      </div>
      <div className="flex-1 space-y-1.5 p-3.5">
        <h3 className="text-[13px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">
          {theme.name} <span className="font-mono text-[10px] font-normal text-[#5F6570] dark:text-[#8C9099]">v{theme.version}</span>
        </h3>
        {theme.description && <p className="text-[12px] leading-relaxed text-[#5C5F66] dark:text-[#9CA3AF]">{theme.description}</p>}
        <p className="flex flex-wrap gap-1.5 text-[10px] text-[#5F6570] dark:text-[#8C9099]">
          {theme.author && <span>{theme.author}</span>}
          <span>{theme.pages} sayfa</span>
          <span>{theme.hasChrome ? "şablon" : "şablonsuz"}</span>
          <span>{theme.hasCss ? "CSS" : "CSS yok"}</span>
          <span className="font-mono" title="Paket özeti (SHA-256)">#{theme.checksum.slice(0, 8)}</span>
        </p>
        {msg && (
          <p role={msg.tone === "err" ? "alert" : "status"} className={`text-[11px] ${msg.tone === "ok" ? "text-emerald-800 dark:text-emerald-300" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
      <div className={`flex flex-wrap items-center gap-1.5 border-t ${border} p-2.5`}>
        <a href={`${previewPath}?nx_preview=${encodeURIComponent(theme.id)}`} target="_blank" rel="noreferrer" className={`${btn} inline-flex items-center`}>
          Önizle
        </a>
        {!theme.isActive && (
          <button type="button" disabled={pending} onClick={() => setDialog(true)} className="h-7 rounded-md bg-[#266DF0] px-2.5 text-[12px] font-semibold text-white disabled:opacity-50">
            Etkinleştir
          </button>
        )}
        <a href={`/api/admin/themes/export?id=${encodeURIComponent(theme.id)}`} className={`${btn} inline-flex items-center`}>
          Dışa aktar
        </a>
        {!theme.isActive && (
          <button type="button" disabled={pending} onClick={remove} className="ml-auto h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10 disabled:opacity-50">
            Sil
          </button>
        )}
      </div>

      {dialog && (
        <div role="dialog" aria-modal="true" aria-label={`${theme.name} etkinleştir`} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDialog(false)}>
          <div className={`w-full max-w-md space-y-3 rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[14px] font-semibold">“{theme.name}” etkinleştirilsin mi?</h4>
            <p className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">Sitenin renk, yazı tipi ve geometri ayarları bu temanın değerleriyle değişir. Mevcut içeriğiniz değişmez.</p>
            <label className={`flex items-start gap-2 text-[12px] ${theme.hasChrome ? "" : "opacity-50"}`}>
              <input type="checkbox" checked={applyChrome && theme.hasChrome} disabled={!theme.hasChrome} onChange={(e) => setApplyChrome(e.target.checked)} className="mt-0.5" />
              <span><strong>Üst ve alt şablonu uygula</strong><br />Header/footer yapılandırması tüm site dillerinde değişir (menü bağlantılarınız korunur).</span>
            </label>
            <label className={`flex items-start gap-2 text-[12px] ${theme.pages > 0 ? "" : "opacity-50"}`}>
              <input type="checkbox" checked={addPages && theme.pages > 0} disabled={theme.pages === 0} onChange={(e) => setAddPages(e.target.checked)} className="mt-0.5" />
              <span><strong>Başlangıç sayfalarını taslak olarak ekle ({theme.pages})</strong><br />Aynı adresli mevcut sayfa atlanır, hiçbiri ezilmez.</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setDialog(false)} className={btn}>Vazgeç</button>
              <button type="button" disabled={pending} onClick={activate} className="h-7 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white disabled:opacity-60">
                {pending ? "Uygulanıyor…" : "Etkinleştir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
