"use client";

import React from "react";
import type { MegaMenuConfig, MenuLookup, NavigationMenuItem } from "@nexpress/core";
import { resolveMenuHref } from "@nexpress/core";
import { Plus, Trash2 } from "lucide-react";

const box = "w-full rounded border border-[#D5D8DE] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#266DF0]/40 dark:border-[#2E333D] dark:bg-[#121317]";
const cap = "mb-1 block text-[12px] font-medium";

interface Props {
  item: NavigationMenuItem;
  isRoot: boolean;
  hasChildren: boolean;
  lookup: MenuLookup;
  onChange: (patch: Partial<NavigationMenuItem>) => void;
}

const DEFAULT_MEGA: MegaMenuConfig = { enabled: true, mode: "children", columns: 3, width: "wide", items: [] };

/** Seçili menü öğesinin ayarları + (yalnızca kök öğede) mega menü yapılandırması. */
export function MenuItemSettings({ item, isRoot, hasChildren, lookup, onChange }: Props) {
  const mega = item.megaMenu;
  const resolved = resolveMenuHref(item.source, item.href, lookup);
  const isCustom = !item.source || item.source.kind === "custom";
  const setMega = (patch: Partial<MegaMenuConfig>) => onChange({ megaMenu: { ...(mega ?? DEFAULT_MEGA), ...patch } });
  const promo = mega?.promoBanner ?? { title: "", subtitle: "", ctaText: "", ctaHref: "" };

  return (
    <div className="space-y-3 text-[13px]">
      <div className="text-[14px] font-semibold">Bağlantı ayarları</div>
      <label className="block"><span className={cap}>Gösterilen ad</span><input value={item.label} onChange={(e) => onChange({ label: e.target.value })} className={box} maxLength={80} /></label>
      {isCustom ? (
        <label className="block"><span className={cap}>Adres</span><input value={item.href} onChange={(e) => onChange({ href: e.target.value })} className={`${box} font-mono`} /></label>
      ) : (
        <div>
          <span className={cap}>Hedef (otomatik güncel kalır)</span>
          <div className="rounded border border-[#D5D8DE] bg-[#F1F3F6] px-2.5 py-1.5 font-mono text-[12px] dark:border-[#2E333D] dark:bg-[#1C1F26]">{resolved ?? "Hedef bulunamadı"}</div>
          <button type="button" className="mt-1 text-[12px] underline" onClick={() => onChange({ source: { kind: "custom" }, href: resolved ?? item.href })}>Özel bağlantıya çevir (adresi elle düzenle)</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className={cap}>Rozet</span><input value={item.badge ?? ""} onChange={(e) => onChange({ badge: e.target.value })} placeholder="Yeni" maxLength={20} className={box} /></label>
        <label className="flex items-end gap-2 pb-1.5"><input type="checkbox" checked={item.target === "_blank"} onChange={(e) => onChange({ target: e.target.checked ? "_blank" : "_self" })} /> Yeni sekmede aç</label>
      </div>
      <label className="block"><span className={cap}>Kısa açıklama (mega menüde gösterilir)</span><input value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} maxLength={120} className={box} /></label>

      {isRoot && (
        <fieldset className="space-y-3 rounded-lg border border-[#D5D8DE] p-3 dark:border-[#2E333D]">
          <legend className="px-1 text-[13px] font-semibold">Mega menü</legend>
          <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(mega?.enabled)} onChange={(e) => (e.target.checked ? setMega({ enabled: true }) : onChange({ megaMenu: undefined }))} /> Bu öğe için mega menü kullan</label>
          {mega?.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className={cap}>İçerik kaynağı</span>
                  <select value={mega.mode ?? (mega.items.length > 0 ? "custom" : "children")} onChange={(e) => setMega({ mode: e.target.value as "children" | "custom" })} className={box}>
                    <option value="children">Alt öğelerden (sütun = alt öğe)</option>
                    <option value="custom">Elle kartlar</option>
                  </select></label>
                <label className="block"><span className={cap}>Sütun sayısı</span>
                  <select value={mega.columns} onChange={(e) => setMega({ columns: Number(e.target.value) })} className={box}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                <label className="col-span-2 block"><span className={cap}>Genişlik</span>
                  <select value={mega.width ?? "wide"} onChange={(e) => setMega({ width: e.target.value as "narrow" | "wide" | "full" })} className={box}>
                    <option value="narrow">Dar (420 px)</option><option value="wide">Geniş (720 px)</option><option value="full">Tam genişlik</option>
                  </select></label>
              </div>
              {(mega.mode ?? (mega.items.length > 0 ? "custom" : "children")) === "children" ? (
                <p className="rounded bg-[#F1F3F6] p-2 text-[12px] dark:bg-[#1C1F26]">{hasChildren ? "Bu öğenin alt öğeleri sütun olur; onların alt öğeleri sütundaki bağlantılardır." : "Önce bu öğeye alt öğe ekleyin (öğeyi seçip bir sonrakini girintileyin)."}</p>
              ) : (
                <div className="space-y-2">
                  {mega.items.map((c, i) => (
                    <div key={c.id} className="space-y-1.5 rounded border border-[#D5D8DE] p-2 dark:border-[#2E333D]">
                      <div className="flex gap-2">
                        <input aria-label="Kart başlığı" placeholder="Başlık" value={c.label} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={box} />
                        <button type="button" aria-label="Kartı sil" className="text-red-600" onClick={() => setMega({ items: mega.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <input aria-label="Kart adresi" placeholder="/tr/sayfa" value={c.href} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })} className={`${box} font-mono`} />
                      <input aria-label="Kart açıklaması" placeholder="Kısa açıklama" value={c.description ?? ""} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} className={box} />
                    </div>
                  ))}
                  <button type="button" disabled={mega.items.length >= 24} className="inline-flex items-center gap-1 text-[12px] font-medium underline disabled:opacity-50" onClick={() => setMega({ items: [...mega.items, { id: `mc_${Date.now()}`, label: "", href: "/tr" }] })}><Plus className="h-3.5 w-3.5" /> Kart ekle</button>
                </div>
              )}
              <div className="space-y-1.5 border-t border-[#D5D8DE] pt-2 dark:border-[#2E333D]">
                <div className="text-[12px] font-semibold">Tanıtım şeridi (isteğe bağlı)</div>
                <input aria-label="Tanıtım başlığı" placeholder="Başlık" value={promo.title} onChange={(e) => setMega({ promoBanner: { ...promo, title: e.target.value } })} className={box} />
                <input aria-label="Tanıtım alt metni" placeholder="Alt metin" value={promo.subtitle} onChange={(e) => setMega({ promoBanner: { ...promo, subtitle: e.target.value } })} className={box} />
                <div className="grid grid-cols-2 gap-2">
                  <input aria-label="Düğme metni" placeholder="Düğme metni" value={promo.ctaText} onChange={(e) => setMega({ promoBanner: { ...promo, ctaText: e.target.value } })} className={box} />
                  <input aria-label="Düğme adresi" placeholder="/tr/kampanya" value={promo.ctaHref} onChange={(e) => setMega({ promoBanner: { ...promo, ctaHref: e.target.value } })} className={`${box} font-mono`} />
                </div>
                {promo.title ? <button type="button" className="text-[12px] underline" onClick={() => setMega({ promoBanner: undefined })}>Tanıtım şeridini kaldır</button> : null}
              </div>
            </>
          )}
        </fieldset>
      )}
    </div>
  );
}
