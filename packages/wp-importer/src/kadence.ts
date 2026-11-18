/**
 * WordPress yönetiminden okunan üç veri türünün saf ayrıştırıcıları: Kadence form tanımı, form girdisi ve
 * Rank Math yönlendirmesi. Ağ ve veritabanı yoktur; çağıran taraf HTML/JSON metnini verir.
 */

export type KadenceFieldType = "text" | "email" | "tel" | "textarea" | "select" | "radio" | "checkbox" | "checkboxes" | "number" | "date" | "time" | "url";

export interface KadenceFormField {
  id: string;
  name: string;
  label: string;
  type: KadenceFieldType;
  required: boolean;
  placeholder: string;
  help: string;
  options: string[];
}

export interface KadenceForm {
  fields: KadenceFormField[];
  submitLabel: string;
}

const FIELD_TYPE: Record<string, KadenceFieldType> = {
  text: "text",
  email: "email",
  telephone: "tel",
  textarea: "textarea",
  select: "select",
  radio: "radio",
  checkbox: "checkboxes",
  accept: "checkbox",
  number: "number",
  date: "date",
  time: "time",
  url: "url",
};

const ASCII: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

function fieldName(label: string, used: Set<string>): string {
  const base =
    label
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşüâîû]/g, (char) => ASCII[char] ?? char)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "alan";
  let name = base;
  let suffix = 2;
  while (used.has(name)) {
    name = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(name);
  return name;
}

function cleanText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** `wp:kadence/advanced-form-*` blok yorumlarından alan listesi çıkarır. Gizli ve doğrulama alanları atılır. */
export function parseKadenceForm(raw: string): KadenceForm {
  const fields: KadenceFormField[] = [];
  const used = new Set<string>();
  let submitLabel = "Gönder";
  const pattern = /<!--\s*wp:kadence\/advanced-form-([a-z-]+)\s*(\{[\s\S]*?\})?\s*\/?-->/g;
  for (const match of raw.matchAll(pattern)) {
    const kind = match[1] ?? "";
    let attrs: Record<string, unknown> = {};
    try {
      attrs = match[2] ? (JSON.parse(match[2]) as Record<string, unknown>) : {};
    } catch {
      attrs = {};
    }
    if (kind === "submit") {
      submitLabel = cleanText(attrs.label, 40) || submitLabel;
      continue;
    }
    const type = FIELD_TYPE[kind];
    if (!type) continue;
    const label = cleanText(attrs.label, 120) || cleanText(attrs.placeholder, 120) || "Alan";
    const options = Array.isArray(attrs.options)
      ? attrs.options
          .map((option) => (option && typeof option === "object" ? cleanText((option as { label?: unknown; value?: unknown }).label ?? (option as { value?: unknown }).value, 80) : ""))
          .filter(Boolean)
      : [];
    const fallbackOptions = type === "checkboxes" && options.length === 0 ? [label] : options;
    const uniqueId = typeof attrs.uniqueID === "string" ? attrs.uniqueID.replace(/[^a-z0-9]/gi, "").slice(0, 16) : "";
    fields.push({
      id: `f_${uniqueId || fields.length + 1}`,
      name: fieldName(label, used),
      label,
      type: type === "checkboxes" && kind === "accept" ? "checkbox" : type,
      required: attrs.required === true,
      placeholder: cleanText(attrs.placeholder, 120),
      help: cleanText(attrs.helpText ?? attrs.help, 200),
      options: type === "select" || type === "radio" || type === "checkboxes" ? fallbackOptions : [],
    });
  }
  return { fields, submitLabel };
}

export interface KadenceEntry {
  id: string;
  formId: string;
  formName: string;
  createdAt: Date | null;
  pageUrl: string;
  fields: Array<{ label: string; value: string }>;
}

const TR_MONTH: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  eylül: 8,
  ekim: 9,
  kasım: 10,
  aralık: 11,
};

/** "16 Kasım 2026 01:34" → İstanbul saati (UTC+3) olarak Date. */
export function parseTrDate(text: string): Date | null {
  const match = /(\d{1,2})\s+([^\s\d]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text.trim());
  if (!match) return null;
  const month = TR_MONTH[(match[2] ?? "").toLocaleLowerCase("tr")];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1]), Number(match[4] ?? 0) - 3, Number(match[5] ?? 0)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function entities(value: string): string {
  return value
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;|&#034;/g, '"')
    .replace(/&amp;|&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

const strip = (html: string) => entities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Girdi listesi sayfasından girdi kimlikleri. */
export function parseEntryIds(html: string): string[] {
  return [...new Set([...html.matchAll(/view-entry=(\d+)/g)].map((match) => match[1] ?? ""))].filter(Boolean);
}

/** Tek girdi sayfası (`view-entry`). Alan değerleri etiket-değer çifti olarak gelir. */
export function parseEntryPage(html: string, id: string): KadenceEntry | null {
  const rows = [...html.matchAll(/<tr class="kadence-forms-entry-field"><th><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/th><\/tr>/g)];
  if (rows.length === 0) return null;
  const fields = rows.map((row) => ({ label: strip(row[1] ?? "").replace(/:$/, "").trim(), value: strip(row[2] ?? "") })).filter((row) => row.label);
  const title = /class="hndle">\s*<span>([\s\S]*?)<\/span>/.exec(html)?.[1] ?? "";
  const formName = strip(title).replace(/\s*:\s*Entry\s*#\d+\s*$/i, "");
  const formId = /data-form-id="(\d+)"/.exec(html)?.[1] ?? "";
  const submitted = /Submitted:\s*<\/?[^>]*>?\s*([^<]+)/i.exec(html)?.[1] ?? /Submitted:\s*([^<]+)/i.exec(html)?.[1] ?? "";
  const pageUrl = /Page:\s*(?:<[^>]+>\s*)*<a[^>]*href="([^"]+)"/i.exec(html)?.[1] ?? "";
  return { id, formId, formName, createdAt: parseTrDate(strip(submitted)), pageUrl: entities(pageUrl), fields };
}

/**
 * Rastgele harf yığını gönderen bot girdisini ayırır: en az üç alanda boşluksuz, 10+ harfli, büyük-küçük harf
 * karışık ve ağırlıkla ünsüz dizisi varsa spamdir.
 */
export function looksLikeBotEntry(fields: Array<{ label: string; value: string }>): boolean {
  let hits = 0;
  for (const field of fields) {
    const value = field.value.trim();
    if (value.length < 10 || value.includes(" ") || !/^[A-Za-z]+$/.test(value)) continue;
    const flips = value.split("").filter((char, index) => index > 0 && char !== char.toLowerCase() && value[index - 1] === (value[index - 1] ?? "").toLowerCase()).length;
    if (flips >= 2) hits += 1;
  }
  return hits >= 3;
}

export interface RankMathRedirect {
  id: string;
  from: string;
  to: string;
  code: number;
  active: boolean;
  /** Yalnızca tam eşleşme taşınır; kalıp (regex, içerir, başlar) olanlar atlanır. */
  exact: boolean;
}

/** Rank Math Yönlendirmeler listesi: her satır `data-redirection` JSON'unu taşır. */
export function parseRankMathRedirects(html: string): RankMathRedirect[] {
  const out: RankMathRedirect[] = [];
  for (const match of html.matchAll(/data-redirection="([^"]+)"/g)) {
    try {
      const row = JSON.parse(entities(match[1] ?? "")) as {
        id?: string | number;
        sources?: Array<{ pattern?: string; comparison?: string }>;
        url_to?: string;
        header_code?: string | number;
        status?: string;
      };
      const to = String(row.url_to ?? "").trim();
      const code = Number(row.header_code ?? 301);
      for (const [index, source] of (row.sources ?? []).entries()) {
        const pattern = String(source.pattern ?? "").trim();
        if (!pattern || !to) continue;
        out.push({
          id: `${row.id ?? ""}:${index}`,
          from: pattern,
          to,
          code: [301, 302, 307, 308].includes(code) ? code : 301,
          active: row.status === "active",
          exact: (source.comparison ?? "exact") === "exact",
        });
      }
    } catch {
      continue;
    }
  }
  return out;
}

export interface ReviewCard {
  title: string;
  /** 0–5; yıldız karakterleri sayılır. */
  stars: number;
  body: string;
}

/**
 * Değerlendirme eklentisinin yorum kartı (`review-card-display`): başlık (`h4`), ★ dizisi ve gövde.
 * Kart değilse `null`; çağıran düz yorum metnine döner.
 */
export function parseReviewCard(html: string): ReviewCard | null {
  if (!html.includes("review-card-display")) return null;
  const title = strip(/<h4[^>]*>([\s\S]*?)<\/h4>/.exec(html)?.[1] ?? "");
  const stars = (/((?:★|&#9733;|&#x2605;)+)/.exec(html)?.[1] ?? "").replace(/&#9733;|&#x2605;/g, "★").length;
  const afterHeader = html.split(/<\/div>\s*<\/div>/)[0] ? html.slice(html.indexOf("review-header-display")) : html;
  const bodyHtml = /line-height:1\.6;?"[^>]*>([\s\S]*?)<\/div>/.exec(afterHeader)?.[1] ?? "";
  const body = strip(bodyHtml);
  return { title, stars: Math.min(5, stars), body };
}
