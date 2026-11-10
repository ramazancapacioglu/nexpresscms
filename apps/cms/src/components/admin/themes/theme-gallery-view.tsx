"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Layers,
  Palette,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { DesignTokens } from "@nexpress/core";
import { activateThemeAction } from "@/app/admin/actions";
import { importThemeDemoAction } from "@/app/admin/themes/demo-actions";
import {
  activateUploadedThemeAction,
  deleteUploadedThemeAction,
} from "@/app/admin/themes/packages/actions";
import { UploadPanel } from "@/app/admin/themes/packages/upload-panel";

export interface ThemeGalleryItem {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  tagline?: string;
  isOfficial: boolean;
  isActive: boolean;
  screenshot?: string | null;
  swatches: string[];
  tokens?: DesignTokens;
  pages?: number;
  hasChrome?: boolean;
  hasCss?: boolean;
  /** Etkin temada ayrı aktarılan demo içerik sayısı. 0 ise düğme gizlenir. */
  demoCount?: number;
}

interface ThemeGalleryViewProps {
  activeTheme: ThemeGalleryItem;
  themes: ThemeGalleryItem[];
  defaultLocale: string;
  /** Tek dilde boş: önizleme `/?nx_preview=` olur, `/tr` yönlendirmesine düşmez. */
  previewBase?: string;
}

function previewHref(base: string, id: string): string {
  const query = `nx_preview=${encodeURIComponent(id)}`;
  return `${base || ""}/?${query}`.replace(/\/\//, "/");
}

export function ThemeGalleryView({
  activeTheme,
  themes,
  defaultLocale,
  previewBase,
}: ThemeGalleryViewProps) {
  const previewRoot = previewBase ?? `/${defaultLocale}`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filterType, setFilterType] = useState<"all" | "official" | "uploaded">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [notification, setNotification] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  // Yüklenen tema etkinleştirme onay modalı durumu
  const [activationModalTheme, setActivationModalTheme] =
    useState<ThemeGalleryItem | null>(null);
  const [modalApplyChrome, setModalApplyChrome] = useState(true);
  const [modalAddPages, setModalAddPages] = useState(false);

  const notify = (tone: "ok" | "err", text: string) => {
    setNotification({ tone, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredThemes = themes.filter((thm) => {
    if (filterType === "official" && !thm.isOfficial) return false;
    if (filterType === "uploaded" && thm.isOfficial) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        thm.name.toLowerCase().includes(q) ||
        thm.description.toLowerCase().includes(q) ||
        thm.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Resmi temayı doğrudan etkinleştir
  const handleActivateOfficial = (theme: ThemeGalleryItem) => {
    startTransition(async () => {
      try {
        const res = await activateThemeAction({ themeId: theme.id });
        if (res.ok) {
          notify("ok", `“${theme.name}” teması etkinleştirildi. Demo sayfalar ayrı aktarılır.`);
          router.refresh();
        } else {
          notify("err", "Tema etkinleştirilemedi.");
        }
      } catch {
        notify("err", "Bir hata oluştu.");
      }
    });
  };

  const handleImportDemo = (theme: ThemeGalleryItem) => {
    const count = theme.demoCount ?? 0;
    if (!window.confirm(`“${theme.name}” demosu ${count} sayfa ve yazı ekler. Aynı adresteki içerik değişmez. Menü bu temanın düzenine çekilir.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await importThemeDemoAction({ themeId: theme.id });
        if (res.ok) {
          const skip = res.skipped.length ? ` ${res.skipped.length} adres dolu olduğu için atlandı.` : "";
          notify("ok", `${res.added} demo içerik eklendi.${skip} İçerikler yayında ve düzenlenebilir.`);
          router.refresh();
        } else {
          notify("err", res.error);
        }
      } catch {
        notify("err", "Demo aktarımı tamamlanamadı.");
      }
    });
  };

  // Yüklenen temayı modal onayından sonra etkinleştir
  const handleConfirmActivateUploaded = () => {
    if (!activationModalTheme) return;
    const target = activationModalTheme;
    startTransition(async () => {
      try {
        const res = await activateUploadedThemeAction({
          themeId: target.id,
          applyChrome: modalApplyChrome,
          addPages: modalAddPages,
        });
        if (res.ok) {
          setActivationModalTheme(null);
          notify(
            "ok",
            `“${target.name}” teması etkinleştirildi${res.chromeApplied ? " (header/footer şablonu uygulandı)" : ""}.`
          );
          router.refresh();
        } else {
          notify("err", res.error || "Etkinleştirme başarısız.");
        }
      } catch {
        notify("err", "Bir hata oluştu.");
      }
    });
  };

  // Yüklenen temayı sil
  const handleDeleteUploaded = (theme: ThemeGalleryItem) => {
    if (!window.confirm(`“${theme.name}” temasını silmek istediğinize emin misiniz?`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await deleteUploadedThemeAction({ themeId: theme.id });
        if (res.ok) {
          notify("ok", `“${theme.name}” teması silindi.`);
          router.refresh();
        } else {
          notify("err", res.error || "Silme başarısız.");
        }
      } catch {
        notify("err", "Silme işlemi sırasında hata oluştu.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Bildirim */}
      {notification && (
        <div
          role={notification.tone === "err" ? "alert" : "status"}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg transition animate-in fade-in slide-in-from-bottom-2 ${
            notification.tone === "ok"
              ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800"
              : "border-rose-500/40 bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          {notification.tone === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Üst Başlık & Hızlı Aksiyonlar */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Temalar
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 font-bold">
              {themes.length} Tema
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kurulu temalar ve paket yükleme. Renk ve yazı özelleştiricide, şablon ataması şablon sayfasındadır.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Özelleştir Butonu */}
          <Link
            href="/admin/themes/customize"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Palette className="h-4 w-4" />
            <span>Aktif Temayı Özelleştir</span>
          </Link>

          {/* Yeni Tema Yükle Butonu */}
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
              showUpload
                ? "border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{showUpload ? "Yükleme Alanını Kapat" : "Tema Yükle (.nxtheme)"}</span>
          </button>

          {/* Dışa Aktar */}
          <a
            href="/api/admin/themes/export?current=1"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted transition"
            title="Şu an yayında olan tasarımı ve tokenları .nxtheme paketi olarak indirir"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Dışa Aktar</span>
          </a>
        </div>
      </div>

      {/* Sürükle-Bırak Tema Yükleme Bölümü (Açılır/Kapanır) */}
      {showUpload && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-600" />
              <span>Yeni Tema Paketi Yükle (.nxtheme)</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Kapat ✕
            </button>
          </div>
          <UploadPanel />
        </div>
      )}

      {/* Aktif Tema Kartı (Hero Section) */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Görsel / Renk Paleti Önizleme */}
          <div className="relative w-full md:w-72 h-44 shrink-0 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
            {activeTheme.screenshot ? (
              <img
                src={activeTheme.screenshot}
                alt={activeTheme.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-muted/50 to-muted">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="space-y-1 text-center">
                  <Sparkles className="h-6 w-6 text-blue-600 mx-auto opacity-70" />
                  <div className="text-xs font-bold text-foreground">
                    {activeTheme.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {activeTheme.isOfficial ? "Resmi NexPress Teması" : "Yüklenen Veri Teması"}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {activeTheme.swatches.map((c, i) => (
                    <span
                      key={i}
                      className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                <Check className="h-3 w-3 stroke-[3]" /> ETKİN TEMA
              </span>
            </div>
          </div>

          {/* Aktif Tema Bilgileri & Aksiyonlar */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">
                  {activeTheme.name}
                </h2>
                <span className="font-mono text-xs rounded bg-muted px-2 py-0.5 text-muted-foreground">
                  v{activeTheme.version}
                </span>
                <span className="text-xs text-muted-foreground">
                  Yazar: <strong className="text-foreground">{activeTheme.author}</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {activeTheme.description}
              </p>
            </div>

            {/* Rozetler & Özellikler */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                ⚡ 100/100 Lighthouse Uyumlu
              </span>
              <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                🛡️ 0-KB RSC Hız Mimarisi
              </span>
              {activeTheme.hasChrome && (
                <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                  ✨ Özel Header/Footer
                </span>
              )}
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href="/admin/themes/customize"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Bu Temayı Özelleştir</span>
              </Link>

              <a
                href={previewHref(previewRoot, activeTheme.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sitede Canlı Gör</span>
              </a>

              <a
                href={
                  activeTheme.isOfficial
                    ? "/api/admin/themes/export?current=1"
                    : `/api/admin/themes/export?id=${encodeURIComponent(activeTheme.id)}`
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Paketi İndir (.nxtheme)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tema Galerisi Başlığı, Filtreler & Arama */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "all"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tüm Temalar ({themes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("official")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "official"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Resmi Temalar ({themes.filter((t) => t.isOfficial).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("uploaded")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "uploaded"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yüklenen Paketler ({themes.filter((t) => !t.isOfficial).length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tema ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Tema Kartları Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredThemes.map((thm) => {
            const isCurrentlyActive = thm.id === activeTheme.id;
            return (
              <div
                key={thm.id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border transition bg-card shadow-2xs ${
                  isCurrentlyActive
                    ? "border-blue-600 ring-1 ring-blue-600"
                    : "border-border hover:border-blue-400"
                }`}
              >
                <div>
                  {/* Görsel / Banner */}
                  <div className="relative h-36 bg-muted/60 border-b border-border overflow-hidden">
                    {thm.screenshot ? (
                      <img
                        src={thm.screenshot}
                        alt={thm.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-muted/30 to-muted/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {thm.isOfficial ? "Official" : "Package"}
                          </span>
                          <span className="font-mono text-[10px] rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground border border-border">
                            v{thm.version}
                          </span>
                        </div>
                        <div className="text-center font-bold text-sm text-foreground">
                          {thm.name}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {thm.swatches.map((c, i) => (
                            <span
                              key={i}
                              className="h-3 w-3 rounded-full border border-black/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {isCurrentlyActive && (
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        ✓ Aktif
                      </span>
                    )}

                    {!thm.isOfficial && (
                      <span className="absolute bottom-2 left-2 rounded bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
                        📦 .nxtheme
                      </span>
                    )}
                  </div>

                  {/* İçerik */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-foreground">
                        {thm.name}
                      </h3>
                      {thm.isOfficial ? (
                        <span className="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          Resmi Tema
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {thm.author || "Özel Tema"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {thm.description}
                    </p>

                    {/* Renk Çemberleri */}
                    <div className="flex items-center gap-1 pt-1">
                      {thm.swatches.slice(0, 5).map((color, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: color }}
                          className="h-3.5 w-3.5 rounded-full border border-border"
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alt Aksiyon Butonları */}
                <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Önizle */}
                    <a
                      href={previewHref(previewRoot, thm.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted transition"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span>Önizle</span>
                    </a>

                    {/* Dışa Aktar (Yüklenen temalar için) */}
                    {!thm.isOfficial && (
                      <a
                        href={`/api/admin/themes/export?id=${encodeURIComponent(thm.id)}`}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Temayı İndir"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    )}

                    {/* Sil (Yüklenen ve aktif olmayan temalar için) */}
                    {!thm.isOfficial && !isCurrentlyActive && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteUploaded(thm)}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-card p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Temayı Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Etkinleştir / Özelleştir */}
                  {isCurrentlyActive ? (
                    <div className="flex items-center gap-1.5">
                      {(thm.demoCount ?? 0) > 0 ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleImportDemo(thm)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold hover:bg-muted disabled:opacity-50"
                        >
                          <Layers className="h-3 w-3" />
                          <span>Demo veriyi aktar</span>
                        </button>
                      ) : null}
                      <Link
                        href="/admin/themes/customize"
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                      >
                        <Palette className="h-3 w-3" />
                        <span>Özelleştir</span>
                      </Link>
                    </div>
                  ) : thm.isOfficial ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleActivateOfficial(thm)}
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <span>Etkinleştir</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setActivationModalTheme(thm);
                        setModalApplyChrome(Boolean(thm.hasChrome));
                        setModalAddPages(false);
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <span>Etkinleştir</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredThemes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Arama kriterlerine uygun tema bulunamadı.</p>
            <p>Farklı bir arama terimi deneyin veya yeni bir tema paketi yükleyin.</p>
          </div>
        )}
      </div>

      {/* Yüklenen Tema Etkinleştirme Onay Modalı */}
      {activationModalTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                “{activationModalTheme.name}” Temasını Etkinleştir
              </h3>
              <p className="text-xs text-muted-foreground">
                Bu tema paketini sitenizin aktif görünümü olarak ayarlamak üzeresiniz.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalApplyChrome}
                  onChange={(e) => setModalApplyChrome(e.target.checked)}
                  className="mt-0.5 rounded border-border text-blue-600 focus:ring-blue-600"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Temanın Header ve Footer şablonlarını uygula
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Paketteki özel üst ve alt bilgi şablonları sitenize bağlanır.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalAddPages}
                  onChange={(e) => setModalAddPages(e.target.checked)}
                  className="mt-0.5 rounded border-border text-blue-600 focus:ring-blue-600"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Başlangıç sayfalarını taslak olarak içeri aktar
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Temanın sunduğu demo sayfalar taslak olarak eklensin.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setActivationModalTheme(null)}
                className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmActivateUploaded}
                className="h-8 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Etkinleştiriliyor..." : "Onayla ve Etkinleştir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
