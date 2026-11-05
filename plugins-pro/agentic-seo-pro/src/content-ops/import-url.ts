/**
 * Dış içerik adresi kapısı. İç ağ, kimlik bilgisi ve garip kapı reddedilir.
 * DNS denetimi çağırandadır; bu fonksiyon yalnız adresi okur.
 */

function looksLikeIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

export function gateImportUrl(raw: string): { href: string; host: string } | { error: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { error: "adres okunamadı" };
  }
  if (url.username || url.password) return { error: "kimlik bilgili adres" };
  if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "yalnızca http(s)" };
  if (url.port && url.port !== "80" && url.port !== "443") return { error: "izin verilmeyen kapı" };
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "metadata.google.internal" || host === "metadata") {
    return { error: "iç adres" };
  }
  if (looksLikeIp(host)) {
    const parts = host.split(".").map((n) => Number(n));
    const [a, b] = parts;
    const privateV4 =
      parts.length === 4 &&
      parts.every((n) => n >= 0 && n <= 255) &&
      (a === 10 || a === 127 || a === 0 || (a === 172 && b !== undefined && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254));
    if (privateV4 || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return { error: "iç adres" };
  }
  url.hash = "";
  return { href: url.toString(), host };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/** Başlık ve gövde metnini HTML'den ayıklar. Betik ve stil atılır. */
export function extractReadable(html: string): { title: string; text: string } {
  const titleRaw = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const withoutCode = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const region = withoutCode.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? withoutCode.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? withoutCode;
  const text = decodeEntities(region.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 8000);
  const title = decodeEntities(titleRaw).replace(/\s+/g, " ").trim().slice(0, 180);
  return { title, text };
}
