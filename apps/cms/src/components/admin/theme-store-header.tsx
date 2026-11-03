import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Monitor,
  Package,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";

/** Üst Başlık, Gizlenebilir Tema Seçici Çekmecesi & Global Kaydet Çubuğu */
export function ThemeStoreHeader({ s }: { s: ThemeStoreState }) {
  const {
    themes,
    isPending,
    selectedThemeId,
    showThemeSelector,
    setShowThemeSelector,
    hideControlPanel,
    setHideControlPanel,
    previewDevice,
    setPreviewDevice,
    handleSelectTheme,
    handleSaveAll,
  } = s;

  const currentTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="space-y-3">
      {/* Üst Başlık & Global Kaydet Çubuğu */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50">
              <Palette className="h-4 w-4 text-blue-600" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Tema & Görünüm Özelleştirici
            </h1>
            <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
              Aktif Tema: {currentTheme?.name ?? selectedThemeId}
            </span>
            <button
              type="button"
              onClick={() => setShowThemeSelector((v) => !v)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition ${
                showThemeSelector
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-background text-foreground hover:border-blue-500"
              }`}
            >
              {showThemeSelector ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Tema Seçimini Gizle
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Tema Seçimini Göster ({themes.length})
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Renk, yazı tipi, sağ/sol sidebar, header/footer ve şablonları canlı önizlemeyle yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideControlPanel((v) => !v)}
            title={
              hideControlPanel
                ? "Sol özelleştirme panelini göster"
                : "Sol paneli gizleyip önizlemeyi tam ekran yap"
            }
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
              hideControlPanel
                ? "border-blue-600 bg-blue-500/10 text-blue-600"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {hideControlPanel ? (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5" /> Özelleştirme Panelini Göster
              </>
            ) : (
              <>
                <PanelLeftClose className="h-3.5 w-3.5" /> Paneli Gizle (Tam Önizleme)
              </>
            )}
          </button>

          <Link
            href="/admin/themes/packages"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Package className="h-3.5 w-3.5" /> Tema paketleri
          </Link>

          <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
            {(
              [
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ] as const
            ).map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setPreviewDevice(d.id)}
                  aria-label={
                    d.id === "desktop"
                      ? "Masaüstü önizleme"
                      : d.id === "tablet"
                        ? "Tablet önizleme"
                        : "Mobil önizleme"
                  }
                  aria-pressed={previewDevice === d.id}
                  className={`rounded p-1.5 transition ${
                    previewDevice === d.id
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Uygulanıyor..." : "Özelleştirmeleri Yayınla"}
          </button>
        </div>
      </div>

      {/* Gizle / Göster Açılır Tema Seçim Çekmecesi */}
      {showThemeSelector && (
        <div className="rounded-xl border border-blue-500/30 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">
                Hazır Temalar (0-KB RSC — İçerik Verinizi Değiştirmez)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Bir temaya tıkladığınızda renk ve tipografi tokenları canlı önizlemeye yüklenir. Seçtikten sonra bu alanı gizleyebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowThemeSelector(false)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-muted"
            >
              <EyeOff className="h-3 w-3" /> Gizle
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((thm) => {
              const isSelected = selectedThemeId === thm.id;
              return (
                <div
                  key={thm.id}
                  onClick={() => {
                    handleSelectTheme(thm);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 transition space-y-2 ${
                    isSelected
                      ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-600"
                      : "border-border hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate font-bold text-xs text-foreground">
                      {thm.name}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        <Check className="h-2.5 w-2.5" /> Aktif
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                        v{thm.version}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[10px] text-muted-foreground leading-relaxed">
                    {thm.description}
                  </p>
                  <div className="flex items-center gap-1 pt-0.5">
                    {Object.values(thm.tokens.colors)
                      .slice(0, 6)
                      .map((c, idx) => (
                        <span
                          key={idx}
                          style={{ backgroundColor: c }}
                          className="h-3.5 w-3.5 rounded-full border border-border"
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
