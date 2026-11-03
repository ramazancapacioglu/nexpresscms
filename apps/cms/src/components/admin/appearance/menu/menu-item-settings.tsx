"use client";

import React from "react";
import type { MegaMenuConfig, MenuLookup, NavigationMenuItem } from "@nexpress/core";
import { resolveMenuHref } from "@nexpress/core";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { IconPickerField } from "@/components/admin/editor/icon-picker-modal";

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

const MEGA_PRESETS: Array<{ id: string; label: string; config: MegaMenuConfig }> = [
  {
    id: "solutions-3col",
    label: "3 Sütun Çözüm Vitrini",
    config: {
      enabled: true,
      mode: "custom",
      columns: 3,
      width: "wide",
      items: [
        { id: "mp_1", label: "Görsel Blok Stüdyosu", description: "Satır, sütun ve zengin sekmelerle sayfa tasarımı.", href: "/tr/kurumsal", icon: "layers", badge: "YENİ" },
        { id: "mp_2", label: "E-Ticaret & POS", description: "Mağaza vitrini, varyant ve sepet yönetimi.", href: "/tr/magaza", icon: "shopping-bag", badge: "PRO" },
        { id: "mp_3", label: "Teknik SEO & GEO", description: "Otomatik JSON-LD şema ve yapay zeka indeksleme.", href: "/tr/dokuman", icon: "sparkles" },
        { id: "mp_4", label: "Kurumsal Güvenlik", description: "Çoklu kiracı izolasyonu ve rol denetimi.", href: "/tr/kurumsal", icon: "shield" },
        { id: "mp_5", label: "Yüksek Hız (0-KB RSC)", description: "100/100 Lighthouse skoru ve anında açılış.", href: "/tr/dokuman", icon: "zap" },
        { id: "mp_6", label: "7/24 Uzman Destek", description: "Kurulum ve özel entegrasyon danışmanlığı.", href: "/tr/iletisim", icon: "headphones" },
      ],
      promoBanner: {
        title: "Kurumsal Demo & Geçiş Rehberi",
        subtitle: "Mevcut sitenizi tek tıkla yeni nesil altyapıya taşıyın.",
        ctaText: "Hemen İncele",
        ctaHref: "/tr/kurumsal",
      },
    },
  },
  {
    id: "commerce-4col",
    label: "4 Sütun Mağaza Kategorileri",
    config: {
      enabled: true,
      mode: "custom",
      columns: 4,
      width: "full",
      items: [
        { id: "mc_1", label: "Yazılım Paketleri", description: "Kurumsal lisans ve abonelikler", href: "/tr/magaza", icon: "cpu", badge: "POPÜLER" },
        { id: "mc_2", label: "POS & Ödeme Donanımı", description: "Saha satış ve yazar kasa çözümleri", href: "/tr/magaza", icon: "credit-card" },
        { id: "mc_3", label: "Bulut Barındırma", description: "Yüksek erişilebilirlikli sunucular", href: "/tr/magaza", icon: "cloud" },
        { id: "mc_4", label: "Eğitim & Danışmanlık", description: "Ekip içi teknik eğitim paketleri", href: "/tr/magaza", icon: "graduation-cap" },
      ],
      promoBanner: {
        title: "Tüm Mağaza Ürünlerinde Ücretsiz Kurulum",
        subtitle: "Yıllık kurumsal alımlarda %20 indirim avantajı.",
        ctaText: "Mağazaya Git",
        ctaHref: "/tr/magaza",
      },
    },
  },
];

/** Seçili menü öğesinin ayarları + (yalnızca kök öğede) zengin mega menü yapılandırması. */
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

      <div>
        <span className={cap}>Menü simgesi (isteğe bağlı)</span>
        <IconPickerField
          value={item.icon ?? ""}
          onChange={(icon) => onChange({ icon: icon || undefined })}
          placeholder="Simge seçin (ör: roket, mağaza, telefon)…"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className={cap}>Rozet</span><input value={item.badge ?? ""} onChange={(e) => onChange({ badge: e.target.value })} placeholder="Yeni / Pro" maxLength={20} className={box} /></label>
        <label className="flex items-end gap-2 pb-1.5"><input type="checkbox" checked={item.target === "_blank"} onChange={(e) => onChange({ target: e.target.checked ? "_blank" : "_self" })} /> Yeni sekmede aç</label>
      </div>
      <label className="block"><span className={cap}>Kısa açıklama (mega menüde gösterilir)</span><input value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} maxLength={120} className={box} /></label>

      {isRoot && (
        <fieldset className="space-y-3 rounded-lg border border-[#D5D8DE] p-3 dark:border-[#2E333D]">
          <legend className="px-1 text-[13px] font-semibold">Mega menü</legend>
          <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(mega?.enabled)} onChange={(e) => (e.target.checked ? setMega({ enabled: true }) : onChange({ megaMenu: undefined }))} /> Bu öğe için mega menü kullan</label>

          {/* Hazır Mega Menü Şablonları */}
          <div className="space-y-1.5 rounded-md bg-[#F8FAFC] p-2.5 dark:bg-[#181B22]">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5" /> Hazır Mega Menü Düzeni Yükle
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MEGA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ megaMenu: structuredClone(preset.config) })}
                  className="rounded border border-[#D5D8DE] bg-white px-2.5 py-1.5 text-left text-[11px] font-medium hover:border-blue-500 dark:border-[#2E333D] dark:bg-[#121317]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {mega?.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className={cap}>İçerik kaynağı</span>
                  <select value={mega.mode ?? (mega.items.length > 0 ? "custom" : "children")} onChange={(e) => setMega({ mode: e.target.value as "children" | "custom" })} className={box}>
                    <option value="children">Alt öğelerden (sütun = alt öğe)</option>
                    <option value="custom">Özel İkonlu Kartlar</option>
                  </select></label>
                <label className="block"><span className={cap}>Sütun sayısı</span>
                  <select value={mega.columns} onChange={(e) => setMega({ columns: Number(e.target.value) })} className={box}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                <label className="col-span-2 block"><span className={cap}>Genişlik</span>
                  <select value={mega.width ?? "wide"} onChange={(e) => setMega({ width: e.target.value as "narrow" | "wide" | "full" })} className={box}>
                    <option value="narrow">Dar (440 px)</option><option value="wide">Geniş (760 px)</option><option value="full">Tam genişlik (1120 px)</option>
                  </select></label>
              </div>
              {(mega.mode ?? (mega.items.length > 0 ? "custom" : "children")) === "children" ? (
                <p className="rounded bg-[#F1F3F6] p-2 text-[12px] dark:bg-[#1C1F26]">{hasChildren ? "Bu öğenin alt öğeleri sütun başlığı olur; onların alt öğeleri sütundaki bağlantılardır. Her alt öğeye simge ve açıklama ekleyebilirsiniz." : "Önce bu öğeye alt öğe ekleyin (öğeyi seçip bir sonrakini girintileyin) veya yukarıdan 'Özel İkonlu Kartlar' moduna geçin."}</p>
              ) : (
                <div className="space-y-2">
                  {mega.items.map((c, i) => (
                    <div key={c.id} className="space-y-1.5 rounded border border-[#D5D8DE] p-2.5 dark:border-[#2E333D]">
                      <div className="flex gap-2">
                        <input aria-label="Kart başlığı" placeholder="Kart başlığı" value={c.label} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={box} />
                        <button type="button" aria-label="Kartı sil" className="text-red-600" onClick={() => setMega({ items: mega.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input aria-label="Kart adresi" placeholder="/tr/sayfa" value={c.href} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })} className={`${box} font-mono`} />
                        <input aria-label="Kart rozeti" placeholder="Rozet (YENİ / PRO)" value={c.badge ?? ""} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, badge: e.target.value || undefined } : x)) })} className={box} />
                      </div>
                      <IconPickerField
                        value={c.icon ?? ""}
                        onChange={(icon) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, icon: icon || undefined } : x)) })}
                        placeholder="Kart simgesi seçin…"
                      />
                      <input aria-label="Kart açıklaması" placeholder="Kısa açıklama" value={c.description ?? ""} onChange={(e) => setMega({ items: mega.items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} className={box} />
                    </div>
                  ))}
                  <button type="button" disabled={mega.items.length >= 24} className="inline-flex items-center gap-1 text-[12px] font-medium underline disabled:opacity-50" onClick={() => setMega({ items: [...mega.items, { id: `mc_${Date.now()}`, label: "Yeni Kart", href: "/tr", icon: "sparkles" }] })}><Plus className="h-3.5 w-3.5" /> Mega menüye kart ekle</button>
                </div>
              )}
              <div className="space-y-1.5 border-t border-[#D5D8DE] pt-2 dark:border-[#2E333D]">
                <div className="text-[12px] font-semibold">Alt tanıtım şeridi (isteğe bağlı)</div>
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
