import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  STARTER_TEMPLATES,
  TEMPLATE_KIND_IDS,
  TEMPLATE_KINDS,
  type TemplateKind,
} from "@nexpress/core";
import {
  ArrowUpRight,
  Check,
  Columns,
  LayoutGrid,
  List,
  PanelLeft,
  PanelRight,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import {
  createTemplateAction,
  deleteTemplateAction,
  setDefaultTemplateAction,
} from "@/app/admin/appearance/templates/actions";
import type { ThemeStoreState } from "./use-theme-store";

/**
 * SEKMELER 4, 5 ve 6:
 * - `layout`: Sayfa Genişliği, Kapsayıcı Düzeni ve Sağ/Sol Kenar Çubuğu (Sidebar)
 * - `chrome`: Header, Footer, Menü Hizalaması ve Çağrı Butonu
 * - `templates`: Blog, Kategori, Etiket, Ürün, Arama Şablon Ayarları & Buton Geometrisi
 */
export function ThemeStoreTabLayout({ s }: { s: ThemeStoreState }) {
  const {
    tokens,
    setTokens,
    customizer,
    setCustomizer,
    templatesList,
    setTemplatesList,
    activeTab,
    showToast,
  } = s;
  const sidebarPos = customizer.layout.sidebarPosition ?? "none";
  const [tplPending, startTpl] = useTransition();
  const [selectedKind, setSelectedKind] = useState<TemplateKind>("post");
  const [newTplName, setNewTplName] = useState("");
  const [newTplLayout, setNewTplLayout] = useState<"full" | "right-sidebar" | "left-sidebar">("right-sidebar");

  return (
    <>
      {/* SEKME 4: SAYFA GENİŞLİĞİ & SAĞ/SOL SIDEBAR */}
      {activeTab === "layout" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sayfa & Kapsayıcı Genişliği
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Site Maks. Genişlik
                </label>
                <select
                  aria-label="Site Maks. Genişlik"
                  value={tokens.geometry.containerMaxWidth}
                  onChange={(e) =>
                    setTokens((prev) => ({
                      ...prev,
                      geometry: {
                        ...prev.geometry,
                        containerMaxWidth: e.target.value,
                      },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value="1140px">1140px (Dar Kurumsal)</option>
                  <option value="1200px">1200px (Klasik Standart)</option>
                  <option value="1280px">1280px (Modern SaaS)</option>
                  <option value="1360px">1360px (Geniş Katalog)</option>
                  <option value="1440px">1440px (Tam Ekran Stüdyo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Okuma / Makale Genişliği
                </label>
                <select
                  aria-label="Okuma / Makale Genişliği"
                  value={customizer.layout.articleWidth}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, articleWidth: e.target.value },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value="720px">720px (Odaklı Okuma)</option>
                  <option value="860px">860px (Standart Blog)</option>
                  <option value="960px">960px (Geniş Makale)</option>
                  <option value="1100px">1100px (Tam Genişlik)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Sayfa Yerleşim Modu
                </label>
                <select
                  aria-label="Sayfa Yerleşim Modu"
                  value={customizer.layout.contentLayout}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        contentLayout: e.target.value as "boxed" | "fullwidth",
                      },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value="boxed">Kutu Kapsayıcı (Boxed)</option>
                  <option value="fullwidth">Tam Genişlik (Fullwidth)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Köşe Yuvarlaklığı (Radius)
                </label>
                <select
                  aria-label="Köşe Yuvarlaklığı (Radius)"
                  value={tokens.geometry.borderRadius}
                  onChange={(e) =>
                    setTokens((prev) => ({
                      ...prev,
                      geometry: {
                        ...prev.geometry,
                        borderRadius: e.target.value,
                      },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value="0.25rem">Keskin (4px)</option>
                  <option value="0.5rem">Modern (8px)</option>
                  <option value="0.75rem">Yumuşak (12px)</option>
                  <option value="1rem">Yuvarlak (16px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sağ / Sol Kenar Çubuğu (Sidebar) Konumu */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kenar Çubuğu (Sağ / Sol Sidebar)
              </span>
              <Link
                href="/admin/appearance/sidebar"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Bileşenleri Düzenle <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "none", label: "Kapalı (Tam)", icon: Square },
                  { id: "left", label: "Sol Sidebar", icon: PanelLeft },
                  { id: "right", label: "Sağ Sidebar", icon: PanelRight },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = sidebarPos === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setCustomizer((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, sidebarPosition: opt.id },
                      }))
                    }
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-[11px] font-medium transition ${
                      active
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {sidebarPos !== "none" && (
              <div className="space-y-2 border-t border-border pt-2.5">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Kenar Çubuğu Genişliği
                  </label>
                  <select
                    aria-label="Kenar Çubuğu Genişliği"
                    value={customizer.layout.sidebarWidth ?? "300px"}
                    onChange={(e) =>
                      setCustomizer((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, sidebarWidth: e.target.value },
                      }))
                    }
                    className="h-8 w-full rounded border border-border bg-background px-2"
                  >
                    <option value="250px">250px (Dar Kenar Çubuğu)</option>
                    <option value="300px">300px (Standart Kenar Çubuğu)</option>
                    <option value="340px">340px (Geniş Kenar Çubuğu)</option>
                  </select>
                </div>

                <div className="text-[11px] font-semibold text-muted-foreground pt-1">
                  Hangi Şablonlarda Kenar Çubuğu Gösterilsin?
                </div>
                <div className="space-y-1.5">
                  {(
                    [
                      { key: "sidebarOnBlog", label: "Blog Yazıları (Tekil Yazı)" },
                      { key: "sidebarOnArchive", label: "Kategori & Etiket Arşivleri" },
                      { key: "sidebarOnPage", label: "Kurumsal Sayfalar" },
                      { key: "sidebarOnShop", label: "Mağaza, Ürün & Ürün Kategorisi" },
                      { key: "sidebarOnSearch", label: "Arama Sonuçları Sayfası" },
                    ] as const
                  ).map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between cursor-pointer py-0.5"
                    >
                      <span>{item.label}</span>
                      <input
                        type="checkbox"
                        checked={customizer.layout[item.key] ?? false}
                        onChange={(e) =>
                          setCustomizer((prev) => ({
                            ...prev,
                            layout: {
                              ...prev.layout,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEKME 5: HEADER, FOOTER & MENÜ DÜZENİ */}
      {activeTab === "chrome" && (
        <div className="space-y-4">
          {/* Hızlı Kısayollar */}
          <div className="grid grid-cols-3 gap-1.5">
            <Link
              href="/admin/appearance/header"
              className="flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-2 text-[11px] font-semibold hover:border-blue-500 hover:text-blue-600"
            >
              Header Stüdyo <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/appearance/menus"
              className="flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-2 text-[11px] font-semibold hover:border-blue-500 hover:text-blue-600"
            >
              Mega Menü <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/appearance/footer"
              className="flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-2 text-[11px] font-semibold hover:border-blue-500 hover:text-blue-600"
            >
              Footer Stüdyo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Header Ayarları */}
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Header (Üst Bölüm) Düzeni
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Menü Hizalaması
                </label>
                <select
                  aria-label="Menü Hizalaması"
                  value={customizer.header.menuAlign}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        menuAlign: e.target.value as "left" | "center" | "right",
                      },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value="left">Sola Hizalı (Klasik)</option>
                  <option value="center">Ortalanmış (Vitrin)</option>
                  <option value="right">Sağa Hizalı</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Header Yüksekliği
                </label>
                <select
                  aria-label="Header Yüksekliği"
                  value={customizer.header.height || 64}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        height: Number(e.target.value),
                      },
                    }))
                  }
                  className="h-8 w-full rounded border border-border bg-background px-2"
                >
                  <option value={56}>56px (Kompakt)</option>
                  <option value={64}>64px (Standart)</option>
                  <option value={76}>76px (Geniş Kurumsal)</option>
                  <option value={88}>88px (Ferah Dergi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Özel Logo Başlığı (Boşsa site adı kullanılır)
              </label>
              <input
                type="text"
                value={customizer.header.logoText}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    header: { ...prev.header, logoText: e.target.value },
                  }))
                }
                placeholder="NexPress Vitrin"
                className="h-8 w-full rounded border border-border bg-background px-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Çağrı Butonu (CTA) Metni
                </label>
                <input
                  type="text"
                  value={customizer.header.ctaLabel}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      header: { ...prev.header, ctaLabel: e.target.value },
                    }))
                  }
                  placeholder="Canlı Demo"
                  className="h-8 w-full rounded border border-border bg-background px-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Çağrı Butonu Adresi
                </label>
                <input
                  type="text"
                  value={customizer.header.ctaHref}
                  onChange={(e) =>
                    setCustomizer((prev) => ({
                      ...prev,
                      header: { ...prev.header, ctaHref: e.target.value },
                    }))
                  }
                  placeholder="/tr/iletisim"
                  className="h-8 w-full rounded border border-border bg-background px-2.5 font-mono text-[11px]"
                />
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Yapışkan (Sticky) Üst Menü</span>
              <input
                type="checkbox"
                checked={customizer.header.sticky}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    header: { ...prev.header, sticky: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Cam Yüzey (Glassmorphism) Efekti</span>
              <input
                type="checkbox"
                checked={customizer.header.glass}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    header: { ...prev.header, glass: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Logo Yanında Site Sloganını Göster</span>
              <input
                type="checkbox"
                checked={customizer.header.showTagline}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    header: { ...prev.header, showTagline: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Sağda Çağrı Butonunu (CTA) Göster</span>
              <input
                type="checkbox"
                checked={customizer.header.showCta}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    header: { ...prev.header, showCta: e.target.checked },
                  }))
                }
              />
            </label>
          </div>

          {/* Footer Ayarları */}
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Footer (Alt Bölüm) Düzeni
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Footer Kolon Düzeni
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([2, 3, 4] as const).map((colCount) => (
                  <button
                    key={colCount}
                    type="button"
                    onClick={() =>
                      setCustomizer((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, columns: colCount },
                      }))
                    }
                    className={`inline-flex items-center justify-center gap-1 rounded border py-1.5 text-[11px] font-medium ${
                      customizer.footer.columns === colCount
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                        : "border-border"
                    }`}
                  >
                    <Columns className="h-3 w-3" /> {colCount} Kolon
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Sol Kolonda Marka & Site Özeti Göster</span>
              <input
                type="checkbox"
                checked={customizer.footer.showBrand}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, showBrand: e.target.checked },
                  }))
                }
              />
            </label>

            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Alt Telif Metni
              </label>
              <input
                type="text"
                value={customizer.footer.copyright}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, copyright: e.target.value },
                  }))
                }
                placeholder="© 2026 NexPress CMS — Tüm hakları saklıdır."
                className="h-8 w-full rounded border border-border bg-background px-2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEKME 6: BLOG, KATEGORİ, ETİKET, ÜRÜN & ARAMA ŞABLONLARI */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {/* Doğrudan Şablon Oluşturma & Düzenleme Kutusu */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.03] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[12px] font-bold text-foreground">
                  Şablon Oluşturucu & Düzenleyici
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Blog, kategori, etiket, sayfa, ürün veya arama şablonlarını buradan oluşturup görsel stüdyoda düzenleyin.
                </p>
              </div>
              <Link
                href="/admin/appearance/templates"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-500/30 bg-background px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-500/10"
              >
                Tam Ekran Şablonlar <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Şablon Türü Seçici */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold">
                1. Şablon Türü Seçin
              </label>
              <select
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value as TemplateKind)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold"
              >
                {TEMPLATE_KIND_IDS.map((k) => (
                  <option key={k} value={k}>
                    {TEMPLATE_KINDS[k].label} ({templatesList.filter((t) => t.kind === k).length} şablon)
                  </option>
                ))}
              </select>
            </div>

            {/* Seçili Türdeki Mevcut Şablonlar */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Mevcut {TEMPLATE_KINDS[selectedKind].label} Şablonları
              </div>
              {templatesList.filter((t) => t.kind === selectedKind).length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/60 p-2.5 text-[11px] text-muted-foreground">
                  Bu türde henüz özel şablon yok (yerleşik görünüm aktif). Aşağıdan hazır veya özel şablon oluşturun.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {templatesList
                    .filter((t) => t.kind === selectedKind)
                    .map((tpl) => (
                      <div
                        key={tpl.id}
                        className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-border bg-background p-2 text-[11px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-bold">{tpl.name}</span>
                            {tpl.isDefault && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                                <Check className="h-2.5 w-2.5" /> Aktif
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/contents?id=${encodeURIComponent(tpl.id)}&type=template`}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                          >
                            <Pencil className="h-2.5 w-2.5" /> Düzenle
                          </Link>
                          <button
                            type="button"
                            disabled={tplPending}
                            onClick={() =>
                              startTpl(async () => {
                                const res = await setDefaultTemplateAction({
                                  id: tpl.id,
                                  makeDefault: !tpl.isDefault,
                                });
                                if (res.ok) {
                                  setTemplatesList((prev) =>
                                    prev.map((x) =>
                                      x.kind === selectedKind
                                        ? { ...x, isDefault: x.id === tpl.id ? !tpl.isDefault : false }
                                        : x
                                    )
                                  );
                                  showToast(
                                    !tpl.isDefault
                                      ? `"${tpl.name}" varsayılan şablon yapıldı.`
                                      : "Varsayılan şablon kaldırıldı."
                                  );
                                } else {
                                  showToast(res.error);
                                }
                              })
                            }
                            className="rounded border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                          >
                            {tpl.isDefault ? "Kaldır" : "Varsayılan Yap"}
                          </button>
                          <button
                            type="button"
                            disabled={tplPending}
                            onClick={() =>
                              startTpl(async () => {
                                const res = await deleteTemplateAction({ id: tpl.id });
                                if (res.ok) {
                                  setTemplatesList((prev) => prev.filter((x) => x.id !== tpl.id));
                                  showToast("Şablon silindi.");
                                }
                              })
                            }
                            className="rounded border border-border p-1 text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Hazır Şablondan Tek Tıkla Oluştur */}
            <div className="space-y-1.5 border-t border-border pt-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Hazır Şablondan Hızlı Oluştur
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {STARTER_TEMPLATES.filter((st) => st.kind === selectedKind).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold">{st.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {st.description}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={tplPending}
                        onClick={() =>
                          startTpl(async () => {
                            const r = await createTemplateAction({
                              starterId: st.id,
                              makeDefault: true,
                            });
                            if (r.ok) {
                              setTemplatesList((prev) => [
                                ...prev.map((x) =>
                                  x.kind === r.kind ? { ...x, isDefault: false } : x
                                ),
                                {
                                  id: r.id,
                                  name: r.name,
                                  kind: r.kind,
                                  isDefault: true,
                                  blocks: st.blocks.length,
                                },
                              ]);
                              showToast(`"${r.name}" oluşturuldu ve varsayılan yapıldı.`);
                            } else {
                              showToast(r.error);
                            }
                          })
                        }
                        className="inline-flex items-center gap-1 rounded border border-blue-600/40 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-500/20"
                      >
                        <Sparkles className="h-2.5 w-2.5" /> Ekle & Aktif Et
                      </button>
                      <button
                        type="button"
                        disabled={tplPending}
                        onClick={() =>
                          startTpl(async () => {
                            const r = await createTemplateAction({ starterId: st.id });
                            if (r.ok) {
                              window.location.href = `/admin/contents?id=${encodeURIComponent(r.id)}&type=template`;
                            }
                          })
                        }
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                      >
                        <Pencil className="h-2.5 w-2.5" /> Düzenle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sıfırdan Özel Şablon Oluştur */}
            <div className="space-y-2 border-t border-border pt-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sıfırdan Özel Şablon Oluştur
              </div>
              <input
                type="text"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder={`Örn: Özel ${TEMPLATE_KINDS[selectedKind].label} Şablonu`}
                className="h-8 w-full rounded border border-border bg-background px-2.5 text-xs"
              />
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "full", label: "Tam Genişlik" },
                    { id: "right-sidebar", label: "Sağ Sidebar" },
                    { id: "left-sidebar", label: "Sol Sidebar" },
                  ] as const
                ).map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => setNewTplLayout(lm.id)}
                    className={`rounded border py-1 text-[10px] font-semibold ${
                      newTplLayout === lm.id
                        ? "border-blue-600 bg-blue-500/10 text-blue-600"
                        : "border-border bg-background"
                    }`}
                  >
                    {lm.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={tplPending}
                  onClick={() =>
                    startTpl(async () => {
                      const r = await createTemplateAction({
                        kind: selectedKind,
                        customName:
                          newTplName.trim() ||
                          `${TEMPLATE_KINDS[selectedKind].label} (${newTplLayout === "right-sidebar" ? "Sağ SB" : newTplLayout === "left-sidebar" ? "Sol SB" : "Tam"})`,
                        layoutMode: newTplLayout,
                        makeDefault: true,
                      });
                      if (r.ok) {
                        setNewTplName("");
                        setTemplatesList((prev) => [
                          ...prev.map((x) =>
                            x.kind === r.kind ? { ...x, isDefault: false } : x
                          ),
                          {
                            id: r.id,
                            name: r.name,
                            kind: r.kind,
                            isDefault: true,
                            blocks: 1,
                          },
                        ]);
                        showToast(`"${r.name}" oluşturuldu.`);
                      } else {
                        showToast(r.error);
                      }
                    })
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-600/40 bg-blue-500/10 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-500/20"
                >
                  <Plus className="h-3 w-3" /> Oluştur & Aktif Et
                </button>
                <button
                  type="button"
                  disabled={tplPending}
                  onClick={() =>
                    startTpl(async () => {
                      const r = await createTemplateAction({
                        kind: selectedKind,
                        customName:
                          newTplName.trim() ||
                          `${TEMPLATE_KINDS[selectedKind].label} — Özel`,
                        layoutMode: newTplLayout,
                        makeDefault: true,
                      });
                      if (r.ok) {
                        window.location.href = `/admin/contents?id=${encodeURIComponent(r.id)}&type=template`;
                      }
                    })
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700"
                >
                  <Pencil className="h-3 w-3" /> Oluştur & Stüdyoda Aç
                </button>
              </div>
            </div>
          </div>

          {/* Tekil Yazı & Sayfa Başlığı Ayarları */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Blog Yazısı & Sayfa Başlığı Görünümü
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "left", label: "Sola Hizalı Başlık" },
                  { id: "center", label: "Ortalanmış Başlık" },
                ] as const
              ).map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() =>
                    setCustomizer((prev) => ({
                      ...prev,
                      pageTitle: { ...prev.pageTitle, align: al.id },
                    }))
                  }
                  className={`rounded border py-1.5 text-[11px] font-medium ${
                    customizer.pageTitle.align === al.id
                      ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                      : "border-border"
                  }`}
                >
                  {al.label}
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Sayfa Başlığında Breadcrumb Göster</span>
              <input
                type="checkbox"
                checked={customizer.pageTitle.showBreadcrumb ?? customizer.pageTitle.showBreadcrumbs}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    pageTitle: {
                      ...prev.pageTitle,
                      showBreadcrumb: e.target.checked,
                      showBreadcrumbs: e.target.checked,
                    },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Blog Yazısında Yazar & Tarih Bilgisi Göster</span>
              <input
                type="checkbox"
                checked={customizer.pageTitle.showMeta}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    pageTitle: { ...prev.pageTitle, showMeta: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Öne Çıkan Görseli (Kapak) Göster</span>
              <input
                type="checkbox"
                checked={customizer.pageTitle.showFeaturedImage}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    pageTitle: {
                      ...prev.pageTitle,
                      showFeaturedImage: e.target.checked,
                    },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Kategori & Etiket Rozetlerini Göster</span>
              <input
                type="checkbox"
                checked={customizer.pageTitle.showCategories}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    pageTitle: {
                      ...prev.pageTitle,
                      showCategories: e.target.checked,
                    },
                  }))
                }
              />
            </label>
          </div>

          {/* Kategori, Etiket & Mağaza Arşiv Düzeni */}
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kategori, Etiket & Ürün Arşiv Düzeni
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCustomizer((prev) => ({
                    ...prev,
                    archive: { ...prev.archive, layout: "grid" },
                  }))
                }
                className={`inline-flex items-center justify-center gap-1.5 rounded border py-1.5 text-[11px] font-medium ${
                  customizer.archive.layout === "grid"
                    ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                    : "border-border"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kart Izgarası (Grid)
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomizer((prev) => ({
                    ...prev,
                    archive: { ...prev.archive, layout: "list" },
                  }))
                }
                className={`inline-flex items-center justify-center gap-1.5 rounded border py-1.5 text-[11px] font-medium ${
                  customizer.archive.layout === "list"
                    ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                    : "border-border"
                }`}
              >
                <List className="h-3.5 w-3.5" /> Editoryal Liste
              </button>
            </div>

            {customizer.archive.layout === "grid" && (
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Izgara Sütun Sayısı
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([2, 3, 4] as const).map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() =>
                        setCustomizer((prev) => ({
                          ...prev,
                          archive: { ...prev.archive, columns: cols },
                        }))
                      }
                      className={`rounded border py-1 text-[11px] font-medium ${
                        customizer.archive.columns === cols
                          ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                          : "border-border"
                      }`}
                    >
                      {cols} Sütun
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center justify-between cursor-pointer">
              <span>Kartlarda Kapak Görseli Göster</span>
              <input
                type="checkbox"
                checked={customizer.archive.showImage}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    archive: { ...prev.archive, showImage: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Kartlarda Kısa Özet (Excerpt) Göster</span>
              <input
                type="checkbox"
                checked={customizer.archive.showExcerpt}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    archive: { ...prev.archive, showExcerpt: e.target.checked },
                  }))
                }
              />
            </label>
          </div>

          {/* Global Buton Stili */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Global Buton Tasarımı
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "solid", label: "Standart Köşe" },
                  { id: "pill", label: "Tam Yuvarlak (Pill)" },
                  { id: "sharp", label: "Keskin (Sharp)" },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setCustomizer((prev) => ({
                      ...prev,
                      buttons: { ...prev.buttons, style: b.id },
                    }))
                  }
                  className={`rounded border py-1.5 text-[11px] font-medium ${
                    customizer.buttons.style === b.id
                      ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                      : "border-border"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between cursor-pointer pt-1">
              <span>Buton Metinlerini Büyük Harf Yap</span>
              <input
                type="checkbox"
                checked={Boolean(customizer.buttons.uppercase)}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    buttons: { ...prev.buttons, uppercase: e.target.checked },
                  }))
                }
              />
            </label>
          </div>

          {/* Global Özel CSS */}
          <div>
            <label className="block text-[11px] font-semibold mb-1">
              Global Özel CSS (Site Geneli)
            </label>
            <textarea
              aria-label="Global Özel CSS (Site Geneli)"
              rows={3}
              value={customizer.customCss}
              onChange={(e) =>
                setCustomizer((prev) => ({
                  ...prev,
                  customCss: e.target.value,
                }))
              }
              placeholder="/* Site geneli ek CSS kuralları */"
              className="w-full rounded border border-border bg-zinc-950 p-2 font-mono text-[11px] text-emerald-300"
            />
          </div>
        </div>
      )}
    </>
  );
}
