"use client";

import React, { useState, useTransition } from "react";
import {
  createDefaultWidget,
  FOOTER_LAYOUT_PRESETS,
  resolveFooterWidgets,
  type FooterConfig,
  type FooterLayoutPreset,
  type SiteWidget,
  type SiteWidgetType,
} from "@nexpress/core";
import { Columns, Plus, Sparkles, Trash2 } from "lucide-react";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, fieldClass } from "./appearance-ui";
import { ChromeLibraryModal } from "./chrome-library-modal";
import { WidgetItemCard, WidgetPickerModal, WidgetPreviewBox } from "./widget-studio";

const FOOTER_WIDGET_PRESETS: Array<{
  id: string;
  name: string;
  desc: string;
  layoutPreset: FooterLayoutPreset;
  widgets: () => SiteWidget[];
}> = [
  {
    id: "corporate-content-4",
    name: "Kurumsal & Zengin İçerik Paketi (4+2+3+3)",
    desc: "1. Sütun: Marka + Bülten • 2. Sütun: Kategoriler • 3. Sütun: Son Yazılar • 4. Sütun: Uzman İletişim",
    layoutPreset: "brand-wide-4",
    widgets: () => [
      createDefaultWidget("about_brand", 0),
      createDefaultWidget("newsletter", 0),
      createDefaultWidget("categories", 1),
      createDefaultWidget("recent_posts", 2, { settings: { count: 3, showThumbnail: false, showDate: true } }),
      createDefaultWidget("contact_card", 3),
    ],
  },
  {
    id: "ecommerce-campaign-4",
    name: "E-Ticaret, Ürün & Kampanya Paketi (3+3+3+3)",
    desc: "1. Sütun: Marka + Güven Rozetleri • 2. Sütun: Kategoriler • 3. Sütun: Öne Çıkan Ürünler • 4. Sütun: Kampanya",
    layoutPreset: "4-equal",
    widgets: () => [
      createDefaultWidget("about_brand", 0),
      createDefaultWidget("trust_badges", 0),
      createDefaultWidget("categories", 1, { title: "Mağaza Kategorileri" }),
      createDefaultWidget("featured_products", 2),
      createDefaultWidget("campaigns", 3),
    ],
  },
  {
    id: "magazine-community-3",
    name: "Dergi, Blog & Topluluk Paketi (4+4+4)",
    desc: "1. Sütun: Marka + Etiket Bulutu • 2. Sütun: Son Yazılar • 3. Sütun: Son Yorumlar & Değerlendirmeler",
    layoutPreset: "3-equal",
    widgets: () => [
      createDefaultWidget("about_brand", 0),
      createDefaultWidget("popular_tags", 0),
      createDefaultWidget("recent_posts", 1),
      createDefaultWidget("recent_comments", 2),
    ],
  },
];

export function FooterEditor({ initial, menus = [] }: { initial: FooterConfig; menus?: Array<{ id: string; name: string }> }) {
  const [footer, setFooter] = useState<FooterConfig>(() => ({
    ...initial,
    layoutPreset: initial.layoutPreset ?? "brand-wide-4",
    widgets: resolveFooterWidgets(initial),
  }));
  const [pickerColIndex, setPickerColIndex] = useState<number | null>(null);
  const [activeColTab, setActiveColTab] = useState<number>(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const activeLayout =
    FOOTER_LAYOUT_PRESETS.find((p) => p.id === (footer.layoutPreset ?? "brand-wide-4")) ??
    FOOTER_LAYOUT_PRESETS[0]!;

  const allWidgets = footer.widgets ?? [];

  const updateWidgets = (next: SiteWidget[]) => {
    setFooter((prev) => ({ ...prev, widgets: next }));
  };

  const handleAddWidgetToCol = (type: SiteWidgetType) => {
    const colIdx = pickerColIndex ?? activeColTab;
    const w = createDefaultWidget(type, colIdx);
    updateWidgets([...allWidgets, w]);
    setNotice(`"${w.title}" bileşeni ${colIdx + 1}. sütuna eklendi.`);
  };

  const moveWidgetInColumn = (widgetId: string, colIdx: number, delta: -1 | 1) => {
    const colItems = allWidgets.filter((w) => (w.columnIndex ?? 0) === colIdx);
    const pos = colItems.findIndex((w) => w.id === widgetId);
    const targetPos = pos + delta;
    if (pos < 0 || targetPos < 0 || targetPos >= colItems.length) return;
    const reorderedCol = [...colItems];
    const [moved] = reorderedCol.splice(pos, 1);
    reorderedCol.splice(targetPos, 0, moved!);

    let ptr = 0;
    const nextAll = allWidgets.map((w) =>
      (w.columnIndex ?? 0) === colIdx ? reorderedCol[ptr++]! : w
    );
    updateWidgets(nextAll);
  };

  const save = () => {
    start(async () => {
      await saveChromeAction({ footerConfig: footer });
      setNotice("Footer yerleşim düzeni ve bileşenleri kaydedildi.");
    });
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="footer" />
      <SaveBar
        title="Footer Yerleşimi ve Bileşen (Widget) Stüdyosu"
        pending={pending}
        notice={notice}
        onSave={save}
      />

      {/* Hazır Footer Bileşen Paketleri */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {FOOTER_WIDGET_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              setFooter((prev) => ({
                ...prev,
                layoutPreset: preset.layoutPreset,
                widgets: preset.widgets(),
              }));
              setActiveColTab(0);
              setNotice(`"${preset.name}" yüklendi. Kaydet ile yayınlanır.`);
            }}
            className="group rounded-xl border border-[#E6E7EA] bg-white p-3.5 text-left text-[12px] transition hover:border-blue-500 dark:border-[#23262E] dark:bg-[#15171C]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-foreground group-hover:text-blue-600">
                {preset.name}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5F6570] dark:text-[#8C9099]">
              {preset.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Canlı Footer Yerleşim ve Bileşen Önizlemesi */}
      <section
        aria-label="Canlı footer önizlemesi"
        className="overflow-hidden rounded-xl border border-[#D5D8DE] bg-white shadow-2xs dark:border-[#2E333D] dark:bg-[#15171C]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] bg-[#F8FAFC] px-4 py-2.5 text-[11px] dark:border-[#23262E] dark:bg-[#111318]">
          <div className="flex items-center gap-2">
            <Columns className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-bold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
              Canlı Footer Yerleşim Önizlemesi — {activeLayout.label} ({allWidgets.filter((w) => w.enabled).length} Aktif Bileşen)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-[#D5D8DE] bg-white px-2.5 py-1 text-[11px] font-semibold hover:border-blue-500 dark:border-[#2E333D] dark:bg-[#15171C]"
          >
            <Sparkles className="h-3 w-3 text-blue-600" /> Klasik Şablon & JSON Kütüphanesi
          </button>
        </div>

        <div className="space-y-5 p-5 text-xs">
          {/* Üst Kampanya / Çağrı Şeridi Önizlemesi */}
          {footer.topBanner?.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-600 px-4 py-3 text-white">
              <div>
                {footer.topBanner.badge && (
                  <span className="mr-2 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                    {footer.topBanner.badge}
                  </span>
                )}
                <span className="font-bold">{footer.topBanner.title}</span>
                {footer.topBanner.subtitle && (
                  <span className="ml-2 text-[11px] opacity-85">{footer.topBanner.subtitle}</span>
                )}
              </div>
              {footer.topBanner.ctaLabel && (
                <span className="rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-blue-700">
                  {footer.topBanner.ctaLabel} →
                </span>
              )}
            </div>
          )}

          {/* Sütun Izgarası */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {activeLayout.colSpans.map((span, colIdx) => {
              const colWidgets = allWidgets.filter(
                (w) => Math.min(activeLayout.columnCount - 1, w.columnIndex ?? 0) === colIdx
              );
              return (
                <div
                  key={colIdx}
                  style={{ gridColumn: `span ${span} / span ${span}` }}
                  onClick={() => setActiveColTab(colIdx)}
                  className={`cursor-pointer space-y-3 rounded-xl border p-3 transition ${
                    activeColTab === colIdx
                      ? "border-blue-500 bg-blue-500/[0.03] ring-1 ring-blue-500/30"
                      : "border-dashed border-[#D5D8DE] hover:border-blue-400 dark:border-[#2E333D]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#E6E7EA] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:border-[#23262E]">
                    <span>{activeLayout.columnLabels[colIdx] ?? `${colIdx + 1}. Sütun`}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerColIndex(colIdx);
                      }}
                      className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-blue-700"
                    >
                      + Widget
                    </button>
                  </div>

                  {colWidgets.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-[#5F6570] dark:text-[#8C9099]">
                      Bu sütunda bileşen yok. Eklemek için &ldquo;+ Widget&rdquo; tıklayın.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {colWidgets.map((w) => (
                        <WidgetPreviewBox key={w.id} widget={w} compact />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E7EA] pt-3 text-[11px] opacity-75 dark:border-[#23262E]">
            <span>{footer.copyrightText}</span>
            <div className="flex gap-3">
              {(footer.bottomLinks ?? []).map((bl, idx) => (
                <span key={idx}>{bl.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 1. Yerleşim Izgarası Seçimi */}
      <section className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[13px] font-bold">1. Footer Sütun ve Yerleşim Düzeni</div>
            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
              Footer bileşenlerinin kaç sütunda ve hangi genişlik oranlarıyla dizileceğini seçin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER_LAYOUT_PRESETS.map((preset) => {
            const active = (footer.layoutPreset ?? "brand-wide-4") === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setFooter((prev) => ({ ...prev, layoutPreset: preset.id }));
                  if (activeColTab >= preset.columnCount) setActiveColTab(0);
                }}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-blue-600 bg-blue-500/10 ring-1 ring-blue-600"
                    : "border-[#E6E7EA] hover:border-blue-400 dark:border-[#23262E]"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold text-foreground">{preset.label}</div>
                  <p className="mt-1 text-[10px] leading-snug text-[#5F6570] dark:text-[#8C9099]">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {preset.colSpans.map((sp, idx) => (
                    <div
                      key={idx}
                      style={{ flex: sp }}
                      className={`h-3 rounded-xs ${
                        active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Üst Kampanya / Çağrı Şeridi Ayarı */}
        <div className="mt-2 rounded-xl border border-[#E6E7EA] bg-[#FAFBFD] p-3 dark:border-[#23262E] dark:bg-[#111318]">
          <label className="flex cursor-pointer items-center justify-between font-semibold">
            <span>Footer Üstü Kampanya / Çağrı Şeridi (Top Banner) Göster</span>
            <input
              type="checkbox"
              checked={footer.topBanner?.enabled ?? false}
              onChange={(e) =>
                setFooter((prev) => ({
                  ...prev,
                  topBanner: {
                    enabled: e.target.checked,
                    badge: prev.topBanner?.badge ?? "FIRSAT",
                    title: prev.topBanner?.title ?? "Projenizi bugün hızlandırın",
                    subtitle: prev.topBanner?.subtitle ?? "14 gün ücretsiz deneyin veya uzman ekibimizle görüşün.",
                    ctaLabel: prev.topBanner?.ctaLabel ?? "Hemen Başla",
                    ctaHref: prev.topBanner?.ctaHref ?? "/tr/kurumsal",
                  },
                }))
              }
            />
          </label>
          {footer.topBanner?.enabled && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
              <input
                className={fieldClass}
                placeholder="Rozet (FIRSAT)"
                value={footer.topBanner.badge ?? ""}
                onChange={(e) =>
                  setFooter((prev) => ({
                    ...prev,
                    topBanner: { ...prev.topBanner!, badge: e.target.value },
                  }))
                }
              />
              <input
                className={`${fieldClass} sm:col-span-2`}
                placeholder="Başlık"
                value={footer.topBanner.title}
                onChange={(e) =>
                  setFooter((prev) => ({
                    ...prev,
                    topBanner: { ...prev.topBanner!, title: e.target.value },
                  }))
                }
              />
              <input
                className={fieldClass}
                placeholder="Buton metni"
                value={footer.topBanner.ctaLabel}
                onChange={(e) =>
                  setFooter((prev) => ({
                    ...prev,
                    topBanner: { ...prev.topBanner!, ctaLabel: e.target.value },
                  }))
                }
              />
              <input
                className={`${fieldClass} font-mono`}
                placeholder="/tr/kurumsal"
                value={footer.topBanner.ctaHref}
                onChange={(e) =>
                  setFooter((prev) => ({
                    ...prev,
                    topBanner: { ...prev.topBanner!, ctaHref: e.target.value },
                  }))
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* 2. Sütunlara Göre Bileşen (Widget) Yönetimi */}
      <section className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[13px] font-bold">2. Sütun Bileşenleri (Widgets)</div>
            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
              Düzenlemek istediğiniz sütunu seçin ve o sütuna kategoriler, son yazılar, son yorumlar, kampanya veya marka bileşeni ekleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerColIndex(activeColTab)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> {activeColTab + 1}. Sütuna Bileşen (Widget) Ekle
          </button>
        </div>

        {/* Sütun Sekmeleri */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#E6E7EA] pb-2.5 dark:border-[#23262E]">
          {activeLayout.colSpans.map((span, colIdx) => {
            const count = allWidgets.filter(
              (w) => Math.min(activeLayout.columnCount - 1, w.columnIndex ?? 0) === colIdx
            ).length;
            const isCurrent = activeColTab === colIdx;
            return (
              <button
                key={colIdx}
                type="button"
                onClick={() => setActiveColTab(colIdx)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  isCurrent
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-[#D5D8DE] bg-[#F8FAFC] text-foreground hover:border-blue-400 dark:border-[#2E333D] dark:bg-[#111318]"
                }`}
              >
                <span>{activeLayout.columnLabels[colIdx] ?? `${colIdx + 1}. Sütun`}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isCurrent ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {count} bileşen • {span}/12
                </span>
              </button>
            );
          })}
        </div>

        {/* Seçili Sütunun Widget Listesi */}
        {(() => {
          const colWidgets = allWidgets.filter(
            (w) => Math.min(activeLayout.columnCount - 1, w.columnIndex ?? 0) === activeColTab
          );
          if (colWidgets.length === 0) {
            return (
              <div className="rounded-xl border border-dashed border-[#D5D8DE] p-6 text-center dark:border-[#2E333D]">
                <p className="text-xs text-[#5F6570] dark:text-[#8C9099]">
                  {activeColTab + 1}. sütunda henüz bileşen yok.
                </p>
                <button
                  type="button"
                  onClick={() => setPickerColIndex(activeColTab)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Bu Sütuna Bileşen Ekle
                </button>
              </div>
            );
          }
          return (
            <div className="space-y-2.5">
              {colWidgets.map((w, idx) => (
                <WidgetItemCard
                  key={w.id}
                  widget={w}
                  isFirst={idx === 0}
                  isLast={idx === colWidgets.length - 1}
                  columnOptions={activeLayout.columnLabels}
                  onChange={(next) =>
                    updateWidgets(allWidgets.map((item) => (item.id === w.id ? next : item)))
                  }
                  onMoveUp={() => moveWidgetInColumn(w.id, activeColTab, -1)}
                  onMoveDown={() => moveWidgetInColumn(w.id, activeColTab, 1)}
                  onDelete={() => updateWidgets(allWidgets.filter((item) => item.id !== w.id))}
                  menus={menus}
                />
              ))}
            </div>
          );
        })()}
      </section>

      {/* 3. Alt Telif & Yasal Satır */}
      <section className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="text-[13px] font-bold">3. Alt Telif Şeridi ve Yasal Bağlantılar</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold">Telif Metni</label>
            <input
              aria-label="Telif metni"
              className={fieldClass}
              value={footer.copyrightText}
              onChange={(e) => setFooter((prev) => ({ ...prev, copyrightText: e.target.value }))}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold">Alt Satır Yasal Bağlantıları (KVKK, Gizlilik vb.)</span>
              <button
                type="button"
                onClick={() =>
                  setFooter((prev) => ({
                    ...prev,
                    bottomLinks: [
                      ...(prev.bottomLinks ?? []),
                      { label: "Gizlilik Politikası", href: "/tr/kurumsal" },
                    ],
                  }))
                }
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                + Alt bağlantı ekle
              </button>
            </div>
            <div className="space-y-1.5">
              {(footer.bottomLinks ?? []).map((bl, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                  <input
                    className={fieldClass}
                    value={bl.label}
                    onChange={(e) =>
                      setFooter((prev) => ({
                        ...prev,
                        bottomLinks: (prev.bottomLinks ?? []).map((item, i) =>
                          i === idx ? { ...item, label: e.target.value } : item
                        ),
                      }))
                    }
                  />
                  <input
                    className={`${fieldClass} font-mono`}
                    value={bl.href}
                    onChange={(e) =>
                      setFooter((prev) => ({
                        ...prev,
                        bottomLinks: (prev.bottomLinks ?? []).map((item, i) =>
                          i === idx ? { ...item, href: e.target.value } : item
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFooter((prev) => ({
                        ...prev,
                        bottomLinks: (prev.bottomLinks ?? []).filter((_, i) => i !== idx),
                      }))
                    }
                    className="px-2 text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WidgetPickerModal
        open={pickerColIndex !== null}
        onClose={() => setPickerColIndex(null)}
        onSelect={handleAddWidgetToCol}
        targetLabel={
          pickerColIndex !== null
            ? activeLayout.columnLabels[pickerColIndex] ?? `${pickerColIndex + 1}. Sütun`
            : undefined
        }
      />

      <ChromeLibraryModal
        open={libraryOpen}
        kind="footer"
        onClose={() => setLibraryOpen(false)}
        onApplyFooter={(value) => {
          setFooter({
            ...value,
            layoutPreset: value.layoutPreset ?? "brand-wide-4",
            widgets: resolveFooterWidgets(value),
          });
          setNotice("Tasarım forma alındı. Kaydet ile yayınlanır.");
        }}
      />
    </div>
  );
}
