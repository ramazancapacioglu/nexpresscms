"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { LengthMeter } from "./seo-previews";

interface Props {
  title: string;
  tldr: string;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
}

/**
 * Başlığın hemen altında: arama sonucunda görünen başlık ve açıklama. Boş bırakılırsa otomatik üretilir
 * (başlık / TL;DR); elle yazılan değer her zaman önceliklidir ve başlık değişince kendiliğinden değişmez.
 */
export function SearchSnippetBar(p: Props) {
  const [open, setOpen] = useState(false);
  const autoTitle = !p.metaTitle.trim();
  const autoDesc = !p.metaDescription.trim();
  const effTitle = p.metaTitle.trim() || p.title;
  const effDesc = p.metaDescription.trim() || p.tldr;
  const badge = (auto: boolean) => (
    <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${auto ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400" : "bg-blue-500/15 text-blue-700 dark:text-blue-300"}`}>{auto ? "Otomatik" : "Elle"}</span>
  );
  return (
    <div className="border-t border-[#E6E7EA] px-4 py-1.5 text-[11px] dark:border-[#23262E]">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left text-muted-foreground">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="shrink-0 font-medium text-foreground">Arama sonucu</span>
        <span className="min-w-0 flex-1 truncate">{effTitle || "—"}{effDesc ? ` — ${effDesc}` : ""}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 grid gap-3 pb-1 md:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label htmlFor="snippet-title" className="font-medium">Meta başlık</label>
              {badge(autoTitle)}
              {!autoTitle && <button type="button" onClick={() => p.setMetaTitle("")} className="ml-auto text-[10px] underline">Otomatiğe dön</button>}
            </div>
            <input id="snippet-title" value={p.metaTitle} onChange={(e) => p.setMetaTitle(e.target.value)} placeholder={p.title || "Sayfa başlığı kullanılır"} className="h-8 w-full rounded border border-border bg-background px-2 text-xs" />
            <LengthMeter value={effTitle.length} min={30} max={60} label="Başlık uzunluğu" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label htmlFor="snippet-desc" className="font-medium">Meta açıklama</label>
              {badge(autoDesc)}
              {!autoDesc && <button type="button" onClick={() => p.setMetaDescription("")} className="ml-auto text-[10px] underline">Otomatiğe dön</button>}
            </div>
            <textarea id="snippet-desc" rows={3} value={p.metaDescription} onChange={(e) => p.setMetaDescription(e.target.value)} placeholder={p.tldr || "TL;DR veya içeriğin ilk paragrafı kullanılır"} className="w-full rounded border border-border bg-background p-2 text-xs" />
            <LengthMeter value={effDesc.length} min={70} max={160} label="Açıklama uzunluğu" />
          </div>
        </div>
      )}
    </div>
  );
}
