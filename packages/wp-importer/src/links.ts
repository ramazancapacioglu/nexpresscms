import type { BlockNode } from "@nexpress/core";

/** Kaynak sitenin mutlak adresini yerel yola çevirir. Başka alan adı, mailto ve tel durur. */
export function siteOrigin(siteUrl: string): string {
  const raw = siteUrl.trim();
  const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
  return u.origin;
}

const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, "");

function sameSite(host: string, originHost: string): boolean {
  return bareHost(host) === bareHost(originHost);
}

/**
 * Taban adres yoksa mutlak adres durur, göreli yol olduğu gibi kalır.
 * Başka bir sitenin adresi varsayılan olarak eklenmez.
 */
export function resolveAgainstBase(raw: string, baseUrl: string): string {
  const clean = raw.replace(/^['"]|['"]$/g, "").trim();
  if (!clean || clean.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("//")) return `https:${clean}`;
  if (!baseUrl) return clean;
  try {
    const abs = new URL(clean, baseUrl);
    return abs.protocol === "http:" || abs.protocol === "https:" ? abs.toString() : clean;
  } catch {
    return clean;
  }
}

/** Göreli medya yolunu kaynak sitenin adresine bağlar. `http` adres ve `data:` olduğu gibi kalır. */
export function resolveAssetUrl(url: string, origin: string): string {
  const trimmed = url.trim();
  if (!trimmed || /^(data:|mailto:|tel:|javascript:|#)/i.test(trimmed)) return url;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const base = origin.endsWith("/") ? origin : `${origin}/`;
    const abs = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed, base);
    return abs.protocol === "http:" || abs.protocol === "https:" ? abs.toString() : url;
  } catch {
    return url;
  }
}

/** Tek bir adres. Değişmiyorsa aynı dizge döner. */
export function rewriteAbsoluteUrl(value: string, origin: string, base: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^(mailto:|tel:|#|javascript:)/i.test(trimmed)) return value;
  let url: URL;
  try {
    url = new URL(trimmed, origin);
  } catch {
    return value;
  }
  const originUrl = new URL(origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") return value;
  if (!sameSite(url.host, originUrl.host)) return value;
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  const path = `${url.pathname || "/"}${url.search}${url.hash}`;
  if (path === "/" || path === "") return prefix || "/";
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeReg(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Metin ve HTML içindeki kaynak site adreslerini sayar ve çevirir. */
export function rewriteTextLinks(text: string, origin: string, base: string): { text: string; count: number } {
  const host = escapeReg(bareHost(new URL(origin).host));
  const re = new RegExp(`https?:\\/\\/(?:www\\.)?${host}[^\\s"'<>]*`, "gi");
  let count = 0;
  const next = text.replace(re, (match) => {
    const rewritten = rewriteAbsoluteUrl(match, origin, base);
    if (rewritten !== match) count += 1;
    return rewritten;
  });
  return { text: next, count };
}

function rewriteValue(value: unknown, origin: string, base: string, tally: { count: number }): unknown {
  if (typeof value === "string") {
    const result = rewriteTextLinks(value, origin, base);
    tally.count += result.count;
    return result.text;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, origin, base, tally));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = rewriteValue(item, origin, base, tally);
    return out;
  }
  return value;
}

/** Blok ağacındaki adresleri çevirir. Ağaç kopyalanır; gelen düğüm değişmez. */
export function rewriteBlockLinks(blocks: BlockNode[], origin: string, base: string): { blocks: BlockNode[]; count: number } {
  const tally = { count: 0 };
  const walk = (block: BlockNode): BlockNode => ({
    ...block,
    props: rewriteValue(block.props ?? {}, origin, base, tally) as BlockNode["props"],
    children: block.children?.map(walk),
  });
  return { blocks: blocks.map(walk), count: tally.count };
}

/**
 * İç bağlantı tarandıktan sonra ortam dosyasının yolu kaynak sitede kalır.
 * Sayfa adresi yerel yola dönmüş olur; `/wp-content/` tekrar mutlak adrese bağlanır.
 */
export function restoreRemoteMedia(blocks: BlockNode[], origin: string): BlockNode[] {
  const root = origin.replace(/\/$/, "");
  const fix = (value: string) => value.replace(/(^|[\s"'=(])(\/wp-content\/)/gi, `$1${root}$2`);
  const walkValue = (value: unknown): unknown => {
    if (typeof value === "string") return fix(value);
    if (Array.isArray(value)) return value.map(walkValue);
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = walkValue(item);
      return out;
    }
    return value;
  };
  const walk = (block: BlockNode): BlockNode => ({
    ...block,
    props: walkValue(block.props ?? {}) as BlockNode["props"],
    children: block.children?.map(walk),
  });
  return blocks.map(walk);
}
