/** Tema jetonları için WCAG kontrastı ve güvenli sınırlar (saf mantık). */
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;
export const isHexColor = (v: string): boolean => HEX.test(v.trim());

function rgb(hex: string): [number, number, number] {
  let h = hex.trim().slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x kontrast oranı (1–21). Geçersiz renkte 1 döner. */
export function contrastRatio(a: string, b: string): number {
  if (!isHexColor(a) || !isHexColor(b)) return 1;
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

export const COLOR_KEYS = ["primary", "primaryForeground", "secondary", "secondaryForeground", "accent", "accentForeground", "background", "foreground", "muted", "mutedForeground", "border"] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

/** Metin/zemin çiftleri ve gereken en düşük oran. */
export const CONTRAST_PAIRS: Array<[ColorKey, ColorKey, number]> = [
  ["foreground", "background", 4.5],
  ["primaryForeground", "primary", 4.5],
  ["secondaryForeground", "secondary", 4.5],
  ["accentForeground", "accent", 4.5],
  ["mutedForeground", "muted", 4.5],
  ["mutedForeground", "background", 4.5],
  ["primary", "background", 3],
  ["border", "background", 1.2],
];

export const SAFE_FONT_FAMILIES = ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Helvetica", "Arial", "Noto Sans", "Georgia", "Times New Roman", "Cambria", "ui-serif", "ui-sans-serif", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Courier New", "serif", "sans-serif", "monospace"];
const GENERIC = new Set(["serif", "sans-serif", "monospace", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace"]);

export interface ThemeLintResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  contrast: Array<{ mode: "açık" | "koyu"; pair: string; ratio: number; min: number; pass: boolean }>;
}

const px = (v: unknown): number | null => {
  const m = typeof v === "string" ? /^([0-9.]+)(px|rem)?$/.exec(v.trim()) : null;
  return m ? Number(m[1]) * (m[2] === "rem" ? 16 : 1) : null;
};

/** Jeton nesnesini denetler (renkler `#rrggbb`, kontrast, yazı tipi ve geometri sınırları). Düzeltme yapmaz; raporlar. */
export function lintThemeTokens(input: unknown): ThemeLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contrast: ThemeLintResult["contrast"] = [];
  const t = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const colors = (t.colors ?? {}) as Record<string, unknown>;
  for (const k of COLOR_KEYS) {
    const v = colors[k];
    if (typeof v !== "string" || !isHexColor(v)) errors.push(`colors.${k}: #rrggbb olmalı`);
  }
  const check = (mode: "açık" | "koyu", set: Record<string, unknown>) => {
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      const a = set[fg];
      const b = set[bg];
      if (typeof a !== "string" || typeof b !== "string" || !isHexColor(a) || !isHexColor(b)) continue;
      const ratio = contrastRatio(a, b);
      const pass = ratio >= min;
      contrast.push({ mode, pair: `${fg}/${bg}`, ratio, min, pass });
      if (!pass) errors.push(`${mode} kip kontrastı yetersiz: ${fg} / ${bg} = ${ratio}:1 (en az ${min}:1)`);
    }
  };
  check("açık", colors);
  if (t.darkColors && typeof t.darkColors === "object") check("koyu", { ...colors, ...(t.darkColors as Record<string, unknown>) });
  else warnings.push("koyu kip renkleri (darkColors) tanımlı değil; panel/ziyaretçi koyu kipte açık renkleri kullanır");

  const ty = (t.typography ?? {}) as Record<string, unknown>;
  for (const k of ["headingFont", "bodyFont", "monoFont"]) {
    const stack = typeof ty[k] === "string" ? (ty[k] as string) : "";
    const fams = stack.split(",").map((f) => f.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    if (fams.length === 0) { errors.push(`typography.${k}: boş`); continue; }
    if (fams.length > 6) warnings.push(`typography.${k}: en çok 6 aile`);
    if (!fams.some((f) => GENERIC.has(f))) errors.push(`typography.${k}: yedek olarak genel bir aile (serif, sans-serif, monospace, system-ui) bulunmalı`);
    if (!SAFE_FONT_FAMILIES.some((s) => s.toLowerCase() === fams[0]!.toLowerCase())) warnings.push(`typography.${k}: "${fams[0]}" sistemde olmayabilir; yazı tipi dosyası yüklenmez (0 KB kuralı), yedek aileye düşer`);
  }
  const base = Number(ty.baseSizePx);
  if (!(base >= 15 && base <= 20)) warnings.push("typography.baseSizePx: 15–20 px okunaklılık için önerilir");
  const g = (t.geometry ?? {}) as Record<string, unknown>;
  const r = px(g.borderRadius);
  if (r !== null && r > 32) warnings.push("geometry.borderRadius: 32 px üstü içeriği kırpabilir");
  const cw = px(g.containerMaxWidth);
  if (cw !== null && (cw < 960 || cw > 1440)) warnings.push("geometry.containerMaxWidth: 960–1440 px önerilir");
  const sp = px(g.sectionSpacingY);
  if (sp !== null && (sp < 24 || sp > 160)) warnings.push("geometry.sectionSpacingY: 24–160 px önerilir");
  return { ok: errors.length === 0, errors, warnings, contrast };
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** `hex`i hedef renge (siyah/beyaz) `t` oranında karıştırır; tonu korur, açıklığı değiştirir. */
function mix(hex: string, toward: "black" | "white", t: number): string {
  const [r, g, b] = rgb(hex);
  const target = toward === "black" ? 0 : 255;
  return toHex([r + (target - r) * t, g + (target - g) * t, b + (target - b) * t]);
}

/**
 * `fg`yi `bg` üzerinde en az `min` kontrasta çıkarır. Önce zeminden uzaklaşan yönde (açık zeminde koyulaştır, koyuda aç),
 * olmazsa (ör. orta tonlu zeminde zaten beyaz metin) karşı yönde dener; hiç tutmazsa null.
 */
function fixedForeground(fg: string, bg: string, min: number): string | null {
  const preferred = luminance(bg) > 0.5 ? "black" : "white";
  for (const dir of [preferred, preferred === "black" ? "white" : "black"] as const) {
    for (let i = 1; i <= 40; i++) {
      const c = mix(fg, dir, i / 40);
      if (contrastRatio(c, bg) >= min) return c;
    }
  }
  return null;
}

export interface ContrastFix {
  mode: "açık" | "koyu";
  key: string;
  from: string;
  to: string;
}

/**
 * Kontrast hatasını modele yaptırmak yerine belirleyici biçimde onarır: eşleşmeyen çiftte ön plan rengi, tonu korunarak
 * yeterli oranı verene kadar koyulaştırılır/açılır. Koyu kip düzeltmeleri `darkColors`a yazılır. Geçersiz renklere dokunmaz.
 */
export function autoFixContrast(input: unknown): { tokens: unknown; fixes: ContrastFix[] } {
  const t = input && typeof input === "object" ? (structuredClone(input) as Record<string, any>) : null;
  if (!t || typeof t.colors !== "object" || !t.colors) return { tokens: input, fixes: [] };
  const fixes: ContrastFix[] = [];
  const run = (mode: "açık" | "koyu", get: (k: string) => unknown, set: (k: string, v: string) => void) => {
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      const a = get(fg);
      const b = get(bg);
      if (typeof a !== "string" || typeof b !== "string" || !isHexColor(a) || !isHexColor(b)) continue;
      if (contrastRatio(a, b) >= min) continue;
      const fixed = fixedForeground(a, b, min);
      if (fixed) { fixes.push({ mode, key: fg, from: a, to: fixed }); set(fg, fixed); }
    }
  };
  run("açık", (k) => t.colors[k], (k, v) => (t.colors[k] = v));
  if (t.darkColors && typeof t.darkColors === "object") {
    run("koyu", (k) => t.darkColors[k] ?? t.colors[k], (k, v) => (t.darkColors[k] = v));
  }
  return { tokens: t, fixes };
}
