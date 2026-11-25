/**
 * Arama konsolu sahipliği ve ölçüm kimliği.
 * Panele yapıştırılan etiket veya düz kod tek bir jetona indirilir; ziyaretçi sayfasına ham HTML yazılmaz.
 */

export interface WebmasterVerification {
  /** `<head>` meta içeriği. Etiketin tamamı değil. */
  google?: string;
  bing?: string;
  yandex?: string;
  /** DNS TXT kaydının jetunu. HTML'e basılmaz; kayıt metni panelde gösterilir ve DNS sorgulanır. */
  dns?: { google?: string; yandex?: string };
  /** Bing'in verdiği CNAME adı (hedef her zaman verify.bing.com). */
  bingCname?: string;
}

const CODE = /^[A-Za-z0-9_-]{8,100}$/;

/** Meta etiketinden, `ad=jeton` satırından veya düz metinden jetonu ayıklar. */
export function extractVerifyCode(raw: string): string {
  const text = raw.trim();
  const meta = text.match(/content\s*=\s*["']([^"']+)["']/i);
  const fromMeta = meta?.[1]?.trim();
  const labeled = (fromMeta ?? text).match(
    /(?:google-site-verification|yandex-verification|msvalidate\.01)\s*[=:]\s*([A-Za-z0-9_-]+)/i,
  );
  const token = (labeled?.[1] ?? fromMeta ?? text).replace(/\s+/g, "");
  return token;
}

/** Geçerli jetonu döndürür. Boş veya bozuk giriş boş stringdir. */
export function acceptVerifyCode(raw: string | undefined): string {
  const code = extractVerifyCode(raw ?? "");
  return CODE.test(code) ? code : "";
}

export function googleTxtValue(code: string): string {
  return `google-site-verification=${code}`;
}

export function yandexTxtValue(code: string): string {
  return `yandex-verification: ${code}`;
}

export const BING_CNAME_TARGET = "verify.bing.com";

export function bingCnameLabelOk(label: string | undefined): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/i.test((label ?? "").trim());
}

export function measurementIdOk(id: string | undefined): boolean {
  return /^G-[A-Z0-9]{4,16}$/i.test((id ?? "").trim());
}

export function metrikaCounterOk(id: string | undefined): boolean {
  return /^\d{5,12}$/.test((id ?? "").trim());
}

/** Yapıştırılan Yandex Metrika HTML kodundan 5–12 haneli sayaç numarasını çıkarır. */
export function extractMetrikaCounterId(raw: string | undefined): string {
  const text = (raw ?? "").trim();
  if (!text) return "";
  const hit =
    text.match(/\bym\s*\(\s*(\d{5,12})\s*,/i) ??
    text.match(/mc\.yandex\.ru\/metrika\/tag\.js\?id=(\d{5,12})/i) ??
    text.match(/mc\.yandex\.ru\/watch\/(\d{5,12})/i) ??
    text.match(/yaCounter(\d{5,12})/i);
  return hit?.[1] ?? "";
}

/** Yandex Metrika sayaç/doğrulama HTML kodunu doğrular. Boşsa temiz döner. */
export function validateMetrikaHtml(raw: string | undefined): { value: string; error?: string } {
  const text = (raw ?? "").trim();
  if (!text) return { value: "" };
  if (text.length > 8000) {
    return { value: "", error: "Yandex Metrika HTML kodu çok uzun (en fazla 8.000 karakter)." };
  }
  const looksLikeMetrika =
    /mc\.yandex\.ru\/(?:metrika\/tag\.js|watch\/\d{5,12})/i.test(text) ||
    /\bym\s*\(\s*\d{5,12}\s*,/i.test(text);
  if (!looksLikeMetrika) {
    return {
      value: "",
      error: "Geçerli bir Yandex Metrika sayaç HTML kodu algılanamadı (mc.yandex.ru veya ym(...) beklenir).",
    };
  }
  return { value: text };
}

export function scriptPlacement(value: unknown): "head" | "body" {
  return value === "body" ? "body" : "head";
}

/** Kayıtlı doğrulamayı temizler. Dolu ama bozuk bir alan varsa kaydetmeden hata döner. */
export function normalizeWebmasterVerification(input: WebmasterVerification | undefined): {
  value: WebmasterVerification;
  error?: string;
} {
  const fields: Array<{ raw?: string; label: string; assign: (code: string) => void }> = [];
  const value: WebmasterVerification = {};
  const dns: { google?: string; yandex?: string } = {};
  const take = (raw: string | undefined, label: string, assign: (code: string) => void) => {
    const text = (raw ?? "").trim();
    if (!text) return;
    const code = acceptVerifyCode(text);
    if (!code) {
      fields.push({ label, assign, raw: text });
      return;
    }
    assign(code);
  };
  take(input?.google, "Google meta", (code) => {
    value.google = code;
  });
  take(input?.bing, "Bing meta", (code) => {
    value.bing = code;
  });
  take(input?.yandex, "Yandex meta", (code) => {
    value.yandex = code;
  });
  take(input?.dns?.google, "Google DNS", (code) => {
    dns.google = code;
  });
  take(input?.dns?.yandex, "Yandex DNS", (code) => {
    dns.yandex = code;
  });
  const bad = fields.find((f) => f.raw && !acceptVerifyCode(f.raw));
  if (bad) return { value: {}, error: `${bad.label} kodu tanınmadı. Etiketin content değerini veya düz kodu yapıştırın.` };
  if (dns.google || dns.yandex) value.dns = dns;
  const cname = (input?.bingCname ?? "").trim();
  if (cname) {
    if (!bingCnameLabelOk(cname)) return { value: {}, error: "Bing CNAME adı yalnızca harf, rakam ve tire olabilir." };
    value.bingCname = cname.toLowerCase();
  }
  return { value };
}

/** `resolveTxt` dizisinde beklenen kayıt var mı. */
export function txtHit(records: string[][], expected: string): boolean {
  const needle = expected.trim().toLowerCase();
  if (!needle) return false;
  return records.some((parts) => parts.join("").trim().toLowerCase() === needle);
}

/** CNAME hedefi birebir `verify.bing.com` mi. */
export function cnameHit(records: string[], target = BING_CNAME_TARGET): boolean {
  const needle = target.toLowerCase().replace(/\.$/, "");
  return records.some((row) => row.trim().toLowerCase().replace(/\.$/, "") === needle);
}

/**
 * Doğrulama sorgusu yalnız sitenin kendi alan adında yapılır.
 * `www` ve kök ad ikisi de döner; localhost ve boş adres elenir.
 */
export function verificationHosts(domain: string | undefined): string[] {
  const host = (domain ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.replace(/\.$/, "")
    .toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || !host.includes(".")) return [];
  const apex = host.startsWith("www.") ? host.slice(4) : host;
  return [...new Set([apex, `www.${apex}`])];
}
