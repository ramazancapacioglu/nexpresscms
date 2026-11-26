/**
 * Kuruluş şeması eki: yerel işletme bilgisi (adres, saat, telefon, koordinat…). Serbest JSON-LD değil, izin listeli
 * Schema.org alanlarıdır; `@id`, `url`, `logo`, `sameAs` ve başka düğüm göndermeleri atılır. Boşsa `undefined`.
 */
const ALLOWED = new Set([
  "alternateName",
  "legalName",
  "description",
  "telephone",
  "email",
  "faxNumber",
  "address",
  "geo",
  "hasMap",
  "openingHours",
  "openingHoursSpecification",
  "priceRange",
  "paymentAccepted",
  "currenciesAccepted",
  "areaServed",
  "availableLanguage",
  "knowsAbout",
  "knowsLanguage",
  "slogan",
  "taxID",
  "vatID",
  "iso6523Code",
  "foundingDate",
  "numberOfEmployees",
  "award",
  "brand",
  "parentOrganization",
  "hasCredential",
  "contactPoint",
  "department",
]);

/**
 * T.C. kimlik numarası mı? 11 hane, ilk hane 0 değil, 10. ve 11. hane sağlama kuralına uyar.
 * Şahıs işletmesinde vergi numarası T.C. kimlik numarasıdır; bu bir kişisel veridir ve herkese açık şemaya yazılmaz.
 * Şirketlerin vergi numarası (VKN) 10 hanelidir ve bu denetimden geçmez.
 */
export function isTurkishCitizenId(raw: unknown): boolean {
  if (typeof raw !== "string" && typeof raw !== "number") return false;
  const digits = String(raw).replace(/^TR/i, "").replace(/[\s.-]/g, "");
  if (!/^[1-9]\d{10}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** Vergi kimliği alanları: değer T.C. kimlik numarasıysa yazılmaz (kişisel veri sızıntısı). */
const TAX_KEYS = new Set(["taxID", "vatID"]);

const TYPE_RE = /^[A-Z][A-Za-z]{2,40}$/;
const MAX_BYTES = 8000;
const MAX_DEPTH = 5;

function clean(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, 600);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (depth >= MAX_DEPTH) return undefined;
  if (Array.isArray(value)) {
    const list = value.slice(0, 40).map((item) => clean(item, depth + 1)).filter((item) => item !== undefined);
    return list.length > 0 ? list : undefined;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      // İç düğüm başvurusu (`@id`) ve bağlam taşınmaz; yalnızca tür ve düz alanlar kalır.
      if (key === "@type") {
        if (typeof item === "string" && TYPE_RE.test(item)) out[key] = item;
        continue;
      }
      if (key.startsWith("@") || !/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(key)) continue;
      const next = clean(item, depth + 1);
      if (next !== undefined) out[key] = next;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return undefined;
}

export function sanitizeOrganizationSchema(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const source = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const rawType = source["@type"];
  const types = (Array.isArray(rawType) ? rawType : rawType ? [rawType] : []).filter((type): type is string => typeof type === "string" && TYPE_RE.test(type)).slice(0, 4);
  if (types.length > 0) out["@type"] = types;
  for (const [key, value] of Object.entries(source)) {
    if (!ALLOWED.has(key)) continue;
    if (TAX_KEYS.has(key) && isTurkishCitizenId(value)) continue;
    const next = clean(value, 0);
    if (next !== undefined) out[key] = next;
  }
  if (Object.keys(out).length === 0) return undefined;
  return JSON.stringify(out).length > MAX_BYTES ? undefined : out;
}
