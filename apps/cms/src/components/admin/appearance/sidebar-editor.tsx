"use client";

import React, { useState, useTransition } from "react";
import {
  createDefaultWidget,
  resolveSidebarWidgets,
  type SidebarConfig,
  type SiteWidget,
  type SiteWidgetType,
} from "@nexpress/core";
import { PanelLeft, PanelRight, Plus, Sparkles } from "lucide-react";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, fieldClass } from "./appearance-ui";
import { WidgetItemCard, WidgetPickerModal, WidgetPreviewBox } from "./widget-studio";

const SIDEBAR_WIDGET_PRESETS: Array<{
  id: string;
  name: string;
  desc: string;
  position: "left" | "right";
  width: "260px" | "300px" | "340px";
  styleVariant: "cards" | "minimal" | "bordered";
  widgets: () => SiteWidget[];
}> = [
  {
    id: "blog-editorial-right",
    name: "Blog, Haber & İçerik Paketi (Sağ Sidebar)",
    desc: "Site içi arama, kategoriler, son yazılar, son yorumlar ve kampanya kutusu.",
    position: "right",
    width: "300px",
    styleVariant: "cards",
    widgets: () => [
      createDefaultWidget("search", 0),
      createDefaultWidget("categories", 0),
      createDefaultWidget("recent_posts", 0),
      createDefaultWidget("recent_comments", 0),
      createDefaultWidget("campaigns", 0),
      createDefaultWidget("popular_tags", 0),
    ],
  },
  {
    id: "ecommerce-shop-left",
    name: "E-Ticaret, Ürün & Kampanya Paketi (Sol Sidebar)",
    desc: "Kategoriler, öne çıkan ürünler, indirim kuponu kampanyası ve güven rozetleri.",
    position: "left",
    width: "260px",
    styleVariant: "cards",
    widgets: () => [
      createDefaultWidget("search", 0, { title: "Ürün Ara" }),
      createDefaultWidget("categories", 0, { title: "Ürün Kategorileri" }),
      createDefaultWidget("featured_products", 0),
      createDefaultWidget("campaigns", 0, {
        title: "Sepette %25 İndirim",
        settings: {
          badge: "MAĞAZA FIRSATI",
          discountText: "%25 İndirim",
          subtitle: "Seçili kurumsal paketlerde sepette anında indirim fırsatı.",
          couponCode: "MAGAZA25",
          ctaLabel: "Fırsat Ürünleri",
          ctaHref: "/tr/magaza",
          tone: "primary",
        },
      }),
      createDefaultWidget("trust_badges", 0),
    ],
  },
  {
    id: "corporate-docs-right",
    name: "Kurumsal & Dokümantasyon Paketi (Sağ Sidebar)",
    desc: "İçindekiler rehberi (TOC), uzman iletişim kartı, son yazılar ve e-bülten.",
    position: "right",
    width: "300px",
    styleVariant: "bordered",
    widgets: () => [
      createDefaultWidget("toc", 0),
      createDefaultWidget("contact_card", 0),
      createDefaultWidget("recent_posts", 0, { title: "İlgili Rehberler" }),
      createDefaultWidget("newsletter", 0),
    ],
  },
];

export function SidebarEditor({ initial }: { initial: SidebarConfig }) {
  const [sidebar, setSidebar] = useState<SidebarConfig>(() => ({
    ...initial,
    width: initial.width ?? "300px",
    sticky: initial.sticky ?? true,
    styleVariant: initial.styleVariant ?? "cards",
    widgets: resolveSidebarWidgets(initial),
  }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const widgets = sidebar.widgets ?? [];

  const updateWidgets = (next: SiteWidget[]) => {
    setSidebar((prev) => ({ ...prev, widgets: next }));
  };

  const handleAddWidget = (type: SiteWidgetType) => {
    const w = createDefaultWidget(type, 0);
    updateWidgets([...widgets, w]);
    setNotice(`"${w.title}" bileşeni kenar çubuğuna eklendi.`);
  };

  const moveWidget = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= widgets.length) return;
    const copy = [...widgets];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item!);
    updateWidgets(copy);
  };

  const save = () => {
    start(async () => {
      await saveChromeAction({ sidebarConfig: sidebar });
      setNotice("Kenar çubuğu yerleşimi ve bileşenleri kaydedildi.");
    });
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="sidebar" />
      <SaveBar
        title="Kenar Çubuğu (Sidebar) Yerleşimi ve Bileşen (Widget) Stüdyosu"
        pending={pending}
        notice={notice}
        onSave={save}
      />

      {/* Hazır Bileşen Paketleri */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SIDEBAR_WIDGET_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              setSidebar((prev) => ({
                ...prev,
                enabled: true,
                position: preset.position,
                width: preset.width,
                styleVariant: preset.styleVariant,
                widgets: preset.widgets(),
              }));
              setNotice(`"${preset.name}" bileşen dizilimi yüklendi. Kaydet ile yayınlanır.`);
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Sol: Yerleşim Ayarları + Bileşen (Widget) Listesi */}
        <section className="space-y-4 lg:col-span-7">
          {/* 1. Yerleşim & Görünüm Kartı */}
          <div className="space-y-3.5 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
              <div>
                <div className="text-[13px] font-bold">1. Kenar Çubuğu Yerleşim Düzeni</div>
                <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                  Kenar çubuğunun sayfa içindeki konumunu, genişliğini ve kart stilini belirleyin.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D5D8DE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-bold dark:border-[#2E333D] dark:bg-[#111318]">
                <input
                  type="checkbox"
                  checked={sidebar.enabled}
                  onChange={(e) => setSidebar((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                <span>Kenar Çubuğu Yayında</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSidebar((prev) => ({ ...prev, position: "left" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  sidebar.position === "left"
                    ? "border-blue-600 bg-blue-500/10 text-blue-600"
                    : "border-[#E6E7EA] hover:bg-black/[0.02] dark:border-[#23262E]"
                }`}
              >
                <PanelLeft className="h-4 w-4" /> Sol Kenar Çubuğu (4+8)
              </button>
              <button
                type="button"
                onClick={() => setSidebar((prev) => ({ ...prev, position: "right" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  sidebar.position === "right"
                    ? "border-blue-600 bg-blue-500/10 text-blue-600"
                    : "border-[#E6E7EA] hover:bg-black/[0.02] dark:border-[#23262E]"
                }`}
              >
                <PanelRight className="h-4 w-4" /> Sağ Kenar Çubuğu (8+4)
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold">Sütun Genişliği</label>
                <select
                  aria-label="Sütun Genişliği"
                  className={fieldClass}
                  value={sidebar.width ?? "300px"}
                  onChange={(e) =>
                    setSidebar((prev) => ({
                      ...prev,
                      width: e.target.value as SidebarConfig["width"],
                    }))
                  }
                >
                  <option value="260px">260px (Dar)</option>
                  <option value="300px">300px (Standart)</option>
                  <option value="340px">340px (Geniş)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold">Bileşen Kart Stili</label>
                <select
                  aria-label="Bileşen Kart Stili"
                  className={fieldClass}
                  value={sidebar.styleVariant ?? "cards"}
                  onChange={(e) =>
                    setSidebar((prev) => ({
                      ...prev,
                      styleVariant: e.target.value as SidebarConfig["styleVariant"],
                    }))
                  }
                >
                  <option value="cards">Ayrık Kartlar (Önerilen)</option>
                  <option value="bordered">Birleşik Çerçeveli</option>
                  <option value="minimal">Kenarlıksız Sade</option>
                </select>
              </div>

              <div className="flex items-end pb-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium">
                  <input
                    type="checkbox"
                    checked={sidebar.sticky ?? true}
                    onChange={(e) =>
                      setSidebar((prev) => ({ ...prev, sticky: e.target.checked }))
                    }
                  />
                  <span>Kaydırırken yapışkan (Sticky)</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Kenar Çubuğu Bileşenleri (Widgets) */}
          <div className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-bold">
                  2. Kenar Çubuğu Bileşenleri ({widgets.length} Bileşen)
                </div>
                <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                  Kategoriler, son yazılar, son yorumlar, kampanyalar veya bülten bileşenlerini sıralayın ve özelleştirin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" /> Bileşen (Widget) Ekle
              </button>
            </div>

            {widgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D5D8DE] p-6 text-center dark:border-[#2E333D]">
                <p className="text-xs font-medium text-[#5F6570] dark:text-[#8C9099]">
                  Henüz bileşen eklenmedi. Yukarıdaki &ldquo;+ Bileşen (Widget) Ekle&rdquo; butonuna tıklayarak kategoriler, son yazılar veya kampanya kutusu ekleyin.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {widgets.map((w, idx) => (
                  <WidgetItemCard
                    key={w.id}
                    widget={w}
                    isFirst={idx === 0}
                    isLast={idx === widgets.length - 1}
                    onChange={(next) =>
                      updateWidgets(widgets.map((item, i) => (i === idx ? next : item)))
                    }
                    onMoveUp={() => moveWidget(idx, -1)}
                    onMoveDown={() => moveWidget(idx, 1)}
                    onDelete={() => updateWidgets(widgets.filter((_, i) => i !== idx))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sağ: Canlı Yerleşim & Bileşen Önizlemesi */}
        <aside className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C] lg:col-span-5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
            <span>Canlı Kenar Çubuğu & Bileşen Önizlemesi</span>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              {sidebar.enabled
                ? `${sidebar.position === "left" ? "Sol" : "Sağ"} • ${sidebar.width ?? "300px"}`
                : "Kapalı"}
            </span>
          </div>

          <div className="flex gap-3 rounded-xl border border-dashed border-[#D5D8DE] bg-[#F8FAFC] p-3.5 dark:border-[#2E333D] dark:bg-[#111318]">
            {sidebar.enabled && sidebar.position === "left" && (
              <div className="w-52 shrink-0 space-y-2.5">
                {widgets.map((w) => (
                  <WidgetPreviewBox key={w.id} widget={w} />
                ))}
              </div>
            )}

            <div className="flex-1 space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
              <div className="inline-block rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                ANA İÇERİK ALANI
              </div>
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-2.5 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-slate-100 text-[11px] font-medium text-muted-foreground dark:bg-slate-800/60">
                Sayfa / Blog / Kategori / Ürün Gövdesi
              </div>
              <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
            </div>

            {sidebar.enabled && sidebar.position === "right" && (
              <div className="w-52 shrink-0 space-y-2.5">
                {widgets.map((w) => (
                  <WidgetPreviewBox key={w.id} widget={w} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <WidgetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddWidget}
        targetLabel="Kenar Çubuğu (Sidebar)"
      />
    </div>
  );
}
