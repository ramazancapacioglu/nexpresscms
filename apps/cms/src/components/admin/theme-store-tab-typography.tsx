import { GLOBAL_TYPOGRAPHY_PAIRS } from "@nexpress/themes";
import type { ThemeStoreState } from "./use-theme-store";

/** SEKME 3: TİPOGRAFİ ÇİFTLERİ & ÖLÇEK */
export function ThemeStoreTabTypography({ s }: { s: ThemeStoreState }) {
  const { tokens, setTokens, customizer, setCustomizer, activeTab, handleApplyTypographyPair } = s;
  return (
    <>
      {/* SEKME 3: TİPOGRAFİ ÇİFTLERİ & ÖLÇEK */}
      {activeTab === "typography" && (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Hazır Font Çiftleri (Typography Presets)
            </div>
            <div className="space-y-2">
              {GLOBAL_TYPOGRAPHY_PAIRS.map((pair) => (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => handleApplyTypographyPair(pair)}
                  className="w-full rounded-lg border border-border p-2.5 text-left hover:border-blue-500 transition"
                >
                  <div className="font-semibold text-xs">{pair.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Başlık: {pair.headingFont.split(",")[0]} • Gövde:{" "}
                    {pair.bodyFont.split(",")[0]} ({pair.baseSizePx}px)
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-border pt-3">
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Temel Font Boyutu (px)
              </label>
              <input aria-label="Temel Font Boyutu (px)"
                type="number"
                min={14}
                max={20}
                value={tokens.typography.baseSizePx}
                onChange={(e) =>
                  setTokens((prev) => ({
                    ...prev,
                    typography: {
                      ...prev.typography,
                      baseSizePx: Number(e.target.value),
                    },
                  }))
                }
                className="h-8 w-full rounded border border-border bg-background px-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Tipografik Ölçek Oranı
              </label>
              <select aria-label="Tipografik Ölçek Oranı"
                value={String(tokens.typography.scaleRatio)}
                onChange={(e) =>
                  setTokens((prev) => ({
                    ...prev,
                    typography: {
                      ...prev.typography,
                      scaleRatio: Number(e.target.value),
                    },
                  }))
                }
                className="h-8 w-full rounded border border-border bg-background px-2"
              >
                <option value="1.15">1.15 (Kompakt)</option>
                <option value="1.2">1.20 (Minor Third)</option>
                <option value="1.25">1.25 (Major Third)</option>
                <option value="1.33">1.33 (Perfect Fourth)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Başlık Kalınlığı
              </label>
              <select aria-label="Başlık Kalınlığı"
                value={customizer.typography.headingWeight}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    typography: {
                      ...prev.typography,
                      headingWeight: e.target.value as any,
                    },
                  }))
                }
                className="h-8 w-full rounded border border-border bg-background px-2"
              >
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Satır Yüksekliği
              </label>
              <select aria-label="Satır Yüksekliği"
                value={customizer.typography.bodyLineHeight}
                onChange={(e) =>
                  setCustomizer((prev) => ({
                    ...prev,
                    typography: {
                      ...prev.typography,
                      bodyLineHeight: e.target.value,
                    },
                  }))
                }
                className="h-8 w-full rounded border border-border bg-background px-2"
              >
                <option value="1.5">1.5 (Sıkı)</option>
                <option value="1.65">1.65 (İdeal Okuma)</option>
                <option value="1.8">1.8 (Ferah Editoryal)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
