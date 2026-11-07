import { BLOCK_ANIMATIONS } from "./block-style";
import type { BlockHoverValues, BlockStyle, BlockStyleValues } from "./types";

/**
 * Stil ön ayarları (saf): bir bloğun görsel stilini adlandırıp kaydetme ve başka bloklara uygulama.
 * Ön ayar yalnızca GÖRSEL stili taşır (cihaz kuralları, hover, animasyon); bağlantı çapası, CSS sınıfı, özel CSS ve
 * cihaza göre gizleme bloğa özeldir ve ön ayarla değişmez/kaydedilmez.
 */
export interface StylePreset {
  id: string;
  name: string;
  style: BlockStyle;
}

export const MAX_STYLE_PRESETS = 50;

/** Bloğa özel (ön ayara girmeyen) alanlar */
const BLOCK_SPECIFIC = ["anchorId", "cssClass", "customCss", "hideOn", "fullWidth", "blockWidth"] as const;

const VALUE_KEYS: ReadonlyArray<keyof BlockStyleValues> = [
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "background", "backgroundColor", "backgroundGradient", "backgroundImage", "backgroundOverlay", "textColor", "textAlign", "fontSize",
  "maxWidth", "minHeight", "gap", "borderWidth", "borderColor", "borderRadius", "borderStyle", "boxShadow", "opacity",
  "fontFamily", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textShadow",
  "backgroundSize", "backgroundPosition", "backgroundFixed", "translateY", "scale", "rotate",
];
const HOVER_KEYS: ReadonlyArray<keyof BlockHoverValues> = ["textColor", "backgroundColor", "borderColor", "boxShadow", "opacity", "translateY", "scale"];

const cleanValues = (raw: unknown): BlockStyleValues | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of VALUE_KEYS) {
    const v = o[k];
    if ((typeof v === "string" && v.trim() !== "" && v.length <= 300) || (typeof v === "number" && Number.isFinite(v)) || typeof v === "boolean") out[k] = v;
  }
  return Object.keys(out).length ? (out as BlockStyleValues) : undefined;
};

/** Bir blok stilinden ön ayara girecek görsel kısmı çıkarır (bilinen alanlar, sınırlı uzunluk). */
export function extractPresetStyle(style: BlockStyle | undefined | null): BlockStyle {
  const s = (style ?? {}) as Record<string, unknown>;
  const out: BlockStyle = { ...(cleanValues(s) ?? {}) };
  const tablet = cleanValues(s.tablet);
  const mobile = cleanValues(s.mobile);
  if (tablet) out.tablet = tablet;
  if (mobile) out.mobile = mobile;
  if (s.hover && typeof s.hover === "object") {
    const h: Record<string, unknown> = {};
    for (const k of HOVER_KEYS) {
      const v = (s.hover as Record<string, unknown>)[k];
      if ((typeof v === "string" && v.trim() !== "" && v.length <= 300) || (typeof v === "number" && Number.isFinite(v))) h[k] = v;
    }
    if (Object.keys(h).length) out.hover = h as BlockHoverValues;
  }
  if (typeof s.animation === "string" && (BLOCK_ANIMATIONS as string[]).includes(s.animation)) out.animation = s.animation as BlockStyle["animation"];
  if (typeof s.transitionMs === "number" && Number.isFinite(s.transitionMs)) out.transitionMs = Math.min(3000, Math.max(0, s.transitionMs));
  return out;
}

/** Ön ayarı bloğa uygular: görsel stil ön ayarın kendisi olur, bloğa özel alanlar korunur. */
export function applyStylePreset(current: BlockStyle | undefined, preset: StylePreset): BlockStyle {
  const keep: Record<string, unknown> = {};
  for (const k of BLOCK_SPECIFIC) if ((current as Record<string, unknown> | undefined)?.[k] !== undefined) keep[k] = (current as Record<string, unknown>)[k];
  return { ...structuredClone(extractPresetStyle(preset.style)), ...keep } as BlockStyle;
}

/** Veritabanından/istemciden gelen ön ayar listesini doğrular: kimlik/ad zorunlu, yinelenen kimlik atılır, en çok 50. */
export function sanitizeStylePresets(raw: unknown): StylePreset[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: StylePreset[] = [];
  for (const p of raw) {
    const o = p as { id?: unknown; name?: unknown; style?: unknown };
    if (typeof o?.id !== "string" || !/^[A-Za-z0-9_-]{4,40}$/.test(o.id) || seen.has(o.id)) continue;
    const name = typeof o.name === "string" ? o.name.trim().slice(0, 60) : "";
    if (!name) continue;
    seen.add(o.id);
    out.push({ id: o.id, name, style: extractPresetStyle(o.style as BlockStyle) });
    if (out.length >= MAX_STYLE_PRESETS) break;
  }
  return out;
}
