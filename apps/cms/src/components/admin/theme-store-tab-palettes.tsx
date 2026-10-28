import { GLOBAL_COLOR_PALETTES } from "@nexpress/themes";
import type { ThemeStoreState } from "./use-theme-store";

/** SEKME 2: GLOBAL RENK PALETLERİ & TOKENLAR */
export function ThemeStoreTabPalettes({ s }: { s: ThemeStoreState }) {
  const { tokens, setTokens, customizer, activeTab, handleApplyPalette } = s;
  return (
    <>
      {/* SEKME 2: GLOBAL RENK PALETLERİ & TOKENLAR */}
      {activeTab === "colors" && (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              1-Tıkla Global Renk Paletleri
            </div>
            <div className="space-y-2">
              {GLOBAL_COLOR_PALETTES.map((pal) => {
                const isActive = customizer.activePaletteId === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleApplyPalette(pal.id, pal.colors)}
                    className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-left transition ${
                      isActive
                        ? "border-blue-600 bg-blue-500/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        {pal.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pal.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[
                        pal.colors.primary,
                        pal.colors.secondary,
                        pal.colors.accent,
                        pal.colors.background,
                        pal.colors.muted,
                      ].map((hex, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: hex }}
                          className="h-5 w-5 rounded-full border border-border shadow-2xs"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hassas Renk Tokenları (:root CSS Variables)
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { key: "primary", label: "Birincil Marka (Primary)" },
                  { key: "secondary", label: "İkincil Koyu (Secondary)" },
                  { key: "accent", label: "Vurgu Rengi (Accent)" },
                  { key: "background", label: "Sayfa Arka Planı" },
                  { key: "foreground", label: "Ana Metin Rengi" },
                  { key: "muted", label: "Yüzey / Kart Arka Planı" },
                  { key: "border", label: "Çizgi & Kenarlık" },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-border p-2 space-y-1"
                >
                  <label className="block text-[10px] text-muted-foreground">
                    {item.label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={tokens.colors[item.key]}
                      onChange={(e) =>
                        setTokens((prev) => ({
                          ...prev,
                          colors: {
                            ...prev.colors,
                            [item.key]: e.target.value,
                          },
                        }))
                      }
                      className="h-7 w-8 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tokens.colors[item.key]}
                      onChange={(e) =>
                        setTokens((prev) => ({
                          ...prev,
                          colors: {
                            ...prev.colors,
                            [item.key]: e.target.value,
                          },
                        }))
                      }
                      className="h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
