import { AI_BLOCK_CATALOG, type FieldSpec } from "./ai-design/catalog";

/**
 * Şema tabanlı blok alanları (saf): editörün denetçisi her bloğu bu tanımlardan çizer. Kaynak sırası:
 * 1) AI tasarım kataloğundaki alan sözleşmesi (etiket, sınır, tür), 2) bloğun mevcut değerlerinden çıkarım.
 * Böylece kütüphaneden gelen HER blok (katalogda olsun olmasın) düzenlenebilir; yeni blok türü eklemek ek arayüz kodu gerektirmez.
 */
export type EditorFieldKind = "text" | "textarea" | "url" | "image" | "enum" | "number" | "boolean" | "color" | "list" | "strings" | "matrix" | "group";

export interface EditorField {
  key: string;
  label: string;
  kind: EditorFieldKind;
  required?: boolean;
  max?: number;
  min?: number;
  options?: string[];
  maxItems?: number;
  maxRows?: number;
  maxCols?: number;
  /** list/group: öğe alanları */
  fields?: EditorField[];
}

/** Düzenleyicide gösterilmeyen iç alanlar (metin editörü, ölçü, yerleşim). */
const HIDDEN = new Set(["html", "width", "height", "gridSpan", "id", "type", "children", "aspectRatio", "variant"]);

const LABELS: Record<string, string> = {
  title: "Başlık", text: "Metin", subtitle: "Alt başlık", summary: "Özet", body: "İçerik", kicker: "Üst etiket", label: "Etiket", badge: "Rozet",
  description: "Açıklama", href: "Bağlantı", url: "Adres", image: "Görsel", alt: "Alt metin", name: "Ad", price: "Fiyat", value: "Değer", mark: "İşaret",
  question: "Soru", answer: "Yanıt", steps: "Adımlar", items: "Öğeler", plans: "Planlar", stats: "Sayılar", buttons: "Düğmeler", headers: "Sütun başlıkları",
  rows: "Satırlar", tone: "Tür", align: "Hizalama", featured: "Öne çıkan", ctaLabel: "Düğme metni", ctaHref: "Düğme bağlantısı", buttonLabel: "Düğme metni",
  buttonHref: "Düğme bağlantısı", primaryCtaLabel: "Ana düğme metni", primaryCtaHref: "Ana düğme bağlantısı", secondaryCtaLabel: "İkinci düğme metni",
  secondaryCtaHref: "İkinci düğme bağlantısı", linkLabel: "Bağlantı yazısı", caption: "Alt yazı", titleText: "Başlık (title)", altText: "Alt metin", author: "Yazar",
  role: "Görev", company: "Şirket", quote: "Alıntı", rating: "Puan", date: "Tarih", language: "Dil", code: "Kod", level: "Düzey", features: "Özellikler",
  plan: "Plan", period: "Dönem", currency: "Para birimi", highlight: "Vurgu", icon: "Simge", logo: "Logo", color: "Renk", backgroundColor: "Arka plan rengi",
  columns: "Sütun", limit: "Adet", heading: "Başlık", emptyText: "Boş durum notu",
};

const prettify = (key: string) => LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toLocaleUpperCase("tr"));

const URL_KEY = /(^|[a-z])(href|url|link)$|^(href|url|link)/i;
const IMAGE_KEY = /(^|[a-z])(image|img|src|poster|photo|avatar|logo|thumbnail)$|^(image|img|src|photo|avatar|logo|thumbnail)/i;
const COLOR_KEY = /color$|^color/i;
const LONG_KEYS = new Set(["text", "body", "summary", "description", "answer", "subtitle", "quote", "content", "intro", "verdict"]);

function fromSpec(key: string, spec: FieldSpec): EditorField {
  const base = { key, label: prettify(key) };
  switch (spec.kind) {
    case "text":
      return { ...base, kind: spec.max > 100 || LONG_KEYS.has(key) ? "textarea" : "text", max: spec.max, required: spec.required };
    case "url":
      return { ...base, kind: "url", required: spec.required };
    case "image":
      return { ...base, kind: "image", required: spec.required };
    case "enum":
      return { ...base, kind: "enum", options: [...spec.values], required: spec.required };
    case "number":
      return { ...base, kind: "number", min: spec.min, max: spec.max };
    case "boolean":
      return { ...base, kind: "boolean" };
    case "strings":
      return { ...base, kind: "strings", maxItems: spec.maxItems, max: spec.maxLen };
    case "matrix":
      return { ...base, kind: "matrix", maxRows: spec.maxRows, maxCols: spec.maxCols, max: spec.maxLen };
    case "list":
      return { ...base, kind: "list", maxItems: spec.maxItems, fields: Object.entries(spec.item).map(([k, s]) => fromSpec(k, s)) };
  }
}

/** Mevcut bir değerden alan türü çıkarır (katalogda olmayan veya sözleşme dışı alanlar için). */
export function inferField(key: string, value: unknown): EditorField | null {
  if (HIDDEN.has(key)) return null;
  const base = { key, label: prettify(key) };
  if (typeof value === "boolean") return { ...base, kind: "boolean" };
  if (typeof value === "number") return { ...base, kind: "number" };
  if (typeof value === "string") {
    if (/^#[0-9a-f]{3,8}$/i.test(value) && (COLOR_KEY.test(key) || value.length <= 9)) return { ...base, kind: "color" };
    if (IMAGE_KEY.test(key)) return { ...base, kind: "image" };
    if (URL_KEY.test(key)) return { ...base, kind: "url" };
    return { ...base, kind: value.length > 100 || LONG_KEYS.has(key) || value.includes("\n") ? "textarea" : "text" };
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) return { ...base, kind: "strings" };
    if (value.every((v) => Array.isArray(v) && v.every((c) => typeof c === "string"))) return { ...base, kind: "matrix" };
    const objs = value.filter((v): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v));
    if (objs.length > 0) {
      const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))];
      const fields = keys.map((k) => inferField(k, objs.find((o) => k in o)![k])).filter((f): f is EditorField => f !== null);
      return { ...base, kind: "list", fields };
    }
    return { ...base, kind: "list", fields: [{ key: "text", label: "Metin", kind: "text" }] };
  }
  if (value && typeof value === "object") {
    const fields = Object.entries(value as Record<string, unknown>).map(([k, v]) => inferField(k, v)).filter((f): f is EditorField => f !== null);
    return fields.length ? { ...base, kind: "group", fields } : null;
  }
  return null;
}

/** Bloğun düzenlenebilir alanları: katalog sözleşmesi + (katalogda olmayan) mevcut değerlerden çıkarılanlar. */
export function buildEditorFields(type: string, props: Record<string, unknown> | null | undefined): EditorField[] {
  const p = props ?? {};
  const spec = AI_BLOCK_CATALOG[type]?.props ?? {};
  const out: EditorField[] = Object.entries(spec).filter(([k]) => !HIDDEN.has(k)).map(([k, s]) => fromSpec(k, s));
  const have = new Set(out.map((f) => f.key));
  for (const [k, v] of Object.entries(p)) {
    if (have.has(k)) continue;
    const f = inferField(k, v);
    if (f) out.push(f);
  }
  return out;
}

/** Yeni liste öğesi: alan türlerine göre boş değerler. */
export function emptyItem(fields: EditorField[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const f of fields) {
    o[f.key] = f.kind === "boolean" ? false : f.kind === "number" ? 0 : f.kind === "list" || f.kind === "matrix" || f.kind === "strings" ? [] : f.kind === "group" ? emptyItem(f.fields ?? []) : f.kind === "enum" ? (f.options?.[0] ?? "") : "";
  }
  return o;
}

export type Path = Array<string | number>;

export function getPath(root: unknown, path: Path): unknown {
  let cur = root;
  for (const k of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

/** Değişmez güncelleme: yoldaki değeri değiştirip yeni kök döner. */
export function setPath<T>(root: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const clone: unknown = Array.isArray(root) ? [...root] : { ...((root as object) ?? {}) };
  (clone as Record<string | number, unknown>)[head!] = setPath(((root as Record<string | number, unknown>) ?? {})[head!], rest, value);
  return clone as T;
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row!);
  return next;
}
