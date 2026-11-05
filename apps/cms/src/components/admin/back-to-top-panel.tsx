"use client";

import type { SiteCustomizerSettings } from "@nexpress/core";

/** Özelleştiricide başa dön düğmesinin yeri, ikonu, rengi ve boyu. */
export function BackToTopPanel({ customizer, setCustomizer }: { customizer: SiteCustomizerSettings; setCustomizer: (next: SiteCustomizerSettings | ((prev: SiteCustomizerSettings) => SiteCustomizerSettings)) => void }) {
  const top = customizer.backToTop;
  const patch = (p: Partial<SiteCustomizerSettings["backToTop"]>) =>
    setCustomizer((prev) => ({ ...prev, backToTop: { ...prev.backToTop, ...p } }));
  return (
    <div className="rounded-lg border border-border p-3 space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Başa dön</div>
      <label className="flex items-center gap-2 text-[12px]">
        <input type="checkbox" checked={top.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
        Sayfa başı düğmesini göster
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-semibold">
          Konum
          <select aria-label="Başa dön konumu" value={top.position} onChange={(e) => patch({ position: e.target.value === "left" ? "left" : "right" })} className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-normal">
            <option value="right">Sağ</option>
            <option value="left">Sol</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold">
          İkon
          <select aria-label="Başa dön ikonu" value={top.icon} onChange={(e) => patch({ icon: e.target.value === "chevron" || e.target.value === "corner" ? e.target.value : "arrow" })} className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-normal">
            <option value="arrow">Ok</option>
            <option value="chevron">Şevron</option>
            <option value="corner">Köşe</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold">
          Boyut
          <select aria-label="Başa dön boyutu" value={top.size} onChange={(e) => patch({ size: e.target.value === "sm" || e.target.value === "lg" ? e.target.value : "md" })} className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-normal">
            <option value="sm">Küçük</option>
            <option value="md">Orta</option>
            <option value="lg">Büyük</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold">
          Renk
          <input aria-label="Başa dön rengi" type="color" value={top.color} onChange={(e) => patch({ color: e.target.value })} className="mt-1 h-8 w-full rounded border border-border bg-background" />
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">Düğme sayfanın başına kaydırır. Ziyaretçi sayfasına ek kod yüklenmez.</p>
    </div>
  );
}
