"use client";

import React, { useState, useTransition } from "react";
import {
  createDefaultWidget,
  resolveAllSidebarAreas,
  resolveSidebarWidgets,
  type SidebarAreaConfig,
  type SidebarConfig,
  type SiteWidget,
  type SiteWidgetType,
} from "@nexpress/core";
import {
  BookOpen,
  FolderTree,
  HelpCircle,
  Layout,
  PanelLeft,
  PanelRight,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  const [areas, setAreas] = useState<SidebarAreaConfig[]>(() => resolveAllSidebarAreas(initial));
  const [activeAreaId, setActiveAreaId] = useState<string>("blog");
  const [newAreaModalOpen, setNewAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaId, setNewAreaId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const activeArea = areas.find((a) => a.id === activeAreaId) || areas[0]!;
  const widgets = activeArea.widgets ?? [];

  const updateActiveArea = (patch: Partial<SidebarAreaConfig>) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === activeArea.id ? { ...a, ...patch } : a))
    );
  };

  const updateWidgets = (next: SiteWidget[]) => {
    updateActiveArea({ widgets: next });
  };

  const handleAddWidget = (type: SiteWidgetType) => {
    const w = createDefaultWidget(type, 0);
    updateWidgets([...widgets, w]);
    setNotice(`"${w.title}" bileşeni "${activeArea.name}" alanına eklendi.`);
  };

  const moveWidget = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= widgets.length) return;
    const copy = [...widgets];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item!);
    updateWidgets(copy);
  };

  const handleCreateArea = () => {
    const trimmedName = newAreaName.trim();
    if (!trimmedName) return;
    const cleanId = (newAreaId.trim() || trimmedName)
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9_-]/g, "-");

    if (areas.some((a) => a.id === cleanId)) {
      setNotice(`"${cleanId}" kimliğine sahip bir kenar çubuğu alanı zaten var.`);
      return;
    }

    const newArea: SidebarAreaConfig = {
      id: cleanId,
      name: trimmedName,
      description: "Özel kenar çubuğu alanı.",
      enabled: true,
      position: "right",
      width: "300px",
      sticky: true,
      styleVariant: "cards",
      widgets: [createDefaultWidget("search", 0), createDefaultWidget("categories", 0)],
    };

    setAreas((prev) => [...prev, newArea]);
    setActiveAreaId(cleanId);
    setNewAreaName("");
    setNewAreaId("");
    setNewAreaModalOpen(false);
    setNotice(`"${trimmedName}" kenar çubuğu alanı oluşturuldu.`);
  };

  const handleDeleteArea = (id: string) => {
    if (["primary", "blog", "shop", "archive", "faq", "page"].includes(id)) {
      setNotice("Standart kenar çubuğu alanları silinemez, ancak 'Devre Dışı' bırakılabilir.");
      return;
    }
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setActiveAreaId("primary");
    setNotice("Özel kenar çubuğu alanı silindi.");
  };

  const save = () => {
    start(async () => {
      const primary = areas.find((a) => a.id === "primary") || areas[0]!;
      const fullConfig: SidebarConfig = {
        ...initial,
        enabled: primary.enabled,
        position: primary.position || "right",
        width: primary.width || "300px",
        sticky: primary.sticky ?? true,
        styleVariant: primary.styleVariant || "cards",
        title: primary.name,
        widgets: primary.widgets || [],
        areas,
      };
      await saveChromeAction({ sidebarConfig: fullConfig });
      setNotice("Tüm kenar çubuğu alanları ve bileşenleri başarıyla kaydedildi.");
    });
  };

  const getAreaIcon = (id: string) => {
    switch (id) {
      case "blog":
        return <BookOpen className="h-3.5 w-3.5 text-blue-600" />;
      case "shop":
        return <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />;
      case "archive":
        return <FolderTree className="h-3.5 w-3.5 text-amber-600" />;
      case "faq":
        return <HelpCircle className="h-3.5 w-3.5 text-purple-600" />;
      case "page":
        return <Layout className="h-3.5 w-3.5 text-indigo-600" />;
      default:
        return <Layout className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="sidebar" />
      <SaveBar
        title="Çoklu Kenar Çubuğu (Multi-Sidebar) & Bileşen (Widget) Stüdyosu"
        pending={pending}
        notice={notice}
        onSave={save}
      />

      {/* Çoklu Kenar Çubuğu Alanları (WordPress / Kadence Tarzı) */}
      <div className="rounded-xl border border-[#E6E7EA] bg-white p-3.5 shadow-2xs dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] pb-2.5 dark:border-[#23262E]">
          <div>
            <div className="text-[12px] font-bold">Kenar Çubuğu Alanı Seçin (Birden Fazla Sidebar)</div>
            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
              Blog, Mağaza, Kategori veya Kurumsal Sayfalar için farklı bileşenler ve yerleşimler kurgulayın.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewAreaModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 transition hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni Kenar Çubuğu Ekle
          </button>
        </div>

        {/* Alan Sekmeleri */}
        <div className="flex flex-wrap gap-1.5 pt-2.5">
          {areas.map((a) => {
            const isActive = a.id === activeArea.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setActiveAreaId(a.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-blue-600 bg-blue-500/10 text-blue-600 shadow-2xs font-bold"
                    : "border-[#E6E7EA] bg-[#F8FAFC] text-[#5F6570] hover:border-blue-400 hover:text-foreground dark:border-[#2E333D] dark:bg-[#111318] dark:text-[#8C9099]"
                }`}
              >
                {getAreaIcon(a.id)}
                <span>{a.name}</span>
                <span className="rounded bg-black/5 px-1.5 py-0.2 font-mono text-[9px] opacity-75 dark:bg-white/10">
                  {a.widgets?.length ?? 0}
                </span>
                {!a.enabled ? (
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-600">
                    Kapalı
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hazır Bileşen Paketleri (Aktif Kenar Çubuğuna Uygula) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SIDEBAR_WIDGET_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              updateActiveArea({
                enabled: true,
                position: preset.position,
                width: preset.width,
                styleVariant: preset.styleVariant,
                widgets: preset.widgets(),
              });
              setNotice(`"${preset.name}" bileşen dizilimi "${activeArea.name}" alanına yüklendi.`);
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
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold">1. {activeArea.name} Yerleşim Düzeni</span>
                  {!["primary", "blog", "shop", "archive", "faq", "page"].includes(activeArea.id) ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteArea(activeArea.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-500/10"
                      title="Bu özel alanı sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                  {activeArea.description || "Bu alan için sayfa içindeki konumu, genişliği ve kart stilini belirleyin."}
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D5D8DE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-bold dark:border-[#2E333D] dark:bg-[#111318]">
                <input
                  type="checkbox"
                  checked={activeArea.enabled}
                  onChange={(e) => updateActiveArea({ enabled: e.target.checked })}
                />
                <span>Bu Kenar Çubuğu Etkin</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateActiveArea({ position: "left" })}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  activeArea.position === "left"
                    ? "border-blue-600 bg-blue-500/10 text-blue-600"
                    : "border-[#E6E7EA] hover:bg-black/[0.02] dark:border-[#23262E]"
                }`}
              >
                <PanelLeft className="h-4 w-4" /> Sol Kenar Çubuğu (4+8)
              </button>
              <button
                type="button"
                onClick={() => updateActiveArea({ position: "right" })}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  activeArea.position === "right"
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
                  value={activeArea.width ?? "300px"}
                  onChange={(e) =>
                    updateActiveArea({
                      width: e.target.value as SidebarConfig["width"],
                    })
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
                  value={activeArea.styleVariant ?? "cards"}
                  onChange={(e) =>
                    updateActiveArea({
                      styleVariant: e.target.value as SidebarConfig["styleVariant"],
                    })
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
                    checked={activeArea.sticky ?? true}
                    onChange={(e) =>
                      updateActiveArea({ sticky: e.target.checked })
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
                  2. {activeArea.name} Bileşenleri ({widgets.length} Bileşen)
                </div>
                <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                  Bu kenar çubuğuna özel bileşenleri sıralayın, ekleyin ve yapılandırın.
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
            <span>Canlı Önizleme ({activeArea.name})</span>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              {activeArea.enabled
                ? `${activeArea.position === "left" ? "Sol" : "Sağ"} • ${activeArea.width ?? "300px"}`
                : "Kapalı"}
            </span>
          </div>

          <div className="flex gap-3 rounded-xl border border-dashed border-[#D5D8DE] bg-[#F8FAFC] p-3.5 dark:border-[#2E333D] dark:bg-[#111318]">
            {activeArea.enabled && activeArea.position === "left" && (
              <div className="w-52 shrink-0 space-y-2.5">
                {widgets.map((w) => (
                  <WidgetPreviewBox key={w.id} widget={w} />
                ))}
              </div>
            )}

            <div className="flex-1 space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
              <div className="inline-block rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                ANA İÇERİK ALANI ({activeArea.name})
              </div>
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-2.5 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-slate-100 text-[11px] font-medium text-muted-foreground dark:bg-slate-800/60">
                {activeArea.id === "blog"
                  ? "Blog Yazı İçeriği"
                  : activeArea.id === "shop"
                    ? "Mağaza & Ürün Listesi"
                    : activeArea.id === "archive"
                      ? "Kategori Arşivi"
                      : activeArea.id === "faq"
                        ? "SSS & Rehber Metni"
                        : "Sayfa Gövdesi"}
              </div>
              <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
            </div>

            {activeArea.enabled && activeArea.position === "right" && (
              <div className="w-52 shrink-0 space-y-2.5">
                {widgets.map((w) => (
                  <WidgetPreviewBox key={w.id} widget={w} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Yeni Kenar Çubuğu Alanı Ekleme Modalı */}
      {newAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold">Yeni Kenar Çubuğu (Sidebar) Alanı</h3>
              <p className="text-xs text-muted-foreground">
                Örn: &ldquo;Özel Kampanya Kenar Çubuğu&rdquo; veya &ldquo;Üye Paneli Sidebar&rdquo;.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Kenar Çubuğu Adı</label>
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="Özel Kenar Çubuğu"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Kimlik (Opsiyonel slug)</label>
                <input
                  type="text"
                  value={newAreaId}
                  onChange={(e) => setNewAreaId(e.target.value)}
                  placeholder="ozel-sidebar"
                  className={`${fieldClass} font-mono text-xs`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewAreaModalOpen(false)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreateArea}
                disabled={!newAreaName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      <WidgetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddWidget}
        targetLabel={activeArea.name}
      />
    </div>
  );
}
