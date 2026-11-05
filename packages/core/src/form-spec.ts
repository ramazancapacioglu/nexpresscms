/** Form tanımı (saf mantık): alan türleri, normalleştirme ve gönderim doğrulaması. Sunucu tanımı kaynaktır; istemciye güvenilmez. */
export type FormFieldType =
  | "text" | "email" | "tel" | "url" | "number" | "textarea" | "date" | "time"
  | "select" | "radio" | "checkbox" | "checkboxes" | "rating" | "scale"
  | "heading" | "paragraph" | "divider";

/** Değer toplayan türler; başlık, açıklama ve ayırıcı yalnızca içeriktir. */
export const CONTENT_FIELD_TYPES: ReadonlySet<FormFieldType> = new Set(["heading", "paragraph", "divider"]);
export const CHOICE_FIELD_TYPES: ReadonlySet<FormFieldType> = new Set(["select", "radio", "checkboxes"]);
/** Koşul bağlanabilen türler: seçim ve tek onay kutusu. */
export const GATE_FIELD_TYPES: ReadonlySet<FormFieldType> = new Set(["select", "radio", "checkboxes", "checkbox"]);
const ALL_TYPES = new Set<FormFieldType>(["text", "email", "tel", "url", "number", "textarea", "date", "time", "select", "radio", "checkbox", "checkboxes", "rating", "scale", "heading", "paragraph", "divider"]);

/** Alanın ızgaradaki payı: tam satır, yarım (2'li), çeyrek (4'lü). */
export type FormFieldWidth = "full" | "half" | "quarter";

/** Bir önceki seçim alanının belirli cevabında görünsün. Ziyaretçi sayfasında istemci kodu yoktur. */
export interface FormShowWhen {
  field: string;
  equals: string;
}

export interface FormField {
  /** Kurucuda kararlı kimlik (sürükle-bırak anahtarı); gönderimde `name` kullanılır. */
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder: string;
  help: string;
  width: FormFieldWidth;
  /** Adımlı görünümde 1–6. Boşsa ilk adım. */
  step?: number;
  /** select / radio / checkboxes seçenekleri (değer = etiket) */
  options: string[];
  /** number: alt sınır; rating: yıldız sayısı yok (bkz. max); metin: en az karakter */
  min?: number;
  /** number: üst sınır; metin: en çok karakter; rating: yıldız sayısı (3–10, varsayılan 5) */
  max?: number;
  /** Doluysa alan, bu cevaba kadar gizlidir. Denetçi alan listede daha önce durmalıdır. */
  showWhen?: FormShowWhen;
}

export interface FormAppearance {
  /** Masaüstünde sütun sayısı. Dar ekranda hep tek sütun. */
  columns: 1 | 2 | 4;
  labels: "top" | "side";
  density: "compact" | "comfortable";
  /** `full`: düğme satırı kaplar. `beside`: son alanın yanında durur. */
  buttonAlign: "left" | "center" | "full" | "beside";
  /** `dialog`: tetik bağlantısı, hedef kimliğiyle açılan pencere (istemci kodu yok). */
  surface: "inline" | "dialog";
  triggerLabel: string;
  /** Alanların `step` değerine göre adımlar. Gönder düğmesi son adımdadır. */
  stepped: boolean;
}

export const DEFAULT_FORM_APPEARANCE: FormAppearance = {
  columns: 1,
  labels: "top",
  density: "comfortable",
  buttonAlign: "left",
  surface: "inline",
  triggerLabel: "",
  stepped: false,
};

export interface FormSpec {
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  /** Başarıdan sonra gidilecek site içi yol (`/...`); boşsa aynı sayfada mesaj gösterilir */
  redirectUrl: string;
  appearance: FormAppearance;
}

export interface FormNotifySettings {
  enabled: boolean;
  to: string[];
  subject: string;
  autoReply: { enabled: boolean; emailField: string; subject: string; body: string };
  /** Gönderim kaydından sonra JSON POST. Yalnızca https; özel ağ adresi çalışma anında reddedilir. */
  webhook: { enabled: boolean; url: string };
}

export const FORM_LIMITS = { maxFields: 60, maxOptions: 50, text: 500, textarea: 5000, totalBytes: 40_000, label: 120, help: 240, placeholder: 80, option: 80 } as const;
const NAME_RE = /^[a-z][a-z0-9_]{0,39}$/;
/** Form gövdesindeki ayrılmış ad: bal küpü alanı */
const RESERVED_NAMES = new Set(["website"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[+\d][\d\s().-]{5,24}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/;

export const DEFAULT_FORM_FIELDS: FormField[] = [
  field("f_ad", "ad", "Ad soyad", "text", true),
  field("f_eposta", "eposta", "E-posta", "email", true),
  field("f_mesaj", "mesaj", "Mesaj", "textarea", true),
];

export function field(id: string, name: string, label: string, type: FormFieldType, required = false, extra: Partial<FormField> = {}): FormField {
  return { id, name, label, type, required, placeholder: "", help: "", width: "full", options: [], ...extra };
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Ham alan listesini güvenli alanlara çevirir: bozuk/yinelenen ad `alan_<sıra>` olur, sınırlar uygulanır. */
export function normalizeFields(raw: unknown, fallback: FormField[] | null = DEFAULT_FORM_FIELDS): FormField[] {
  if (!Array.isArray(raw)) return fallback ?? [];
  const names = new Set<string>();
  const ids = new Set<string>();
  const gates = new Map<string, { type: FormFieldType; options: string[] }>();
  const out: FormField[] = [];
  raw.slice(0, FORM_LIMITS.maxFields).forEach((r, i) => {
    const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const type = ALL_TYPES.has(o.type as FormFieldType) ? (o.type as FormFieldType) : "text";
    const content = CONTENT_FIELD_TYPES.has(type);
    let name = typeof o.name === "string" && NAME_RE.test(o.name) && !RESERVED_NAMES.has(o.name) ? o.name : `alan_${i}`;
    if (names.has(name)) {
      if (!content && typeof o.name === "string" && NAME_RE.test(o.name)) return; // yinelenen veri alanı atılır
      name = `alan_${i}`;
    }
    if (names.has(name)) return;
    names.add(name);
    let id = typeof o.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(o.id) ? o.id : `f_${name}`;
    while (ids.has(id)) id = `${id}x`;
    ids.add(id);
    const options = CHOICE_FIELD_TYPES.has(type) && Array.isArray(o.options) ? [...new Set(o.options.map((x) => str(x, FORM_LIMITS.option)).filter(Boolean))].slice(0, FORM_LIMITS.maxOptions) : [];
    out.push({
      id,
      name,
      label: str(o.label, FORM_LIMITS.label) || name,
      type,
      required: !content && o.required === true,
      placeholder: str(o.placeholder, FORM_LIMITS.placeholder),
      help: str(o.help, FORM_LIMITS.help),
      width: o.width === "quarter" ? "quarter" : o.width === "half" ? "half" : "full",
      ...(stepOf(o.step) !== undefined ? { step: stepOf(o.step) } : {}),
      options: type === "select" || type === "radio" || type === "checkboxes" ? (options.length ? options : ["Seçenek 1", "Seçenek 2"]) : [],
      ...(num(o.min) !== undefined ? { min: num(o.min) } : {}),
      ...(num(o.max) !== undefined ? { max: num(o.max) } : {}),
      ...showWhenOf(o.showWhen, name, gates),
    });
    if (GATE_FIELD_TYPES.has(type)) gates.set(name, { type, options });
  });
  return out.length > 0 || fallback === null ? out : fallback;
}

/** Koşul yalnızca daha önce tanımlanmış bir seçim alanının gerçek seçeneğine bağlanır. */
function showWhenOf(raw: unknown, self: string, gates: Map<string, { type: FormFieldType; options: string[] }>): { showWhen?: FormShowWhen } {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fieldName = typeof o.field === "string" ? o.field : "";
  const equals = str(o.equals, FORM_LIMITS.option);
  const gate = gates.get(fieldName);
  if (!gate || fieldName === self || !equals) return {};
  if (gate.type === "checkbox") return equals === "Evet" ? { showWhen: { field: fieldName, equals } } : {};
  return gate.options.includes(equals) ? { showWhen: { field: fieldName, equals } } : {};
}

/** Webhook adresi: https, kimlik bilgisi yok, varsayılan kapı, ham IP yok. */
export function safeWebhookUrl(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  let u: URL;
  try { u = new URL(s); } catch { return ""; }
  if (u.protocol !== "https:") return "";
  if (u.username || u.password || u.hash) return "";
  if (u.port && u.port !== "443") return "";
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) return "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return "";
  if (!/^[a-z0-9.-]+$/.test(host)) return "";
  return `${u.origin}${u.pathname}${u.search}`;
}

/** Sitenin kendi yolu mu (`/yol`)? Açık yönlendirmeyi (`//x`, şema) engeller. */
export function safeInternalPath(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\/(?!\/)[A-Za-z0-9\-._~/%]{0,200}$/.test(s) ? s : "";
}

function stepOf(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 6) return undefined;
  return n;
}

/** Görünüm seçenekleri. Bilinmeyen değer varsayılana döner. */
export function normalizeAppearance(raw: unknown): FormAppearance {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const columns = o.columns === 2 || o.columns === 4 ? o.columns : 1;
  return {
    columns,
    labels: o.labels === "side" ? "side" : "top",
    density: o.density === "compact" ? "compact" : "comfortable",
    buttonAlign: o.buttonAlign === "center" || o.buttonAlign === "full" || o.buttonAlign === "beside" ? o.buttonAlign : "left",
    surface: o.surface === "dialog" ? "dialog" : "inline",
    triggerLabel: str(o.triggerLabel, 60),
    stepped: o.stepped === true,
  };
}

/** Sütun sayısına göre alanın kapladığı hücre. Tek sütunda her alan bir satırdır. */
export function fieldSpan(width: FormFieldWidth, columns: 1 | 2 | 4): number {
  if (columns === 1) return 1;
  if (columns === 2) return width === "full" ? 2 : 1;
  return width === "full" ? 4 : width === "half" ? 2 : 1;
}

export function normalizeFormSpec(raw: unknown): FormSpec {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    fields: normalizeFields(o.fields, []),
    submitLabel: str(o.submitLabel, 60) || "Gönder",
    successMessage: str(o.successMessage, 300),
    redirectUrl: safeInternalPath(o.redirectUrl),
    appearance: normalizeAppearance(o.appearance),
  };
}

export function normalizeNotify(raw: unknown, fields: FormField[] = []): FormNotifySettings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const a = (o.autoReply && typeof o.autoReply === "object" ? o.autoReply : {}) as Record<string, unknown>;
  const w = (o.webhook && typeof o.webhook === "object" ? o.webhook : {}) as Record<string, unknown>;
  const to = (Array.isArray(o.to) ? o.to : typeof o.to === "string" ? o.to.split(/[,\n;]/) : []).map((x) => str(x, 120)).filter((x) => EMAIL_RE.test(x));
  const emailField = typeof a.emailField === "string" && fields.some((f) => f.name === a.emailField && f.type === "email") ? (a.emailField as string) : fields.find((f) => f.type === "email")?.name ?? "";
  const webhookUrl = safeWebhookUrl(w.url);
  return {
    enabled: o.enabled === true,
    to: [...new Set(to)].slice(0, 10),
    subject: str(o.subject, 150) || "Yeni form gönderimi: {form}",
    autoReply: { enabled: a.enabled === true && emailField !== "", emailField, subject: str(a.subject, 150) || "Mesajınızı aldık", body: str(a.body, 2000) || "Merhaba, mesajınız bize ulaştı. En kısa sürede dönüş yapacağız." },
    webhook: { enabled: w.enabled === true && webhookUrl !== "", url: webhookUrl },
  };
}

export interface SubmittedValue {
  name: string;
  label: string;
  type: FormFieldType;
  value: string;
  /** checkboxes için seçilen seçenekler */
  values?: string[];
}

export type SubmissionResult = { ok: true; values: SubmittedValue[] } | { ok: false; errors: Record<string, string> };
export type RawValue = string | string[] | null | undefined;

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();

/** Yalnızca tanımlı alanlar okunur (fazlalık yok sayılır); tür, seçenek, zorunluluk ve uzunluk denetlenir. */
export function validateSubmission(defs: FormField[], raw: Record<string, RawValue>): SubmissionResult {
  const errors: Record<string, string> = {};
  const values: SubmittedValue[] = [];
  let bytes = 0;
  for (const d of defs) {
    if (CONTENT_FIELD_TYPES.has(d.type)) continue;
    if (!fieldIsShown(d, defs, raw)) continue;
    const got = raw[d.name];
    const list = (Array.isArray(got) ? got : got == null ? [] : [got]).filter((x): x is string => typeof x === "string").map(clean).filter(Boolean);
    const required = () => {
      if (d.required) errors[d.name] = "Zorunlu alan.";
    };
    const keep = (value: string, extra: Partial<SubmittedValue> = {}) => {
      bytes += value.length;
      values.push({ name: d.name, label: d.label, type: d.type, value, ...extra });
    };
    if (d.type === "checkboxes") {
      if (list.length === 0) { required(); continue; }
      if (list.some((x) => !d.options.includes(x))) { errors[d.name] = "Geçersiz seçenek."; continue; }
      const uniq = [...new Set(list)];
      keep(uniq.join(", "), { values: uniq });
      continue;
    }
    if (d.type === "checkbox") {
      if (list.length === 0) { required(); continue; }
      keep("Evet");
      continue;
    }
    const v = list[0] ?? "";
    if (!v) { required(); continue; }
    const maxLen = d.max !== undefined && (d.type === "text" || d.type === "textarea") ? Math.min(d.max, FORM_LIMITS.textarea) : d.type === "textarea" ? FORM_LIMITS.textarea : FORM_LIMITS.text;
    if (v.length > maxLen && d.type !== "number") { errors[d.name] = `En çok ${maxLen} karakter.`; continue; }
    switch (d.type) {
      case "email": if (!EMAIL_RE.test(v)) { errors[d.name] = "Geçerli bir e-posta girin."; continue; } break;
      case "tel": if (!TEL_RE.test(v)) { errors[d.name] = "Geçerli bir telefon girin."; continue; } break;
      case "url": if (!/^https?:\/\/[^\s]{3,}$/i.test(v)) { errors[d.name] = "Geçerli bir adres girin (http/https)."; continue; } break;
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n)) { errors[d.name] = "Sayı girin."; continue; }
        if (d.min !== undefined && n < d.min) { errors[d.name] = `En az ${d.min}.`; continue; }
        if (d.max !== undefined && n > d.max) { errors[d.name] = `En çok ${d.max}.`; continue; }
        break;
      }
      case "date": if (!DATE_RE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) { errors[d.name] = "Geçerli bir tarih girin."; continue; } break;
      case "time": {
        const m = TIME_RE.exec(v);
        const hh = Number(m?.[1]);
        const mm = Number(m?.[2]);
        if (!m || hh > 23 || mm > 59) { errors[d.name] = "Geçerli bir saat girin."; continue; }
        keep(`${m[1]}:${m[2]}`);
        continue;
      }
      case "select": case "radio": if (!d.options.includes(v)) { errors[d.name] = "Geçersiz seçenek."; continue; } break;
      case "rating": { const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > ratingMax(d)) { errors[d.name] = "Geçersiz puan."; continue; } break; }
      case "scale": { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 10) { errors[d.name] = "Geçersiz puan."; continue; } break; }
      default:
        if (d.min !== undefined && v.length < d.min && (d.type === "text" || d.type === "textarea")) { errors[d.name] = `En az ${d.min} karakter.`; continue; }
    }
    keep(v);
  }
  if (bytes > FORM_LIMITS.totalBytes) errors._total = "Gönderim çok büyük.";
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

export function ratingMax(d: Pick<FormField, "max">): number {
  return Math.min(10, Math.max(3, Math.trunc(d.max ?? 5)));
}

function rawFirst(got: RawValue): string {
  const list = (Array.isArray(got) ? got : got == null ? [] : [got]).filter((x): x is string => typeof x === "string").map(clean).filter(Boolean);
  return list[0] ?? "";
}

/** Koşulu tutmayan alan gönderilmemiş sayılır. Denetçi alan da gizliyse bu alan da gizlidir. */
function fieldIsShown(d: FormField, defs: FormField[], raw: Record<string, RawValue>, stack = new Set<string>()): boolean {
  if (!d.showWhen) return true;
  if (stack.has(d.name)) return false;
  const ctrl = defs.find((x) => x.name === d.showWhen!.field);
  if (!ctrl) return false;
  stack.add(d.name);
  if (!fieldIsShown(ctrl, defs, raw, stack)) return false;
  if (ctrl.type === "checkbox") return rawFirst(raw[ctrl.name]) !== "" && d.showWhen.equals === "Evet";
  return rawFirst(raw[ctrl.name]) === d.showWhen.equals;
}
