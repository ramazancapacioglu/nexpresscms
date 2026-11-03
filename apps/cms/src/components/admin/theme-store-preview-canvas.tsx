import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  FolderKanban,
  Home,
  PanelLeft,
  PanelRight,
  Search,
  ShoppingBag,
  Square,
  Store,
  Tag,
} from "lucide-react";
import type { PreviewPageType, ThemeStoreState } from "./use-theme-store";

const PREVIEW_PAGES: Array<{
  id: PreviewPageType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "post", label: "Blog Yazısı", icon: BookOpen },
  { id: "category", label: "Kategori", icon: FolderKanban },
  { id: "tag", label: "Etiket", icon: Tag },
  { id: "page", label: "Sayfa", icon: FileText },
  { id: "product", label: "Ürün Detay", icon: ShoppingBag },
  { id: "shop", label: "Ürün Kategori", icon: Store },
  { id: "search", label: "Arama", icon: Search },
];

/** SAĞ CANLI ÖNİZLEME KANVASI (7 Sütun — 8 Sayfa Şablonu + Sağ/Sol Sidebar + Mega Menü) */
export function ThemeStorePreviewCanvas({ s }: { s: ThemeStoreState }) {
  const {
    tokens,
    customizer,
    setCustomizer,
    previewDevice,
    previewPageType,
    setPreviewPageType,
    btnRadius,
  } = s;
  const [megaOpen, setMegaOpen] = useState(false);

  const sidebarPos = customizer.layout.sidebarPosition ?? "none";
  const shouldShowSidebar =
    sidebarPos !== "none" &&
    (previewPageType === "home"
      ? false
      : previewPageType === "post"
        ? (customizer.layout.sidebarOnBlog ?? true)
        : previewPageType === "category" || previewPageType === "tag"
          ? (customizer.layout.sidebarOnArchive ?? true)
          : previewPageType === "page"
            ? (customizer.layout.sidebarOnPage ?? false)
            : previewPageType === "product" || previewPageType === "shop"
              ? (customizer.layout.sidebarOnShop ?? true)
              : (customizer.layout.sidebarOnSearch ?? false));

  const showBreadcrumb =
    customizer.pageTitle.showBreadcrumb ?? customizer.pageTitle.showBreadcrumbs;
  const titleAlign =
    customizer.pageTitle.align === "center" ? "text-center" : "text-left";
  const archiveCols =
    customizer.archive.layout === "list"
      ? "grid-cols-1"
      : customizer.archive.columns === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : customizer.archive.columns === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-3";
  const footerCols =
    customizer.footer.columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : customizer.footer.columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  const sidebarElement = shouldShowSidebar ? (
    <aside
      style={{
        borderColor: tokens.colors.border,
        backgroundColor: tokens.colors.muted,
        borderRadius: tokens.geometry.borderRadius,
      }}
      className="w-full md:w-60 shrink-0 border p-4 space-y-4 self-start"
    >
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
          Site İçi Arama
        </div>
        <div
          style={{
            borderColor: tokens.colors.border,
            backgroundColor: tokens.colors.background,
          }}
          className="flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] opacity-80"
        >
          <span>Ara…</span>
          <Search className="h-3 w-3 opacity-60" />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">
          {previewPageType === "product" || previewPageType === "shop"
            ? "Ürün Kategorileri"
            : "Popüler İçerikler"}
        </div>
        <ul className="space-y-1.5 text-[11px]">
          {(previewPageType === "product" || previewPageType === "shop"
            ? [
                "Kurumsal Lisanslar (14)",
                "E-Ticaret Modülleri (9)",
                "POS & Ödeme Sistemleri (7)",
                "Bulut Sunucu Paketleri (5)",
              ]
            : [
                "0-KB RSC Mimarisi Nedir?",
                "Görsel Editör ve Sekme Rehberi",
                "Teknik SEO & Schema.org",
                "Çoklu Kiracı (Multi-Tenant) Yapısı",
              ]
          ).map((item, i) => (
            <li
              key={i}
              style={{ borderColor: tokens.colors.border }}
              className="border-b pb-1.5 last:border-none flex items-center justify-between"
            >
              <span className="truncate">{item}</span>
              <span style={{ color: tokens.colors.primary }} className="font-bold">
                ›
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          backgroundColor: tokens.colors.secondary,
          color: tokens.colors.secondaryForeground,
          borderRadius: tokens.geometry.borderRadius,
        }}
        className="p-3 space-y-1.5"
      >
        <div className="text-[10px] font-bold uppercase opacity-80">
          Uzman Desteği
        </div>
        <p className="text-[11px] opacity-90 leading-snug">
          Projeniz için özel şablon ve entegrasyon desteği alın.
        </p>
      </div>
    </aside>
  ) : null;

  return (
    <div className={`${s.hideControlPanel ? "lg:col-span-12" : "lg:col-span-7"} flex flex-col gap-2.5`}>
      {/* Üst Canlı Şablon & Sidebar Seçici Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1">
          {PREVIEW_PAGES.map((pg) => {
            const Icon = pg.icon;
            const active = previewPageType === pg.id;
            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => setPreviewPageType(pg.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{pg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hızlı Sidebar Konumu Anahtarı */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 text-[10px] font-semibold">
          {(
            [
              { id: "none", label: "Tam", icon: Square },
              { id: "left", label: "Sol SB", icon: PanelLeft },
              { id: "right", label: "Sağ SB", icon: PanelRight },
            ] as const
          ).map((sb) => {
            const Icon = sb.icon;
            const active = sidebarPos === sb.id;
            return (
              <button
                key={sb.id}
                type="button"
                title={`Kenar Çubuğu: ${sb.label}`}
                onClick={() =>
                  setCustomizer((prev) => ({
                    ...prev,
                    layout: {
                      ...prev.layout,
                      sidebarPosition: sb.id,
                      ...(sb.id !== "none" ? { sidebarOnPage: true, sidebarOnSearch: true } : {}),
                    },
                  }))
                }
                className={`inline-flex items-center gap-1 rounded px-2 py-1 transition ${
                  active
                    ? "bg-background text-blue-600 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{sb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canlı Önizleme Tuvali */}
      <div
        className={`mx-auto w-full transition-all duration-200 rounded-2xl border border-border shadow-md overflow-hidden ${
          previewDevice === "mobile"
            ? "max-w-[390px]"
            : previewDevice === "tablet"
              ? "max-w-[720px]"
              : "w-full"
        }`}
        data-axe-skip="tema önizlemesi: renkler kullanıcı tasarım token'larından gelir"
        style={{
          backgroundColor: tokens.colors.background,
          color: tokens.colors.foreground,
          fontFamily: tokens.typography.bodyFont,
        }}
      >
        {/* 1. CANLI HEADER + MEGA MENÜ ÖNİZLEMESİ */}
        <div
          style={{
            borderColor: tokens.colors.border,
            backgroundColor: tokens.colors.background,
            minHeight: `${Math.min(88, Math.max(52, customizer.header.height || 64))}px`,
          }}
          className="relative flex items-center justify-between border-b px-6 py-3"
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="px-2.5 py-1 text-xs font-bold"
            >
              N
            </span>
            <div>
              <span
                style={{ fontFamily: tokens.typography.headingFont }}
                className="font-bold text-sm block leading-none"
              >
                {customizer.header.logoText || "NexPress Vitrin"}
              </span>
              {customizer.header.showTagline && (
                <span className="text-[10px] opacity-65">
                  Kurumsal İçerik & E-Ticaret
                </span>
              )}
            </div>
          </div>

          <div
            className={`hidden sm:flex items-center gap-5 text-xs font-medium opacity-85 ${
              customizer.header.menuAlign === "center"
                ? "mx-auto"
                : customizer.header.menuAlign === "right"
                  ? "ml-auto mr-4"
                  : "ml-6 mr-auto"
            }`}
          >
            <button
              type="button"
              onClick={() => setPreviewPageType("home")}
              className="hover:underline"
            >
              Ana Sayfa
            </button>
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMegaOpen((v) => !v)}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <span>Çözümler (Mega)</span>
                <span className="text-[9px] opacity-70">▼</span>
              </button>
              {megaOpen && (
                <div
                  style={{
                    backgroundColor: tokens.colors.background,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.geometry.borderRadius,
                  }}
                  className="absolute left-0 top-full z-30 mt-2 w-96 border p-3.5 shadow-xl grid grid-cols-2 gap-2.5 text-left"
                >
                  {[
                    {
                      t: "Görsel Blok Stüdyosu",
                      d: "Satır, sütun, sekme ve hazır şablonlar",
                      b: "YENİ",
                    },
                    {
                      t: "E-Ticaret & Mağaza",
                      d: "Ürün vitrini, varyant ve sepet",
                      b: "PRO",
                    },
                    {
                      t: "Teknik SEO & GEO",
                      d: "Otomatik JSON-LD ve llms.txt",
                      b: "",
                    },
                    {
                      t: "Çoklu Dil & Kiracı",
                      d: "TR/EN çeviri ve alt alan adı",
                      b: "",
                    },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: tokens.colors.muted }}
                      className="rounded-lg p-2 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">{m.t}</span>
                        {m.b && (
                          <span
                            style={{
                              backgroundColor: tokens.colors.primary,
                              color: tokens.colors.primaryForeground,
                            }}
                            className="rounded px-1 text-[8px] font-bold"
                          >
                            {m.b}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-75 leading-tight">
                        {m.d}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPreviewPageType("post")}
              className="hover:underline"
            >
              Blog
            </button>
            <button
              type="button"
              onClick={() => setPreviewPageType("shop")}
              className="hover:underline"
            >
              Mağaza
            </button>
          </div>

          {customizer.header.showCta !== false && (
            <span
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: btnRadius,
                textTransform: customizer.buttons.uppercase
                  ? "uppercase"
                  : "none",
              }}
              className="px-3.5 py-1.5 text-[11px] font-semibold shrink-0"
            >
              {customizer.header.ctaLabel || "Canlı Demo"}
            </span>
          )}
        </div>

        {/* 2. GÖVDE + SAĞ/SOL SIDEBAR ALANI */}
        <div
          className={`p-6 md:p-8 ${
            customizer.layout.contentLayout === "boxed" ? "mx-auto" : "w-full"
          }`}
          style={{ maxWidth: tokens.geometry.containerMaxWidth }}
        >
          {/* Breadcrumb */}
          {showBreadcrumb && (
            <div
              style={{ color: tokens.colors.mutedForeground }}
              className={`mb-5 text-[11px] font-medium ${titleAlign}`}
            >
              Ana Sayfa ›{" "}
              {PREVIEW_PAGES.find((p) => p.id === previewPageType)?.label} ›{" "}
              <span style={{ color: tokens.colors.primary }}>
                Canlı Şablon Önizlemesi
              </span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {shouldShowSidebar && sidebarPos === "left" && sidebarElement}

            <div className="min-w-0 flex-1 w-full space-y-6">
              {/* ŞABLON A: ANA SAYFA (VİTRİN) */}
              {previewPageType === "home" && (
                <>
                  <div
                    style={{
                      backgroundColor: tokens.colors.secondary,
                      color: tokens.colors.secondaryForeground,
                      borderRadius: tokens.geometry.borderRadius,
                    }}
                    className="p-7 space-y-4"
                  >
                    <span
                      style={{
                        backgroundColor: tokens.colors.primary,
                        color: tokens.colors.primaryForeground,
                      }}
                      className="inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    >
                      CANLI TASARIM TOKEN ÖNİZLEMESİ
                    </span>
                    <h2
                      style={{
                        fontFamily: tokens.typography.headingFont,
                        fontWeight: Number(customizer.typography.headingWeight),
                      }}
                      className="text-2xl md:text-3xl leading-tight"
                    >
                      Tasarım Tokenlarınız 0 KB İstemci JS İle Anında Ön Yüze Yansır
                    </h2>
                    <p className="text-xs md:text-sm opacity-85 leading-relaxed">
                      Seçtiğiniz global renk paleti, yazı tipi ölçeği, sayfa genişliği ({tokens.geometry.containerMaxWidth}) ve buton geometrisi saf CSS değişkenlerine derlenir.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="button"
                        style={{
                          backgroundColor: tokens.colors.primary,
                          color: tokens.colors.primaryForeground,
                          borderRadius: btnRadius,
                          textTransform: customizer.buttons.uppercase ? "uppercase" : "none",
                        }}
                        className="px-5 py-2 text-xs font-semibold"
                      >
                        Birincil Aksiyon
                      </button>
                      <button
                        type="button"
                        style={{
                          backgroundColor: tokens.colors.accent,
                          color: tokens.colors.accentForeground,
                          borderRadius: btnRadius,
                        }}
                        className="px-5 py-2 text-xs font-semibold"
                      >
                        Vurgu Butonu (Accent)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Global Renk & Tipografi Sistemi",
                        desc: "Tek tıkla tüm sitedeki başlık, gövde ve yüzey renklerini değiştirin.",
                      },
                      {
                        title: "Düzen ve Düğme Geometrisi",
                        desc: `İçerik genişliği ${customizer.layout.articleWidth}, düğme yüksekliği ${customizer.buttons.paddingY}.`,
                      },
                    ].map((card, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: tokens.colors.muted,
                          borderColor: tokens.colors.border,
                          borderRadius: tokens.geometry.borderRadius,
                        }}
                        className="border p-5 space-y-2"
                      >
                        <div
                          style={{
                            color: tokens.colors.primary,
                            fontFamily: tokens.typography.headingFont,
                            fontWeight: Number(customizer.typography.headingWeight),
                          }}
                          className="text-sm"
                        >
                          {card.title}
                        </div>
                        <p
                          style={{
                            color: tokens.colors.mutedForeground,
                            lineHeight: customizer.typography.bodyLineHeight,
                          }}
                          className="text-xs"
                        >
                          {card.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ŞABLON B: BLOG YAZISI (`post`) VE KURUMSAL SAYFA (`page`) */}
              {(previewPageType === "post" || previewPageType === "page") && (
                <article
                  style={{ maxWidth: customizer.layout.articleWidth }}
                  className="mx-auto space-y-4"
                >
                  {previewPageType === "post" && customizer.pageTitle.showCategories && (
                    <div className={`flex flex-wrap gap-1.5 ${customizer.pageTitle.align === "center" ? "justify-center" : ""}`}>
                      <span
                        style={{
                          backgroundColor: tokens.colors.primary,
                          color: tokens.colors.primaryForeground,
                        }}
                        className="rounded px-2 py-0.5 text-[10px] font-bold"
                      >
                        MİMARİ & PERFORMANS
                      </span>
                      <span
                        style={{
                          backgroundColor: tokens.colors.muted,
                          color: tokens.colors.mutedForeground,
                        }}
                        className="rounded px-2 py-0.5 text-[10px] font-mono"
                      >
                        #0kb-rsc
                      </span>
                    </div>
                  )}

                  <h1
                    style={{
                      fontFamily: tokens.typography.headingFont,
                      fontWeight: Number(customizer.typography.headingWeight),
                    }}
                    className={`text-2xl font-extrabold leading-tight ${titleAlign}`}
                  >
                    {previewPageType === "post"
                      ? "Yeni Nesil Görsel İçerik Editörü ve 0-KB RSC Yayın Mimarisi"
                      : "Kurumsal Çözümlerimiz ve Hizmet Standartlarımız"}
                  </h1>

                  {previewPageType === "post" && customizer.pageTitle.showMeta && (
                    <div
                      style={{ color: tokens.colors.mutedForeground }}
                      className={`text-[11px] ${titleAlign}`}
                    >
                      Yazar: <strong>Baş Mimari Ekibi</strong> • 14 Kasım 2026 • 4 dk okuma
                    </div>
                  )}

                  {customizer.pageTitle.showFeaturedImage && (
                    <div
                      style={{
                        backgroundColor: tokens.colors.secondary,
                        color: tokens.colors.secondaryForeground,
                        borderRadius: tokens.geometry.borderRadius,
                      }}
                      className="flex h-36 items-center justify-center border text-xs font-medium opacity-90"
                    >
                      Öne Çıkan Görsel Alanı (1600×900 • Responsive AVIF/WebP)
                    </div>
                  )}

                  <p
                    style={{ lineHeight: customizer.typography.bodyLineHeight }}
                    className="text-xs opacity-90"
                  >
                    Sayfa ve blog yazılarınız seçtiğiniz{" "}
                    <strong>{customizer.layout.articleWidth}</strong> okuma genişliği ve{" "}
                    <strong>
                      {sidebarPos === "none"
                        ? "tam genişlik"
                        : sidebarPos === "left"
                          ? "sol kenar çubuğu"
                          : "sağ kenar çubuğu"}
                    </strong>{" "}
                    düzeniyle ziyaretçiye sunulur.
                  </p>
                </article>
              )}

              {/* ŞABLON C: KATEGORİ, ETİKET VE ÜRÜN KATEGORİSİ / MAĞAZA ARŞİVLERİ */}
              {(previewPageType === "category" ||
                previewPageType === "tag" ||
                previewPageType === "shop") && (
                <div className="space-y-4">
                  <div className={titleAlign}>
                    <span
                      style={{ color: tokens.colors.primary }}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {previewPageType === "category"
                        ? "KATEGORİ ARŞİVİ"
                        : previewPageType === "tag"
                          ? "ETİKET ARŞİVİ"
                          : "ÜRÜN KATEGORİSİ & MAĞAZA VİTRİNİ"}
                    </span>
                    <h1
                      style={{
                        fontFamily: tokens.typography.headingFont,
                        fontWeight: Number(customizer.typography.headingWeight),
                      }}
                      className="text-xl font-bold mt-0.5"
                    >
                      {previewPageType === "category"
                        ? "Kurumsal Teknoloji & Yazılım"
                        : previewPageType === "tag"
                          ? "#yapay-zeka-seo"
                          : "Kurumsal Yazılım & POS Çözümleri"}
                    </h1>
                  </div>

                  <div className={`grid gap-3 ${archiveCols}`}>
                    {[1, 2, 3, 4]
                      .slice(0, customizer.archive.layout === "list" ? 3 : customizer.archive.columns || 3)
                      .map((n) => (
                        <div
                          key={n}
                          style={{
                            borderColor: tokens.colors.border,
                            backgroundColor: tokens.colors.muted,
                            borderRadius: tokens.geometry.borderRadius,
                          }}
                          className={`border p-3.5 ${
                            customizer.archive.layout === "list"
                              ? "flex items-center gap-4"
                              : "space-y-2"
                          }`}
                        >
                          {customizer.archive.showImage && (
                            <div
                              style={{
                                backgroundColor: tokens.colors.secondary,
                                color: tokens.colors.secondaryForeground,
                                borderRadius: tokens.geometry.borderRadius,
                              }}
                              className={
                                customizer.archive.layout === "list"
                                  ? "h-16 w-24 shrink-0 flex items-center justify-center text-[10px] font-bold"
                                  : "h-24 w-full flex items-center justify-center text-[10px] font-bold"
                              }
                            >
                              {previewPageType === "shop" ? `ÜRÜN #${n}` : `KAPAK #${n}`}
                            </div>
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div
                              style={{ fontFamily: tokens.typography.headingFont }}
                              className="text-xs font-bold truncate"
                            >
                              {previewPageType === "shop"
                                ? `NexPress Kurumsal Paket v${n}.0`
                                : `Örnek Arşiv Makalesi Başlığı #${n}`}
                            </div>
                            {customizer.archive.showExcerpt && (
                              <p
                                style={{ color: tokens.colors.mutedForeground }}
                                className="text-[11px] line-clamp-2"
                              >
                                Kategori ve arşiv şablonunda özet metni, görsel ve sütun yapısı canlı olarak güncellenir.
                              </p>
                            )}
                            {previewPageType === "shop" && (
                              <div className="pt-1 flex items-center justify-between">
                                <span
                                  style={{ color: tokens.colors.primary }}
                                  className="text-xs font-extrabold"
                                >
                                  ₺4.900
                                </span>
                                <span
                                  style={{
                                    backgroundColor: tokens.colors.primary,
                                    color: tokens.colors.primaryForeground,
                                    borderRadius: btnRadius,
                                  }}
                                  className="px-2 py-0.5 text-[10px] font-semibold"
                                >
                                  İncele
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ŞABLON D: ÜRÜN DETAY (`product`) */}
              {previewPageType === "product" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                  <div
                    style={{
                      backgroundColor: tokens.colors.secondary,
                      color: tokens.colors.secondaryForeground,
                      borderRadius: tokens.geometry.borderRadius,
                    }}
                    className="h-52 flex flex-col items-center justify-center p-4 text-center"
                  >
                    <ShoppingBag className="h-8 w-8 mb-2 opacity-80" />
                    <span className="text-xs font-bold">Ürün Görsel Galerisi</span>
                    <span className="text-[10px] opacity-70">6+6 İki Sütunlu Ürün Şablonu</span>
                  </div>
                  <div className="space-y-3">
                    <span
                      style={{
                        backgroundColor: tokens.colors.muted,
                        color: tokens.colors.primary,
                      }}
                      className="inline-block rounded px-2 py-0.5 text-[10px] font-bold"
                    >
                      STOKTA • HEMEN TESLİM
                    </span>
                    <h1
                      style={{
                        fontFamily: tokens.typography.headingFont,
                        fontWeight: Number(customizer.typography.headingWeight),
                      }}
                      className="text-xl font-extrabold"
                    >
                      NexPress Enterprise Ticaret Paketi
                    </h1>
                    <div
                      style={{ color: tokens.colors.primary }}
                      className="text-lg font-black"
                    >
                      ₺12.500{" "}
                      <span className="text-xs font-normal opacity-70">+ KDV</span>
                    </div>
                    <p
                      style={{ color: tokens.colors.mutedForeground }}
                      className="text-xs leading-relaxed"
                    >
                      Satın alma kutusu (tpl_product_buy), varyant seçimi ve teknik özellik sekmeleriyle tam entegre ürün şablonu.
                    </p>
                    <button
                      type="button"
                      style={{
                        backgroundColor: tokens.colors.primary,
                        color: tokens.colors.primaryForeground,
                        borderRadius: btnRadius,
                        textTransform: customizer.buttons.uppercase ? "uppercase" : "none",
                      }}
                      className="w-full py-2 text-xs font-bold"
                    >
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* ŞABLON E: ARAMA SONUÇLARI (`search`) */}
              {previewPageType === "search" && (
                <div className="space-y-4">
                  <h1
                    style={{
                      fontFamily: tokens.typography.headingFont,
                      fontWeight: Number(customizer.typography.headingWeight),
                    }}
                    className={`text-xl font-bold ${titleAlign}`}
                  >
                    &ldquo;pos entegrasyonu&rdquo; İçin Arama Sonuçları (3)
                  </h1>
                  <div className="flex gap-2">
                    <div
                      style={{
                        borderColor: tokens.colors.border,
                        backgroundColor: tokens.colors.muted,
                        borderRadius: tokens.geometry.borderRadius,
                      }}
                      className="flex-1 border px-3 py-2 text-xs"
                    >
                      pos entegrasyonu
                    </div>
                    <button
                      type="button"
                      style={{
                        backgroundColor: tokens.colors.primary,
                        color: tokens.colors.primaryForeground,
                        borderRadius: btnRadius,
                      }}
                      className="px-4 py-2 text-xs font-semibold"
                    >
                      Ara
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      "Android POS Entegrasyonu ve Saha Satış Rehberi",
                      "E-Ticaret Ödeme Geçidi ve Sanal POS Kurulumu",
                      "Kurumsal ERP ve Stok Senkronizasyonu",
                    ].map((resTitle, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderColor: tokens.colors.border,
                          backgroundColor: tokens.colors.muted,
                          borderRadius: tokens.geometry.borderRadius,
                        }}
                        className="border p-3 space-y-1"
                      >
                        <div
                          style={{ color: tokens.colors.primary }}
                          className="text-xs font-bold"
                        >
                          {resTitle}
                        </div>
                        <p
                          style={{ color: tokens.colors.mutedForeground }}
                          className="text-[11px]"
                        >
                          BM25 tam metin arama motoru ile bulunan sayfa, blog ve ürün sonuçları burada listelenir…
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {shouldShowSidebar && sidebarPos === "right" && sidebarElement}
          </div>
        </div>

        {/* 3. CANLI FOOTER ÖNİZLEMESİ */}
        <footer
          style={{
            borderColor: tokens.colors.border,
            backgroundColor: customizer.footer.background || tokens.colors.muted,
            color: customizer.footer.textColor || tokens.colors.foreground,
          }}
          className="border-t px-6 py-6 text-xs"
        >
          <div className={`grid gap-6 ${footerCols}`}>
            {customizer.footer.showBrand && (
              <div className="space-y-1.5">
                <div
                  style={{ fontFamily: tokens.typography.headingFont }}
                  className="font-bold text-sm"
                >
                  {customizer.header.logoText || "NexPress Vitrin"}
                </div>
                <p className="text-[11px] opacity-75 leading-relaxed">
                  100/100 Lighthouse hızı ve görsel şablon mimarisi.
                </p>
              </div>
            )}
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wider mb-1.5">
                Platform
              </div>
              <ul className="space-y-1 text-[11px] opacity-80">
                <li>Görsel Stüdyo</li>
                <li>Şablon Yöneticisi</li>
                <li>Mega Menü</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wider mb-1.5">
                Şablonlar
              </div>
              <ul className="space-y-1 text-[11px] opacity-80">
                <li>Blog & Kategori</li>
                <li>Mağaza & Ürünler</li>
                <li>Arama Sonuçları</li>
              </ul>
            </div>
            {customizer.footer.columns >= 4 && (
              <div>
                <div className="font-bold text-[11px] uppercase tracking-wider mb-1.5">
                  İletişim
                </div>
                <ul className="space-y-1 text-[11px] opacity-80">
                  <li>bilgi@nexpress.dev</li>
                  <li>İstanbul, Türkiye</li>
                </ul>
              </div>
            )}
          </div>
          <div
            style={{ borderColor: tokens.colors.border }}
            className="mt-5 border-t pt-3 flex items-center justify-between text-[10px] opacity-70"
          >
            <span>
              {customizer.footer.copyright ||
                "© 2026 NexPress CMS — Tüm hakları saklıdır."}
            </span>
            <span>{customizer.footer.columns} Kolonlu Footer</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
