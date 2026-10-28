import Link from "next/link";
import { Monitor, Package, Palette, Save, Smartphone, Tablet } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";

/** Üst Başlık & Global Kaydet Çubuğu */
export function ThemeStoreHeader({ s }: { s: ThemeStoreState }) {
  const { isPending, selectedThemeId, previewDevice, setPreviewDevice, handleSaveAll } = s;
  return (
    <>
      {/* Üst Başlık & Global Kaydet Çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50">
              <Palette className="h-4 w-4 text-blue-600" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Tema özelleştirici
            </h1>
            <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
              Aktif: {selectedThemeId}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Renk, yazı tipi, genişlik ve düğme stillerini canlı önizlemeyle yönetin. SEO ayarları SEO sayfasındadır.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/themes/packages" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted">
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
                  aria-label={d.id === "desktop" ? "Masaüstü önizleme" : d.id === "tablet" ? "Tablet önizleme" : "Mobil önizleme"}
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
    </>
  );
}
