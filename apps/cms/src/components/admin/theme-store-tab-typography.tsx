import { FONT_CATALOG, primaryFamily, type FontCategory } from "@nexpress/core";
import { GLOBAL_TYPOGRAPHY_PAIRS } from "@nexpress/themes";
import type { ThemeStoreState } from "./use-theme-store";

const GROUP_LABEL: Record<FontCategory, string> = { sans: "Sans serif", serif: "Serif", mono: "Kod (mono)", display: "Başlık" };

/** Başlık / gövde / kod yazı tipi seçimi. Seçilen aile sunucuya indirilir ve kendi alan adımızdan sunulur. */
function FontPicker({ s }: { s: ThemeStoreState }) {
  const { tokens, customizer, setFontFamily, isPending } = s;
  const installed = new Set((customizer.typography.fonts ?? []).map((f: { family: string }) => f.family));
  const rows = [
    ["headingFont", "Başlık yazı tipi", ["sans", "serif"]],
    ["bodyFont", "Gövde yazı tipi", ["sans", "serif"]],
    ["monoFont", "Kod yazı tipi", ["mono"]],
  ] as const;
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Yazı tipi seçimi</div>
      {rows.map(([role, label, groups]) => {
        const current = primaryFamily(tokens.typography[role]);
        return (
          <label key={role} className="block">
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium">
              {label}
              {installed.has(current) ? <span className="font-normal text-emerald-700 dark:text-emerald-400">kendi sunucunuzdan sunuluyor</span> : null}
            </span>
            <select
              aria-label={label}
              value={FONT_CATALOG.some((f) => f.family === current) ? current : ""}
              disabled={isPending}
              onChange={(e) => e.target.value && setFontFamily(role, e.target.value)}
              className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
            >
              <option value="">{current ? `${current} (sistem yedeği)` : "Seçin"}</option>
              {groups.map((g) => (
                <optgroup key={g} label={GROUP_LABEL[g]}>
                  {FONT_CATALOG.filter((f) => f.category === g).map((f) => (
                    <option key={f.family} value={f.family}>{f.family}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        );
      })}
      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
        Dosyalar Google'dan bir kez indirilip sunucunuza kaydedilir; ziyaretçiler üçüncü taraf istek yapmaz (KVKK/GDPR uyumlu, daha hızlı). Kaydet ile yayınlanır.
      </p>
    </div>
  );
}

/** SEKME 3: TİPOGRAFİ ÇİFTLERİ & ÖLÇEK */
export function ThemeStoreTabTypography({ s }: { s: ThemeStoreState }) {
  const { tokens, setTokens, customizer, setCustomizer, activeTab, handleApplyTypographyPair } = s;
  return (
    <>
      {/* SEKME 3: TİPOGRAFİ ÇİFTLERİ & ÖLÇEK */}
      {activeTab === "typography" && (
        <div className="space-y-4">
          <FontPicker s={s} />
          <div className="border-t border-border pt-3">
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
