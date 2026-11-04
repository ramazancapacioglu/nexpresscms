"use client";

import React, { useState } from "react";
import type { MegaMenuConfig, MenuLookup, NavigationMenuItem } from "@nexpress/core";
import { resolveMenuHref } from "@nexpress/core";
import { Plus, Sparkles, Trash2, X, Sliders } from "lucide-react";
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

/** Seçili menü öğesinin ayarları + (yalnızca kök öğede) açılır dialog modal ile zengin mega menü yapılandırması. */
export function MenuItemSettings({ item, isRoot, hasChildren, lookup, onChange }: Props) {
  const [isMegaModalOpen, setIsMegaModalOpen] = useState(false);
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
      <label className="block"><span className={cap}>Kısa açıklama</span><input value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} maxLength={120} className={box} /></label>

      {/* Mega Menü Ayarları (Dialog Modal ile Açılır — Sayfayı ve Yan Paneli Uzatmaz) */}
      {isRoot && (
        <div className="pt-3 border-t border-[#D5D8DE] dark:border-[#2E333D] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Mega Menü Düzeni</span>
            {mega?.enabled ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                AKTİF
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Kapalı</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMegaModalOpen(true)}
            className="w-full py-2 px-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mega Menüyü Yapılandır (Modal)</span>
          </button>
        </div>
      )}

      {/* MEGA MENÜ DIALOG MODAL */}
      {isMegaModalOpen && isRoot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-foreground">
                  {item.label} — Mega Menü Yapılandırması
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMegaModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <label className="flex items-center gap-2.5 font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  checked={Boolean(mega?.enabled)}
                  onChange={(e) =>
                    e.target.checked
                      ? setMega({ enabled: true })
                      : onChange({ megaMenu: undefined })
                  }
                />
                <span>Bu öğe için mega menüyü etkinleştir</span>
              </label>

              {mega?.enabled && (
                <>
                  {/* Hazır Mega Menü Şablonları */}
                  <div className="space-y-2 rounded-xl bg-muted/40 p-3.5 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Sparkles className="h-4 w-4" /> Hazır Düzen Şablonu Yükle
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {MEGA_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onChange({ megaMenu: structuredClone(preset.config) })}
                          className="rounded-lg border border-border bg-card p-2.5 text-left text-xs font-semibold hover:border-blue-500 hover:shadow-2xs transition"
                        >
                          <div className="font-bold text-foreground">{preset.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {preset.config.columns} sütun • {preset.config.items.length} kart
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sütun & Genişlik */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className={cap}>İçerik Kaynağı</span>
                      <select
                        value={mega.mode ?? (mega.items.length > 0 ? "custom" : "children")}
                        onChange={(e) => setMega({ mode: e.target.value as "children" | "custom" })}
                        className={box}
                      >
                        <option value="children">Alt öğelerden (otomatik sütun)</option>
                        <option value="custom">Özel İkonlu Kartlar</option>
                      </select>
                    </div>

                    <div>
                      <span className={cap}>Sütun Sayısı</span>
                      <select
                        value={mega.columns}
                        onChange={(e) => setMega({ columns: Number(e.target.value) })}
                        className={box}
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} Sütun
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className={cap}>Genişlik</span>
                      <select
                        value={mega.width ?? "wide"}
                        onChange={(e) => setMega({ width: e.target.value as "narrow" | "wide" | "full" })}
                        className={box}
                      >
                        <option value="narrow">Dar (440 px)</option>
                        <option value="wide">Geniş (760 px)</option>
                        <option value="full">Tam Genişlik (1120 px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Mod İçeriği */}
                  {(mega.mode ?? (mega.items.length > 0 ? "custom" : "children")) === "children" ? (
                    <div className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed border border-border">
                      {hasChildren
                        ? "Bu öğenin alt öğeleri sütun başlığı olur; onların alt öğeleri sütundaki bağlantılardır. Her alt öğeye simge ve açıklama ekleyebilirsiniz."
                        : "Önce bu öğeye alt öğe ekleyin (öğeyi seçip bir sonrakini girintileyin) veya yukarıdan 'Özel İkonlu Kartlar' moduna geçin."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">
                          Özel Kartlar ({mega.items.length}/24)
                        </span>
                        <button
                          type="button"
                          disabled={mega.items.length >= 24}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                          onClick={() =>
                            setMega({
                              items: [
                                ...mega.items,
                                {
                                  id: `mc_${Date.now()}`,
                                  label: "Yeni Kart",
                                  href: "/tr",
                                  icon: "sparkles",
                                },
                              ],
                            })
                          }
                        >
                          <Plus className="h-4 w-4" /> Kart Ekle
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                        {mega.items.map((c, i) => (
                          <div
                            key={c.id}
                            className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-2xs"
                          >
                            <div className="flex gap-2">
                              <input
                                placeholder="Kart başlığı"
                                value={c.label}
                                onChange={(e) =>
                                  setMega({
                                    items: mega.items.map((x, j) =>
                                      j === i ? { ...x, label: e.target.value } : x
                                    ),
                                  })
                                }
                                className={box}
                              />
                              <button
                                type="button"
                                title="Kartı sil"
                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 p-1.5 rounded-lg"
                                onClick={() =>
                                  setMega({
                                    items: mega.items.filter((_, j) => j !== i),
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                placeholder="Adres (/tr/sayfa)"
                                value={c.href}
                                onChange={(e) =>
                                  setMega({
                                    items: mega.items.map((x, j) =>
                                      j === i ? { ...x, href: e.target.value } : x
                                    ),
                                  })
                                }
                                className={`${box} font-mono text-xs`}
                              />
                              <input
                                placeholder="Rozet (YENİ / PRO)"
                                value={c.badge ?? ""}
                                onChange={(e) =>
                                  setMega({
                                    items: mega.items.map((x, j) =>
                                      j === i ? { ...x, badge: e.target.value || undefined } : x
                                    ),
                                  })
                                }
                                className={box}
                              />
                            </div>

                            <IconPickerField
                              value={c.icon ?? ""}
                              onChange={(icon) =>
                                setMega({
                                  items: mega.items.map((x, j) =>
                                    j === i ? { ...x, icon: icon || undefined } : x
                                  ),
                                })
                              }
                              placeholder="Simge seçin…"
                            />

                            <input
                              placeholder="Kısa açıklama metni"
                              value={c.description ?? ""}
                              onChange={(e) =>
                                setMega({
                                  items: mega.items.map((x, j) =>
                                    j === i ? { ...x, description: e.target.value } : x
                                  ),
                                })
                              }
                              className={box}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alt Tanıtım Şeridi */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="text-xs font-bold text-foreground">
                      Alt Tanıtım Şeridi (İsteğe Bağlı)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Tanıtım Başlığı"
                        value={promo.title}
                        onChange={(e) =>
                          setMega({ promoBanner: { ...promo, title: e.target.value } })
                        }
                        className={box}
                      />
                      <input
                        placeholder="Alt Metin"
                        value={promo.subtitle}
                        onChange={(e) =>
                          setMega({ promoBanner: { ...promo, subtitle: e.target.value } })
                        }
                        className={box}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Buton Metni"
                        value={promo.ctaText}
                        onChange={(e) =>
                          setMega({ promoBanner: { ...promo, ctaText: e.target.value } })
                        }
                        className={box}
                      />
                      <input
                        placeholder="Buton Adresi (/tr/kampanya)"
                        value={promo.ctaHref}
                        onChange={(e) =>
                          setMega({ promoBanner: { ...promo, ctaHref: e.target.value } })
                        }
                        className={`${box} font-mono`}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3 border-t border-border bg-muted/40">
              <button
                type="button"
                onClick={() => setIsMegaModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition"
              >
                Tamamla ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
