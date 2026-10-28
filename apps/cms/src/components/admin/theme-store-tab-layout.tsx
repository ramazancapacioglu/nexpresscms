
import type { ThemeStoreState } from "./use-theme-store";

/** SEKME 4: KAPSAYICI DÜZENİ, BUTONLAR & HEADER/ARŞİV */
export function ThemeStoreTabLayout({ s }: { s: ThemeStoreState }) {
  const { tokens, setTokens, customizer, setCustomizer, activeTab } = s;
  return (
    <>
      {/* SEKME 4: KAPSAYICI DÜZENİ, BUTONLAR & HEADER/ARŞİV */}
      {activeTab === "layout" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Site Maks. Genişlik
              </label>
              <select aria-label="Site Maks. Genişlik"
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
                <option value="1280px">1280px (Standart SaaS)</option>
                <option value="1360px">1360px (Geniş Katalog)</option>
                <option value="1440px">1440px (Tam Ekran Stüdyo)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Köşe Yuvarlaklığı (Radius)
              </label>
              <select aria-label="Köşe Yuvarlaklığı (Radius)"
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

          {/* Buton Stili */}
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
          </div>

          {/* Header & Sayfa Başlığı Davranışı */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Header & Sayfa Başlığı (Hero Bar)
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
              <span>Sayfa Başlığında Breadcrumb Göster</span>
              <input
                type="checkbox"
                checked={customizer.pageTitle.showBreadcrumb}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    pageTitle: {
                      ...prev.pageTitle,
                      showBreadcrumb: e.target.checked,
                    },
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
            <textarea aria-label="Global Özel CSS (Site Geneli)"
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
