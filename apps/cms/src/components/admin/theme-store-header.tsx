import {
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Smartphone,
  Tablet,
} from "lucide-react";
import { AdminPageHeader } from "./admin-page-header";
import type { ThemeStoreState } from "./use-theme-store";

/** Özelleştirici üst başlığı: aktif tema rozeti, cihaz önizleme anahtarı, tam ekran ve kaydet düğmesi. */
export function ThemeStoreHeader({ s }: { s: ThemeStoreState }) {
  const {
    themes,
    isPending,
    selectedThemeId,
    hideControlPanel,
    setHideControlPanel,
    previewDevice,
    setPreviewDevice,
    handleSaveAll,
  } = s;

  const currentTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <AdminPageHeader
      title="Tema Özelleştirici"
      description="Aktif temanın renk paleti, tipografisi, sayfa genişliği, kenar çubuğu, logo ölçüsü ve özel CSS/script kodları."
      badge={
        <span className="rounded-md border border-[#266DF0]/25 bg-[#266DF0]/10 px-2 py-0.5 text-[11px] font-medium text-[#1D5ED8] dark:text-[#7AA7FF]">
          Aktif Tema: {currentTheme?.name ?? selectedThemeId}
        </span>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => setHideControlPanel((v) => !v)}
            title={
              hideControlPanel
                ? "Sol özelleştirme panelini göster"
                : "Sol paneli gizleyip önizlemeyi tam ekran yap"
            }
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition ${
              hideControlPanel
                ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]"
                : "border-[#E6E7EA] bg-white text-[#14151A] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#F3F4F6]"
            }`}
          >
            {hideControlPanel ? (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5" /> Paneli Göster
              </>
            ) : (
              <>
                <PanelLeftClose className="h-3.5 w-3.5" /> Tam Önizleme
              </>
            )}
          </button>

          <div className="inline-flex items-center rounded-md border border-[#E6E7EA] bg-white p-0.5 dark:border-[#23262E] dark:bg-[#15171C]">
            {(
              [
                { id: "desktop", icon: Monitor, label: "Masaüstü önizleme" },
                { id: "tablet", icon: Tablet, label: "Tablet önizleme" },
                { id: "mobile", icon: Smartphone, label: "Mobil önizleme" },
              ] as const
            ).map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setPreviewDevice(d.id)}
                  aria-label={d.label}
                  aria-pressed={previewDevice === d.id}
                  className={`rounded p-1.5 transition ${
                    previewDevice === d.id
                      ? "bg-[#266DF0] text-white"
                      : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3.5 text-[12px] font-semibold text-white hover:bg-[#1D5ED8] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Kaydediliyor..." : "Özelleştirmeleri Yayınla"}
          </button>
        </>
      }
    />
  );
}
