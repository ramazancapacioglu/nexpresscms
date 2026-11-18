"use client";

import React from "react";
import { useStudioInspector } from "./studio-inspector-context";

const box = "h-8 w-full rounded border border-border bg-background px-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary";
const cap = "mb-1 block text-[11px] font-medium text-muted-foreground";

/** `contact_campaign` modeli: yalnızca bağlama alanları. Kart ve form tasarımı modelden gelir, sayfada tekrarlanmaz. */
export function ContactCampaignFields() {
  const { selectedBlock, updateSelectedBlockProps } = useStudioInspector();
  if (!selectedBlock) return null;
  const p = selectedBlock.props ?? {};
  const set = (patch: Record<string, unknown>) => updateSelectedBlockProps(patch);
  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-border bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
        Sayfadaki çözüme bağlı yayındaki kampanyayı ve formu yan yana getirir. Kampanya, kampanya kaydındaki &quot;ürün sayfası&quot; adresiyle eşleşir; eşleşen yoksa form tek başına görünür.
      </p>
      <label className="block">
        <span className={cap}>Form kimliği (örn. frm_wp_12625)</span>
        <input className={box} value={String(p.formId ?? "")} onChange={(e) => set({ formId: e.target.value.trim() })} />
      </label>
      <label className="block">
        <span className={cap}>Çözüm sayfası adresi (boşsa bu sayfa)</span>
        <input className={box} value={String(p.productUrl ?? "")} placeholder="/akinsoft-wolvox-restoran-yonetimi" onChange={(e) => set({ productUrl: e.target.value.trim() })} />
      </label>
      <label className="block">
        <span className={cap}>Belirli kampanya adresi (isteğe bağlı)</span>
        <input className={box} value={String(p.campaignSlug ?? "")} onChange={(e) => set({ campaignSlug: e.target.value.trim() })} />
      </label>
      <label className="block">
        <span className={cap}>Başlık</span>
        <input className={box} value={String(p.heading ?? "")} onChange={(e) => set({ heading: e.target.value })} />
      </label>
      <label className="block">
        <span className={cap}>Kısa not</span>
        <input className={box} value={String(p.note ?? "")} onChange={(e) => set({ note: e.target.value })} />
      </label>
    </div>
  );
}
