import { AI_BLOCK_CATALOG, AI_BLOCK_STYLE_KEYS, type FieldSpec } from "./catalog";
import { contrastRatio, isHexColor } from "./theme-lint";
import type { BlockNode, BlockType } from "../types";

/** AI çıktısının doğrulaması (saf mantık): bilinmeyeni atar, sınırları uygular, SEO/GEO kurallarını denetler. */
export interface DesignContext {
  /** Sitede var olan iç yollar (`/tr/iletisim`); verilirse bilinmeyen iç bağlantı uyarı olur */
  knownPaths?: string[];
  /** Medya kitaplığındaki kimlikler; verilirse başka görsel adresi reddedilir */
  mediaIds?: string[];
  /** Var olan form kimlikleri (`form_block`) */
  formIds?: string[];
}

export interface DesignLintResult {
  ok: boolean;
  blocks: BlockNode[];
  errors: string[];
  warnings: string[];
  /** Sentetik "gerçek veriyle güncelleyin" bayrağı */
  placeholderData: boolean;
  stats: { blocks: number; words: number; headings: number; ctas: number; h1: number };
  /** 0–100: hatalar −25, uyarılar −5 */
  score: number;
}

const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g;
const plain = (v: unknown, max: number): { text: string; clipped: boolean; hadMarkup: boolean } => {
  const raw = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  const stripped = raw.replace(CTRL, "").replace(/<[^>]*>/g, "");
  const text = stripped.replace(/\s+/g, " ").trim();
  return { text: text.slice(0, max), clipped: text.length > max, hadMarkup: stripped !== raw.replace(CTRL, "") };
};

/** Güvenli bağlantı: `/yol`, `#çapa`, http(s), mailto, tel. `//x`, `javascript:`, `data:` reddedilir. */
export function safeHref(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  if (/^\/(?!\/)[^\s]{0,300}$/.test(s) || /^#[\w-]{1,80}$/.test(s)) return s;
  if (/^(https?:\/\/[^\s]{3,300}|mailto:[^\s@]{1,80}@[^\s@]{1,120}|tel:\+?[\d\s()-]{5,24})$/i.test(s)) return s;
  return null;
}

const MEDIA_RE = /^\/media\/(med_[A-Za-z0-9_-]+)(\?[\w=&.%-]*)?$/;

interface Ctx2 {
  issues: { errors: string[]; warnings: string[] };
  ctx: DesignContext;
  placeholder: boolean;
}

function cleanValue(spec: FieldSpec, raw: unknown, path: string, c: Ctx2): unknown {
  const err = (m: string) => c.issues.errors.push(`${path}: ${m}`);
  const warn = (m: string) => c.issues.warnings.push(`${path}: ${m}`);
  switch (spec.kind) {
    case "text": {
      const r = plain(raw, spec.max);
      if (r.hadMarkup) warn("HTML etiketleri atıldı (yalnızca düz metin)");
      if (r.clipped) warn(`${spec.max} karaktere kısaltıldı`);
      if (!r.text && spec.required) err("zorunlu metin boş");
      return r.text;
    }
    case "url": {
      const h = safeHref(raw);
      if (h === null) { err("geçersiz bağlantı (yalnızca /yol, #çapa, http(s), mailto, tel)"); return ""; }
      if (!h && spec.required) err("zorunlu bağlantı boş");
      if (h.startsWith("/") && c.ctx.knownPaths && !MEDIA_RE.test(h) && !c.ctx.knownPaths.includes(h.split(/[?#]/)[0]!)) warn(`sitede bu yol yok: ${h}`);
      return h;
    }
    case "image": {
      const s = typeof raw === "string" ? raw.trim() : "";
      if (!s) { if (spec.required) err("görsel adresi boş"); return ""; }
      const m = MEDIA_RE.exec(s);
      if (!m) { err("görsel yalnızca medya kitaplığından olabilir (/media/med_…)"); return ""; }
      if (c.ctx.mediaIds && !c.ctx.mediaIds.includes(m[1]!)) { err(`medya kitaplığında olmayan görsel: ${m[1]}`); return ""; }
      return s;
    }
    case "enum": {
      const s = typeof raw === "string" ? raw : "";
      if (spec.values.includes(s)) return s;
      if (s || spec.required) warn(`geçersiz seçenek "${s}"; "${spec.values[0]}" kullanıldı`);
      return spec.values[0]!;
    }
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) { warn("sayı değil; en küçük değer kullanıldı"); return spec.min; }
      const clamped = Math.min(spec.max, Math.max(spec.min, Math.round(n)));
      if (clamped !== n) warn(`${spec.min}–${spec.max} aralığına çekildi`);
      return clamped;
    }
    case "boolean": return raw === true;
    case "strings": {
      const arr = Array.isArray(raw) ? raw : [];
      if (arr.length > spec.maxItems) warn(`en çok ${spec.maxItems} öğe; fazlası atıldı`);
      return arr.slice(0, spec.maxItems).map((x) => plain(x, spec.maxLen).text);
    }
    case "matrix": {
      const rows = Array.isArray(raw) ? raw : [];
      if (rows.length > spec.maxRows) warn(`en çok ${spec.maxRows} satır; fazlası atıldı`);
      return rows.slice(0, spec.maxRows).map((r) => (Array.isArray(r) ? r : []).slice(0, spec.maxCols).map((x) => plain(x, spec.maxLen).text));
    }
    case "list": {
      const arr = Array.isArray(raw) ? raw : [];
      if (arr.length < (spec.minItems ?? 0)) err(`en az ${spec.minItems} öğe gerekir (${arr.length} var)`);
      if (arr.length > spec.maxItems) warn(`en çok ${spec.maxItems} öğe; fazlası atıldı`);
      return arr.slice(0, spec.maxItems).map((it, i) => {
        const obj = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
        const out: Record<string, unknown> = {};
        for (const [k, s] of Object.entries(spec.item)) out[k] = cleanValue(s, obj[k], `${path}[${i}].${k}`, c);
        return out;
      });
    }
  }
}

const STYLE_LEN = /^\d{1,3}(\.\d)?(px|rem|em|%)$/;

function cleanStyle(raw: unknown, path: string, c: Ctx2): BlockNode["style"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of AI_BLOCK_STYLE_KEYS) {
    const v = src[k];
    if (v === undefined || v === "") continue;
    if (k === "textAlign") { if (v === "left" || v === "center" || v === "right") out[k] = v; else c.issues.warnings.push(`${path}.${k}: geçersiz değer atıldı`); }
    else if (k === "backgroundColor" || k === "textColor") { if (typeof v === "string" && isHexColor(v)) out[k] = v.toLowerCase(); else c.issues.errors.push(`${path}.${k}: renk #rrggbb olmalı`); }
    else if (typeof v === "string" && STYLE_LEN.test(v)) out[k] = v;
    else c.issues.warnings.push(`${path}.${k}: geçersiz uzunluk atıldı`);
  }
  const unknown = Object.keys(src).filter((k) => !(AI_BLOCK_STYLE_KEYS as readonly string[]).includes(k));
  if (unknown.length) c.issues.warnings.push(`${path}: desteklenmeyen stil alanları atıldı (${unknown.slice(0, 4).join(", ")})`);
  if (typeof out.backgroundColor === "string" && typeof out.textColor === "string" && contrastRatio(out.backgroundColor, out.textColor) < 4.5) c.issues.errors.push(`${path}: metin/arka plan kontrastı 4.5:1'in altında`);
  return Object.keys(out).length ? (out as BlockNode["style"]) : undefined;
}

export type DesignKind = "section" | "page";

/** Düz blok listesini (veya tek blok) temizler ve denetler. Kimlikler yeniden üretilir (`ai_1`…). */
export function lintDesign(input: unknown, kind: DesignKind, ctx: DesignContext = {}): DesignLintResult {
  const issues = { errors: [] as string[], warnings: [] as string[] };
  const raw = Array.isArray(input) ? input : input && typeof input === "object" ? [input] : [];
  const c: Ctx2 = { issues, ctx, placeholder: false };
  const blocks: BlockNode[] = [];
  const counts: Record<string, number> = {};
  let n = 0;

  if (raw.length === 0) issues.errors.push("blok listesi boş");
  raw.slice(0, 40).forEach((r, i) => {
    const obj = r && typeof r === "object" ? (r as Record<string, unknown>) : {};
    const type = typeof obj.type === "string" ? obj.type : "";
    const spec = AI_BLOCK_CATALOG[type];
    const path = `blok ${i + 1} (${type || "?"})`;
    if (!spec) { issues.errors.push(`${path}: bilinmeyen veya AI'a kapalı blok türü`); return; }
    counts[type] = (counts[type] ?? 0) + 1;
    if (spec.maxPerPage && counts[type]! > spec.maxPerPage) { issues.errors.push(`${path}: sayfada en çok ${spec.maxPerPage} adet olabilir`); return; }
    const props = obj.props && typeof obj.props === "object" ? (obj.props as Record<string, unknown>) : {};
    const clean: Record<string, unknown> = {};
    for (const [k, s] of Object.entries(spec.props)) clean[k] = cleanValue(s, props[k], `${path}.${k}`, c);
    const extra = Object.keys(props).filter((k) => !(k in spec.props));
    if (extra.length) issues.warnings.push(`${path}: bilinmeyen alanlar atıldı (${extra.slice(0, 4).join(", ")})`);
    if (type === "form_block" && ctx.formIds && !ctx.formIds.includes(String(clean.formId))) issues.errors.push(`${path}: bu formId sitede yok`);
    if (spec.placeholderData) c.placeholder = true;
    const variant = typeof obj.variant === "string" && spec.variants?.includes(obj.variant) ? obj.variant : spec.variants?.[0];
    const style = cleanStyle(obj.style, path, c);
    const gs = obj.gridSpan && typeof obj.gridSpan === "object" ? (obj.gridSpan as Record<string, unknown>) : {};
    const span = (v: unknown) => Math.min(12, Math.max(1, Math.round(Number(v) || 12)));
    blocks.push({ id: `ai_${++n}`, type: type as BlockType, ...(variant ? { variant } : {}), props: clean, ...(style ? { style } : {}), gridSpan: { desktop: span(gs.desktop), tablet: span(gs.tablet), mobile: span(gs.mobile) } });
  });

  // —— SEO / GEO kuralları ——
  const text = (b: BlockNode) => JSON.stringify(b.props).replace(/[{}\[\]":,]/g, " ");
  const words = blocks.reduce((s, b) => s + text(b).split(/\s+/).filter((w) => w.length > 1).length, 0);
  const headings = blocks.filter((b) => b.type === "heading");
  let prev = 1;
  for (const h of headings) {
    const lvl = Number(h.props.level);
    if (lvl > prev + 1) issues.warnings.push(`başlık düzeyi atlanıyor (h${prev} → h${lvl}): "${String(h.props.text).slice(0, 40)}"`);
    prev = lvl;
  }
  const ctas = blocks.reduce((s, b) => s + (b.type === "hero" ? Number(!!b.props.primaryCtaLabel) + Number(!!b.props.secondaryCtaLabel) : b.type === "cta_banner" ? 1 : b.type === "button_row" ? ((b.props.buttons as unknown[]) ?? []).length : 0), 0);
  const h1 = blocks.filter((b) => b.type === "hero").length;
  if (kind === "page") {
    if (blocks.length < 3) issues.errors.push("sayfa en az 3 blok içermeli");
    if (blocks.length > 14) issues.warnings.push(`${blocks.length} bölüm çok uzun; en çok 14 önerilir`);
    if (h1 === 0) issues.errors.push("sayfada h1 yok: ilk blok bir hero olmalı");
    else if (blocks[0]!.type !== "hero") issues.warnings.push("hero ilk blok olmalı");
    if (!blocks.some((b) => b.type === "tldr_box")) issues.warnings.push("Answer-First için tldr_box eklenmeli");
    else if (h1 && blocks[1]?.type !== "tldr_box") issues.warnings.push("tldr_box hero'dan hemen sonra gelmeli");
    const tl = blocks.find((b) => b.type === "tldr_box");
    const len = String(tl?.props.summary ?? "").length;
    if (tl && (len < 40 || len > 260)) issues.warnings.push(`TL;DR 40–260 karakter olmalı (${len})`);
    if (words < 120) issues.warnings.push(`içerik ince (${words} sözcük); en az ~120 önerilir`);
    if (ctas > 6) issues.warnings.push(`${ctas} çağrı düğmesi var; en çok 6 önerilir`);
    if (ctas === 0) issues.warnings.push("sayfada hiç çağrı (CTA) yok");
    if (!blocks.some((b) => b.type === "faq_accordion") && words > 300) issues.warnings.push("uzun sayfada SSS (FAQPage şeması) önerilir");
  } else if (h1 > 0 && blocks.length === 1) {
    issues.warnings.push("hero sayfaya tek başına eklenirse sayfada ikinci h1 oluşabilir");
  }
  if (c.placeholder) issues.warnings.push("sayı/fiyat içeren bloklar yer tutucu veri taşıyabilir: yayından önce gerçek verilerle güncelleyin");
  const errors = [...new Set(issues.errors)];
  const warnings = [...new Set(issues.warnings)];
  return { ok: errors.length === 0, blocks, errors, warnings, placeholderData: c.placeholder, stats: { blocks: blocks.length, words, headings: headings.length, ctas, h1 }, score: Math.max(0, 100 - errors.length * 25 - warnings.length * 5) };
}
