/**
 * Özel içerik türleri ve özel alanlar (saf mantık). Yönetici `general.contentTypes` altında tür tanımlar (ör. "Referans",
 * "Etkinlik", "Ekip üyesi"); her türün alanları vardır. İçerik normal `contents` satırıdır (`type` = tür kimliği, blok
 * ağacı ve SEO alanları aynıdır); alan değerleri `schemaAttributes._fields` altında durur. Veritabanı göçü gerekmez.
 *
 * Güvenlik: tür ve alan kimlikleri sabit bir düzenle sınırlıdır, değerler kayıtta tanıma göre temizlenir
 * (`sanitizeFieldValues`), bilinmeyen alan ve fazla uzun değer atılır.
 */
import { termSlug } from "./dynamic-content";
import type { BuiltInContentType } from "./types";

export const FIELD_KINDS = ["text", "textarea", "number", "boolean", "select", "date", "url", "email", "image"] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export const FIELD_KIND_LABEL: Record<FieldKind, string> = {
  text: "Kısa metin",
  textarea: "Uzun metin",
  number: "Sayı",
  boolean: "Evet / Hayır",
  select: "Seçenek listesi",
  date: "Tarih",
  url: "Bağlantı",
  email: "E-posta",
  image: "Görsel",
};

export interface CustomFieldDef {
  /** `a-z`, rakam ve alt çizgi; harfle başlar. Değer anahtarıdır, sonradan değiştirilmez. */
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Yalnızca `select`: seçenekler (en çok 20). */
  options?: string[];
  help?: string;
  /** Ziyaretçi alan tablosunda gösterilsin mi (varsayılan evet). */
  show?: boolean;
  /** Schema.org özelliği (ör. `startDate`, `telephone`, `price`): değer sayfanın JSON-LD varlığına yazılır. */
  schemaProp?: string;
}

export interface CustomContentType {
  /** `a-z`, rakam ve alt çizgi; harfle başlar; yerleşik tür adı olamaz. */
  id: string;
  label: string;
  labelPlural: string;
  /** Varsayılan Schema.org türü (içerikte değiştirilebilir). */
  schemaType: string;
  /** Site haritasına girsin mi. */
  inSitemap: boolean;
  /** Tür için herkese açık liste sayfası (`/{archiveSlug}`) olsun mu. Eski kayıtlarda yoktur (kapalı). */
  archive?: boolean;
  /** Arşiv adresi (`a-z`, rakam, tire). Boşsa çoğul addan türetilir; kayıtta çözülmüş hali yazılır. */
  archiveSlug?: string;
  /** Arşiv sayfasının başlık altı kısa tanıtımı (en çok 300 karakter). */
  archiveIntro?: string;
  /** Bu türü ekleyen veri eklentisinin kimliği (`data_plugins`); yalnızca sunucu yazar. Eklenti kapanınca tür kaldırılır. */
  plugin?: string;
  /** Kayıt adresleri `/{arşiv-adresi}/{kayıt}` olur (`/{kayıt}` kalıcı yönlendirir). Yalnızca arşiv açıkken. */
  prefixed?: boolean;
  fields: CustomFieldDef[];
}

export const BUILT_IN_TYPE_IDS: readonly BuiltInContentType[] = ["template", "page", "post", "kb_tech", "ai_prompt", "product", "campaign"];

const ID_RE = /^[a-z][a-z0-9_]{1,31}$/;
const SCHEMA_PROP_RE = /^[a-z][A-Za-z]{1,40}$/;
/** JSON-LD varlığının temel alanları: bir özel alan bunları ezemez. */
export const PROTECTED_SCHEMA_PROPS: readonly string[] = ["context", "type", "id", "name", "headline", "description", "url", "inLanguage", "isPartOf", "publisher", "author", "datePublished", "dateModified", "mainEntityOfPage", "image", "aggregateRating", "sameAs"];
const KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;
const SCHEMA_TYPE_RE = /^[A-Z][A-Za-z0-9]{1,40}$/;
export const MAX_CONTENT_TYPES = 12;
export const MAX_FIELDS_PER_TYPE = 30;
/** Metin alanlarının en çok uzunluğu (kısa metin 200, uzun metin 5000). */
const MAX_TEXT = 200;
const MAX_LONG = 5000;

/** Arşiv adresi olamayan adlar: yerleşik rotalar, yönetim ve sistem uç noktaları. */
export const RESERVED_ARCHIVE_SLUGS: readonly string[] = [
  "kategori", "etiket", "magaza", "ara", "yazar", "kampanya", "kampanyalar", "sepet", "odeme", "hesap",
  "admin", "api", "login", "og", "sitemap", "sitemaps", "llms", "llms-full", "robots", "feed", "ai-sitemap", "blog",
];
const ARCHIVE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// En az 3 karakter: 2 harfli adresler dil kodu (`/hr/…`) ile karışır
const isUsableArchiveSlug = (slug: string): boolean => slug.length >= 3 && slug.length <= 40 && ARCHIVE_SLUG_RE.test(slug) && !RESERVED_ARCHIVE_SLUGS.includes(slug);

const clean = (value: unknown, max: number): string => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

export const isValidTypeId = (id: string): boolean => ID_RE.test(id) && !(BUILT_IN_TYPE_IDS as readonly string[]).includes(id);
export const isValidFieldKey = (key: string): boolean => KEY_RE.test(key);

function sanitizeField(raw: unknown): CustomFieldDef | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const key = typeof r.key === "string" ? r.key.trim() : "";
  const kind = FIELD_KINDS.find((k) => k === r.kind);
  const label = clean(r.label, 60);
  if (!isValidFieldKey(key) || !kind || !label) return null;
  const options = kind === "select" ? [...new Set((Array.isArray(r.options) ? r.options : []).map((o) => clean(o, 60)).filter(Boolean))].slice(0, 20) : undefined;
  if (kind === "select" && (!options || options.length === 0)) return null;
  return {
    key,
    label,
    kind,
    ...(r.required === true ? { required: true } : {}),
    ...(options ? { options } : {}),
    ...(clean(r.help, 160) ? { help: clean(r.help, 160) } : {}),
    ...(r.show === false ? { show: false } : {}),
    ...(typeof r.schemaProp === "string" && SCHEMA_PROP_RE.test(r.schemaProp.trim()) && !PROTECTED_SCHEMA_PROPS.includes(r.schemaProp.trim()) ? { schemaProp: r.schemaProp.trim() } : {}),
  };
}

/** Tür tanımlarını temizler: geçersiz tür/alan atılır, tekrarlar elenir, sınırlar uygulanır. */
export function sanitizeContentTypes(value: unknown): CustomContentType[] {
  if (!Array.isArray(value)) return [];
  const out: CustomContentType[] = [];
  for (const raw of value.slice(0, MAX_CONTENT_TYPES)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const label = clean(r.label, 40);
    if (!isValidTypeId(id) || !label || out.some((t) => t.id === id)) continue;
    const seen = new Set<string>();
    const fields: CustomFieldDef[] = [];
    for (const f of (Array.isArray(r.fields) ? r.fields : []).slice(0, MAX_FIELDS_PER_TYPE)) {
      const field = sanitizeField(f);
      if (!field || seen.has(field.key)) continue;
      seen.add(field.key);
      fields.push(field);
    }
    // Arşiv: açık adres ya da çoğul addan türetilen adres; sistem rotası/başka tür ile çakışırsa arşiv kapalı kalır
    let archive = r.archive === true;
    let archiveSlug: string | undefined;
    if (archive) {
      const wanted = typeof r.archiveSlug === "string" ? termSlug(r.archiveSlug.trim()).slice(0, 40) : "";
      const candidates = [wanted, termSlug(clean(r.labelPlural, 40) || label).slice(0, 40)];
      archiveSlug = candidates.find((c) => isUsableArchiveSlug(c) && !out.some((t) => t.archiveSlug === c));
      if (!archiveSlug) archive = false;
    }
    const schemaType = typeof r.schemaType === "string" && SCHEMA_TYPE_RE.test(r.schemaType.trim()) ? r.schemaType.trim() : "WebPage";
    out.push({ id, label, labelPlural: clean(r.labelPlural, 40) || label, schemaType, inSitemap: r.inSitemap !== false, ...(typeof r.plugin === "string" && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(r.plugin) && r.plugin.length <= 40 ? { plugin: r.plugin } : {}), ...(archive ? { archive: true, archiveSlug, ...(clean(r.archiveIntro, 300) ? { archiveIntro: clean(r.archiveIntro, 300) } : {}), ...(r.prefixed === true ? { prefixed: true } : {}) } : {}), fields });
  }
  return out;
}

export const findContentType = (types: readonly CustomContentType[] | undefined, id: string | undefined | null): CustomContentType | undefined =>
  id ? types?.find((t) => t.id === id) : undefined;

/** Kayıtları `/{önek}/{slug}` altında yayınlanan türün öneki (arşiv adresi); yoksa `null` (`/{slug}`). */
export const contentPrefix = (types: readonly CustomContentType[] | undefined, typeId: string | undefined | null): string | null => {
  const def = findContentType(types, typeId);
  return def?.archive === true && def.prefixed === true && def.archiveSlug ? def.archiveSlug : null;
};

/** Bir kaydın dile göre öneksiz yolu: `/{önek}/{slug}` ya da `/{slug}`. Tek doğru adres (kanonik) buradan üretilir. */
export const contentPath = (types: readonly CustomContentType[] | undefined, content: { type: string; slug: string }): string => {
  const prefix = contentPrefix(types, content.type);
  return prefix ? `/${prefix}/${content.slug}` : `/${content.slug}`;
};

/** Arşiv adresine karşılık gelen tür (arşivi açık olanlar arasından). */
export const findTypeByArchiveSlug = (types: readonly CustomContentType[] | undefined, slug: string): CustomContentType | undefined =>
  types?.find((t) => t.archive === true && t.archiveSlug === slug);

/** Arşivi istenip çakışma yüzünden kapanan türlerin adları (kayıtta yöneticiye bildirilir). */
export function droppedArchives(requested: unknown, sanitized: readonly CustomContentType[]): string[] {
  if (!Array.isArray(requested)) return [];
  const out: string[] = [];
  for (const raw of requested) {
    const r = raw as { id?: unknown; label?: unknown; archive?: unknown } | null;
    if (!r || r.archive !== true || typeof r.id !== "string") continue;
    const kept = sanitized.find((t) => t.id === r.id);
    if (kept && !kept.archive) out.push(kept.label);
  }
  return out;
}

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Bir bağlantı değeri yalnızca site içi yol ya da http(s) olabilir (`javascript:` vb. yok). */
function safeUrl(value: string): string {
  if (/^\/(?!\/)/.test(value)) return value.slice(0, 500);
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href.slice(0, 500) : "";
  } catch {
    return "";
  }
}

export interface FieldValidation {
  values: FieldValues;
  /** Alan anahtarı → hata iletisi. Boşsa değerler kaydedilebilir. */
  errors: Record<string, string>;
}

/**
 * Gelen değerleri türün tanımına göre temizler ve doğrular. Tanımda olmayan alan atılır; boş değer yazılmaz;
 * zorunlu alan boşsa hata döner. Yazıma hazır `values` her durumda güvenlidir.
 */
export function sanitizeFieldValues(type: CustomContentType, input: unknown): FieldValidation {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const values: FieldValues = {};
  const errors: Record<string, string> = {};
  for (const field of type.fields) {
    const v = raw[field.key];
    let out: FieldValue | undefined;
    switch (field.kind) {
      case "text":
        out = clean(v, MAX_TEXT) || undefined;
        break;
      case "textarea":
        out = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, MAX_LONG) || undefined : undefined;
        break;
      case "number": {
        const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
        if (Number.isFinite(n) && Math.abs(n) <= 1e12) out = n;
        else if (v !== undefined && v !== "" && v !== null) errors[field.key] = "Geçerli bir sayı girin.";
        break;
      }
      case "boolean":
        if (v === true || v === "true" || v === "on") out = true;
        else if (v === false || v === "false") out = false;
        break;
      case "select": {
        const s = clean(v, 60);
        if (s && field.options?.includes(s)) out = s;
        else if (s) errors[field.key] = "Listede olmayan bir seçenek.";
        break;
      }
      case "date": {
        const s = clean(v, 10);
        if (DATE_RE.test(s) && !Number.isNaN(Date.parse(s))) out = s;
        else if (s) errors[field.key] = "Tarih YYYY-AA-GG biçiminde olmalı.";
        break;
      }
      case "url": {
        const s = typeof v === "string" ? safeUrl(v.trim()) : "";
        if (s) out = s;
        else if (typeof v === "string" && v.trim()) errors[field.key] = "Geçerli bir bağlantı girin (/yol ya da https://…).";
        break;
      }
      case "email": {
        const s = clean(v, 120);
        if (EMAIL_RE.test(s)) out = s;
        else if (s) errors[field.key] = "Geçerli bir e-posta girin.";
        break;
      }
      case "image": {
        const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
        if (/^\/media\//.test(s) || /^https:\/\//.test(s)) out = s;
        else if (s) errors[field.key] = "Görsel kitaplıktan seçilmeli ya da https adresi olmalı.";
        break;
      }
    }
    if (out !== undefined) values[field.key] = out;
    else if (field.required && !errors[field.key]) errors[field.key] = `${field.label} zorunlu.`;
  }
  return { values, errors };
}

/** Kayıtlı alan değerlerini okur (tanıma uymayanlar yok sayılır). */
export function readFieldValues(type: CustomContentType | undefined, schemaAttributes: unknown): FieldValues {
  if (!type) return {};
  const raw = (schemaAttributes as { _fields?: unknown } | null | undefined)?._fields;
  return sanitizeFieldValues(type, raw).values;
}

/** Öznitelik nesnesine alan değerlerini yazar; boşsa `_fields` anahtarı kalkar. */
export function writeFieldValues(attrs: Record<string, unknown> | undefined, values: FieldValues): Record<string, unknown> {
  const next = { ...(attrs ?? {}) };
  if (Object.keys(values).length > 0) next._fields = values;
  else delete next._fields;
  return next;
}

export interface DisplayField {
  key: string;
  label: string;
  kind: FieldKind;
  /** Gösterime hazır metin (tarih, evet/hayır biçimlenmiş). */
  text: string;
  /** `url`, `email` ve `image` için bağlantı/adres. */
  href?: string;
}

/** Ziyaretçiye gösterilecek alanlar: `show: false` ve boş değerler hariç, tanım sırasında. */
export function displayFields(type: CustomContentType | undefined, schemaAttributes: unknown, locale = "tr"): DisplayField[] {
  if (!type) return [];
  const values = readFieldValues(type, schemaAttributes);
  const out: DisplayField[] = [];
  for (const f of type.fields) {
    const v = values[f.key];
    if (v === undefined || f.show === false) continue;
    let text = String(v);
    let href: string | undefined;
    if (f.kind === "boolean") text = v === true ? "Evet" : "Hayır";
    else if (f.kind === "number") text = new Intl.NumberFormat(locale).format(Number(v));
    else if (f.kind === "date") text = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${v}T00:00:00Z`));
    else if (f.kind === "url") href = String(v);
    else if (f.kind === "email") href = `mailto:${v}`;
    else if (f.kind === "image") href = String(v);
    out.push({ key: f.key, label: f.label, kind: f.kind, text, ...(href ? { href } : {}) });
  }
  return out;
}

/** Özel alanların Markdown karşılığı (`?format=md`, `/llms.txt`, RAG): boş alan yok, biçimler `displayFields` ile aynı. */
export function fieldsMarkdown(type: CustomContentType | undefined, schemaAttributes: unknown, locale = "tr"): string {
  const rows = displayFields(type, schemaAttributes, locale);
  if (rows.length === 0) return "";
  return ["## Özellikler", ...rows.map((r) => `- **${r.label}:** ${r.href && r.kind !== "boolean" && r.kind !== "number" && r.kind !== "date" ? `[${r.text}](${r.href})` : r.text}`)].join("\n");
}

const absolute = (href: string, baseUrl: string): string => (href.startsWith("/") ? `${baseUrl.replace(/\/$/, "")}${href}` : href);

/**
 * Alan değerlerinin JSON-LD karşılığı: yalnızca `schemaProp` tanımlı ve dolu alanlar. Değerler kayıtta zaten temizlenmiştir;
 * bağlantı ve görsel mutlak adrese çevrilir, tarih `YYYY-AA-GG`, sayı sayı, evet/hayır mantıksal değer olarak yazılır.
 * Aynı özellik iki alanda tanımlıysa ilki kazanır.
 */
export function fieldSchemaProps(type: CustomContentType | undefined, schemaAttributes: unknown, options: { baseUrl: string }): Record<string, string | number | boolean> {
  if (!type) return {};
  const values = readFieldValues(type, schemaAttributes);
  const out: Record<string, string | number | boolean> = {};
  for (const f of type.fields) {
    const v = values[f.key];
    if (v === undefined || !f.schemaProp || f.schemaProp in out || PROTECTED_SCHEMA_PROPS.includes(f.schemaProp)) continue;
    out[f.schemaProp] = f.kind === "url" || f.kind === "image" ? absolute(String(v), options.baseUrl) : v;
  }
  return out;
}
