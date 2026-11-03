import { contrastRatio, isHexColor } from "./ai-design/theme-lint";
import type { DesignTokens } from "./types";

/**
 * Karanlık palet (saf): açık paletten otomatik türetme, kontrast denetimi ve CSS değişkenine çevirme.
 * Ziyaretçi yüzeyi renkleri `var(--nx-*)` ile okur; karanlık mod yalnızca `prefers-color-scheme: dark` altında bu değişkenleri değiştirir (JS yok).
 */
export type PaletteColors = DesignTokens["colors"];

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

const mix = (hex: string, with_: string, t: number): string => {
  const a = parseHex(hex)!;
  const b = parseHex(with_)!;
  return toHex(a.map((v, i) => v + (b[i]! - v) * t));
};

/** `bg` üzerinde en az `min` kontrastı verene kadar rengi beyaza doğru açar. */
function lightenToContrast(color: string, bg: string, min: number): string {
  if (!isHexColor(color)) return color;
  let out = color;
  for (let t = 0.1; contrastRatio(out, bg) < min && t <= 1.0001; t += 0.1) out = mix(color, "#ffffff", t);
  return out;
}

const bestOn = (bg: string) => (contrastRatio("#0b0d12", bg) >= contrastRatio("#ffffff", bg) ? "#0b0d12" : "#ffffff");

/** Açık/koyu fark etmeksizin tutarlı, okunaklı bir karanlık palet üretir; `overrides` verilen alanları ezer. */
export function deriveDarkColors(light: PaletteColors, overrides: Partial<PaletteColors> = {}): PaletteColors {
  const bg = "#0f1115";
  const base: PaletteColors = {
    background: bg,
    foreground: "#e8eaed",
    muted: "#1a1d24",
    mutedForeground: "#a0a6b2",
    border: "#2b303a",
    primary: lightenToContrast(light.primary, bg, 4.5),
    primaryForeground: "",
    secondary: contrastRatio(light.secondary, "#000000") < 3 ? light.secondary : "#1b2030",
    secondaryForeground: "",
    accent: lightenToContrast(light.accent, bg, 4.5),
    accentForeground: "",
  };
  base.primaryForeground = bestOn(base.primary);
  base.secondaryForeground = bestOn(base.secondary);
  base.accentForeground = bestOn(base.accent);
  return { ...base, ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => typeof v === "string" && parseHex(v))) } as PaletteColors;
}

const VAR: Record<keyof PaletteColors, string> = {
  primary: "--nx-primary", primaryForeground: "--nx-primary-fg", secondary: "--nx-secondary", secondaryForeground: "--nx-secondary-fg",
  accent: "--nx-accent", accentForeground: "--nx-accent-fg", background: "--nx-bg", foreground: "--nx-fg",
  muted: "--nx-muted", mutedForeground: "--nx-muted-fg", border: "--nx-border",
};

/** Renkleri `var(--nx-*, <açık değer>)` yapar: blok/şablon kodu `tokens.colors.x` yazmaya devam eder, değer değişkenden okunur. Yedek değer, değişkenlerin tanımsız olduğu yerler (yönetim önizlemesi) içindir. */
export function toCssVarTokens(tokens: DesignTokens): DesignTokens {
  return {
    ...tokens,
    colors: Object.fromEntries(Object.entries(tokens.colors).map(([k, v]) => [k, VAR[k as keyof PaletteColors] ? `var(${VAR[k as keyof PaletteColors]},${v})` : v])) as PaletteColors,
  };
}

/** `prefers-color-scheme: dark` altında değişkenleri karanlık palete çeviren CSS. */
export function darkModeCss(light: PaletteColors, overrides: Partial<PaletteColors> = {}): string {
  const dark = deriveDarkColors(light, overrides);
  const extra = [`--nx-card:${mix(dark.background, "#ffffff", 0.06)}`, `--nx-link:${dark.primary}`];
  const decl = [...(Object.keys(VAR) as Array<keyof PaletteColors>).map((k) => `${VAR[k]}:${dark[k]}`), ...extra].join(";");
  return `:root{color-scheme:light dark}@media (prefers-color-scheme:dark){:root{${decl}}}`;
}
