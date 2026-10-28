import postcss, { type AtRule, type Declaration, type Rule } from "postcss";

/**
 * Tema CSS'i temizleyici ve kapsamlayıcı (saf mantık).
 * Her seçici `[data-nx-skin="<id>"]` altına alınır; böylece tema yalnızca kendi kapsamını boyar.
 * Güvenlik: @import, expression(), behavior, -moz-binding, javascript: ve dış url() reddedilir.
 */
export const MAX_CSS_BYTES = 200 * 1024;
const MAX_RULES = 3000;
const ALLOWED_AT_RULES = new Set(["media", "supports", "keyframes", "-webkit-keyframes", "charset"]);
const RASTER_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;

export interface CssResult {
  ok: boolean;
  css: string;
  errors: string[];
  warnings: string[];
}

/** Virgülle ayrılmış seçicileri, parantez/köşeli parantez/tırnak içindeki virgülleri bölmeden ayırır. */
export function splitSelectors(selector: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let cur = "";
  for (const ch of selector) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** `:root`, `html`, `body` kapsamın kendisine eşlenir; diğerleri kapsamın altına (torun) alınır. */
export function scopeSelector(selector: string, scope: string): string {
  const s = selector.trim();
  const m = s.match(/^(:root|html|body)(?![\w-])(.*)$/i);
  if (m) return `${scope}${m[2]}`;
  return `${scope} ${s}`;
}

function badDeclaration(d: Declaration): string | null {
  const value = d.value;
  const lower = `${d.prop}:${value}`.toLowerCase();
  if (/expression\s*\(/.test(lower)) return "expression() yasak";
  if (/behavior\s*:/.test(lower) || /-moz-binding/.test(lower)) return "behavior/-moz-binding yasak";
  if (/javascript\s*:/.test(lower) || /vbscript\s*:/.test(lower)) return "javascript: yasak";
  for (const m of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    if (!RASTER_DATA_URL.test(m[2]!.trim())) return `url() yalnızca data:image (png/jpg/webp/gif) olabilir: ${m[2]!.slice(0, 40)}`;
  }
  if (/@import/i.test(value)) return "@import yasak";
  return null;
}

export function sanitizeThemeCss(input: string, themeId: string): CssResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (Buffer.byteLength(input, "utf8") > MAX_CSS_BYTES) {
    return { ok: false, css: "", errors: [`CSS ${Math.round(MAX_CSS_BYTES / 1024)} KB sınırını aşıyor.`], warnings };
  }
  if (!input.trim()) return { ok: true, css: "", errors, warnings };
  let root;
  try {
    root = postcss.parse(input);
  } catch (e) {
    const err = e as { reason?: string; line?: number };
    return { ok: false, css: "", errors: [`CSS ayrıştırılamadı (satır ${err.line ?? "?"}): ${err.reason ?? "hata"}`], warnings };
  }
  const scope = `[data-nx-skin="${themeId}"]`;
  let rules = 0;

  root.walkAtRules((at: AtRule) => {
    const name = at.name.toLowerCase();
    if (!ALLOWED_AT_RULES.has(name)) {
      errors.push(`@${at.name} kuralı yasak (satır ${at.source?.start?.line ?? "?"}).`);
      at.remove();
    }
  });
  root.walkDecls((d: Declaration) => {
    const problem = badDeclaration(d);
    if (problem) {
      errors.push(`${d.prop}: ${problem} (satır ${d.source?.start?.line ?? "?"}).`);
      d.remove();
    }
  });
  root.walkRules((rule: Rule) => {
    // @keyframes içindeki "from/to/50%" seçicileri kapsamlanmaz
    const parent = rule.parent;
    if (parent && parent.type === "atrule" && /keyframes$/i.test((parent as AtRule).name)) return;
    rules++;
    if (rules > MAX_RULES) return;
    rule.selector = splitSelectors(rule.selector).map((s) => scopeSelector(s, scope)).join(", ");
  });
  if (rules > MAX_RULES) errors.push(`En çok ${MAX_RULES} kural olabilir.`);
  if (errors.length === 0 && rules === 0) warnings.push("CSS içinde kural bulunamadı.");
  return { ok: errors.length === 0, css: errors.length === 0 ? root.toString() : "", errors, warnings };
}
