/**
 * Yazı tipi sistemi (saf mantık). Seçilen Google yazı tipi sunucuya indirilir ve kendi alan adımızdan sunulur
 * (üçüncü taraf istek yok, CSP `font-src 'self'` ile uyumlu, `font-display: swap`). Yalnızca `latin` ve `latin-ext`
 * alt kümeleri tutulur: Türkçe karakterleri kapsar ve dosya küçük kalır. İndirme ve diske yazma `apps/cms/src/lib/fonts.ts`'dedir.
 */

export type FontCategory = "sans" | "serif" | "mono" | "display";

export interface FontCatalogEntry {
  family: string;
  category: FontCategory;
}

/** Kataloğa alınan aileler: hepsi `latin-ext` (Türkçe) destekler. */
export const FONT_CATALOG: readonly FontCatalogEntry[] = [
  { family: "Inter", category: "sans" },
  { family: "Plus Jakarta Sans", category: "sans" },
  { family: "Outfit", category: "sans" },
  { family: "Manrope", category: "sans" },
  { family: "DM Sans", category: "sans" },
  { family: "Poppins", category: "sans" },
  { family: "Montserrat", category: "sans" },
  { family: "Raleway", category: "sans" },
  { family: "Work Sans", category: "sans" },
  { family: "Figtree", category: "sans" },
  { family: "Sora", category: "sans" },
  { family: "Space Grotesk", category: "sans" },
  { family: "Open Sans", category: "sans" },
  { family: "Roboto", category: "sans" },
  { family: "Lato", category: "sans" },
  { family: "Source Sans 3", category: "sans" },
  { family: "IBM Plex Sans", category: "sans" },
  { family: "Nunito Sans", category: "sans" },
  { family: "Newsreader", category: "serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Source Serif 4", category: "serif" },
  { family: "JetBrains Mono", category: "mono" },
  { family: "IBM Plex Mono", category: "mono" },
];

export const FONT_WEIGHTS = [400, 500, 600, 700, 800] as const;
const KEPT_SUBSETS = new Set(["latin", "latin-ext"]);

export const catalogEntry = (family: string): FontCatalogEntry | undefined => FONT_CATALOG.find((f) => f.family === family);

const FALLBACK: Record<FontCategory, string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  display: "system-ui, sans-serif",
};

/** CSS `font-family` değeri: `"Inter", system-ui, …`. Katalog dışı ad yazılmaz (enjeksiyon yok). */
export function fontStack(family: string): string | null {
  const entry = catalogEntry(family);
  return entry ? `"${entry.family}", ${FALLBACK[entry.category]}` : null;
}

/** Bir `font-family` değerinden ilk ailenin adı (`"Inter", sans-serif` → `Inter`). */
export function primaryFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

export interface InstalledFontFace {
  /** `400` ya da değişken aralık (`100 900`). */
  weight: string;
  subset: "latin" | "latin-ext";
  /** Kiracı yazı tipi klasöründeki dosya adı. */
  file: string;
  unicodeRange: string;
}

export interface InstalledFont {
  family: string;
  faces: InstalledFontFace[];
}

const FILE_RE = /^[a-z0-9-]{1,60}-[0-9a-f]{8}\.woff2$/;
export const isFontFileName = (name: string): boolean => FILE_RE.test(name);

/** Dosya adı: `inter-3fa91c20.woff2` (adres özetinden; aynı dosya iki kez yazılmaz). */
export function fontFileName(family: string, hash8: string): string {
  return `${family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${hash8}.woff2`;
}

export interface ParsedFace {
  weight: string;
  style: string;
  subset: string;
  url: string;
  unicodeRange: string;
}

/** Google Fonts CSS çıktısını çözer (`/* altküme *\/` yorumlu `@font-face` blokları). */
export function parseGoogleFontCss(css: string): ParsedFace[] {
  const out: ParsedFace[] = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/gi;
  for (const m of css.matchAll(re)) {
    const body = m[2] ?? "";
    const url = /src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/i.exec(body)?.[1]?.replace(/['"]/g, "").trim();
    const weight = /font-weight:\s*([0-9 ]+);/i.exec(body)?.[1]?.trim();
    const style = /font-style:\s*([a-z]+);/i.exec(body)?.[1]?.trim() ?? "normal";
    const unicodeRange = /unicode-range:\s*([^;]+);/i.exec(body)?.[1]?.trim() ?? "";
    if (!url || !weight) continue;
    out.push({ weight, style, subset: (m[1] ?? "").toLowerCase(), url, unicodeRange });
  }
  return out;
}

/** İndirilecek yüzler: yalnızca normal stil ve Türkçeyi kapsayan alt kümeler. */
export const keepFaces = (faces: ParsedFace[]): ParsedFace[] => faces.filter((f) => f.style === "normal" && KEPT_SUBSETS.has(f.subset));

/** Kayıtlı yazı tiplerini temizler: katalog dışı aile, geçersiz dosya adı ve bozuk alan atılır; en çok 6 aile. */
export function sanitizeInstalledFonts(value: unknown): InstalledFont[] {
  if (!Array.isArray(value)) return [];
  const out: InstalledFont[] = [];
  for (const raw of value.slice(0, 6)) {
    if (!raw || typeof raw !== "object") continue;
    const family = String((raw as { family?: unknown }).family ?? "");
    if (!catalogEntry(family) || out.some((f) => f.family === family)) continue;
    const faces: InstalledFontFace[] = [];
    for (const f of Array.isArray((raw as { faces?: unknown }).faces) ? ((raw as { faces: unknown[] }).faces) : []) {
      const face = f as Partial<InstalledFontFace>;
      const weight = String(face.weight ?? "");
      if (!/^\d{3}( \d{3})?$/.test(weight) || (face.subset !== "latin" && face.subset !== "latin-ext")) continue;
      if (!isFontFileName(String(face.file ?? ""))) continue;
      const range = String(face.unicodeRange ?? "");
      if (!/^[U+0-9A-Fa-f?,\s-]*$/.test(range)) continue;
      faces.push({ weight, subset: face.subset, file: String(face.file), unicodeRange: range });
    }
    if (faces.length) out.push({ family, faces });
  }
  return out;
}

/** `@font-face` kuralları. Adresler `/api/fonts/{dosya}` olur; `font-display: swap` metni gizlemez. */
export function buildFontFaceCss(fonts: readonly InstalledFont[], base = "/api/fonts"): string {
  const rules: string[] = [];
  for (const font of sanitizeInstalledFonts(fonts)) {
    for (const f of font.faces) {
      rules.push(
        `@font-face{font-family:"${font.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(${base}/${f.file}) format("woff2");${f.unicodeRange ? `unicode-range:${f.unicodeRange};` : ""}}`
      );
    }
  }
  return rules.join("\n");
}

/** İlk boyamada gereken tek dosya: gövde yazı tipinin normal ağırlıklı `latin` yüzü (preload). */
export function preloadFile(fonts: readonly InstalledFont[], family: string): string | null {
  const font = sanitizeInstalledFonts(fonts).find((f) => f.family === family);
  const face = font?.faces.find((f) => f.subset === "latin" && (f.weight === "400" || f.weight.startsWith("100"))) ?? font?.faces.find((f) => f.subset === "latin");
  return face?.file ?? null;
}
