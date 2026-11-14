const PRIVATE_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i;

/**
 * Herkese açık WordPress kök adresi. Yalnızca https ve varsayılan kapı.
 * İç ağ, kullanıcı bilgisi ve yol atılır. Geçersizse `null`.
 */
export function normalizePublicOrigin(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST.test(host) || host.endsWith(".local") || host.endsWith(".internal")) return null;
  return url.origin;
}

/** Yayımlanmış sayfanın başlığından okunan SEO ve şema. WordPress yönetimine girilmez. */

export interface PublicHeadFaq {
  q: string;
  a: string;
}

export interface PublicHeadSoftware {
  name: string;
  os: string;
  category: string;
  price: string;
  currency: string;
  description: string;
}

export interface PublicHeadOrganization {
  name: string;
  description: string;
  logo: string;
  email: string;
  sameAs: string[];
}

export interface PublicHead {
  title: string;
  description: string;
  noindex: boolean;
  types: string[];
  faqs: PublicHeadFaq[];
  software: PublicHeadSoftware[];
  organization: PublicHeadOrganization | null;
  siteName: string;
}

/** HTML varlıklarını düz metne çevirir. Etiketleri atar. */
export function plainText(value: string, max = 500): string {
  const decoded = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  return decoded.replace(/\s+/g, " ").trim().slice(0, max);
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = /(?:name|property)=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (name !== key.toLowerCase()) continue;
    return plainText(/content=["']([^"']*)["']/i.exec(tag)?.[1] ?? "", 400);
  }
  return "";
}

function nodeTypes(node: Record<string, unknown>): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") return [raw];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  return [];
}

function asText(value: unknown, max: number): string {
  if (typeof value === "string") return plainText(value, max);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return asText(row.url ?? row.contentUrl ?? row["@id"] ?? "", max);
  }
  return "";
}

function walk(node: unknown, visit: (row: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  const row = node as Record<string, unknown>;
  visit(row);
  if (row["@graph"]) walk(row["@graph"], visit);
  if (row.mainEntity) walk(row.mainEntity, visit);
  if (row.itemListElement) walk(row.itemListElement, visit);
}

function readSoftware(row: Record<string, unknown>): PublicHeadSoftware {
  const offers = Array.isArray(row.offers) ? row.offers[0] : row.offers;
  const offer = offers && typeof offers === "object" ? (offers as Record<string, unknown>) : {};
  return {
    name: asText(row.name, 180),
    os: asText(row.operatingSystem, 80),
    category: asText(row.applicationCategory, 80),
    price: asText(offer.price, 20),
    currency: asText(offer.priceCurrency, 8),
    description: asText(row.description, 400),
  };
}

function readOrganization(row: Record<string, unknown>): PublicHeadOrganization {
  const same = row.sameAs;
  const sameAs = (Array.isArray(same) ? same : same ? [same] : [])
    .map((item) => asText(item, 300))
    .filter((item) => item.startsWith("https://"));
  return {
    name: asText(row.name, 180),
    description: asText(row.description, 400),
    logo: asText(row.logo, 300),
    email: asText(row.email, 180),
    sameAs,
  };
}

/** Başlık, açıklama, robots ve JSON-LD şemasını ayıklar. Canonical eski alan adında bırakılır; çağıran yerelde üretir. */
export function parsePublicHead(html: string): PublicHead {
  const title = plainText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "", 240);
  const description = metaContent(html, "description");
  const robots = metaContent(html, "robots").toLowerCase();
  const types = new Set<string>();
  const faqs: PublicHeadFaq[] = [];
  const seenFaq = new Set<string>();
  const software: PublicHeadSoftware[] = [];
  let organization: PublicHeadOrganization | null = null;
  let orgScore = -1;
  let siteName = "";

  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const raw = />([\s\S]*)<\/script>/i.exec(block)?.[1]?.trim() ?? "";
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    walk(data, (row) => {
      const kind = nodeTypes(row);
      for (const type of kind) types.add(type);
      if (kind.includes("WebSite")) siteName = siteName || asText(row.name, 180);
      if (kind.includes("Question")) {
        const q = asText(row.name, 300) || asText(row.text, 300);
        const answer = row.acceptedAnswer && typeof row.acceptedAnswer === "object" ? asText((row.acceptedAnswer as Record<string, unknown>).text, 2000) : "";
        const key = q.toLowerCase();
        if (q && answer && !seenFaq.has(key)) {
          seenFaq.add(key);
          faqs.push({ q, a: answer });
        }
      }
      if (kind.includes("SoftwareApplication")) {
        const item = readSoftware(row);
        if (item.name) software.push(item);
      }
      if (kind.includes("Organization") || kind.includes("LocalBusiness")) {
        const item = readOrganization(row);
        const score = (item.sameAs.length ? 4 : 0) + (item.logo.startsWith("https://") ? 2 : 0) + (item.email.includes("@") ? 2 : 0) + (item.description ? 1 : 0);
        if (item.name && score > orgScore) {
          organization = item;
          orgScore = score;
        }
      }
    });
  }

  return {
    title,
    description,
    noindex: robots.includes("noindex"),
    types: [...types],
    faqs: faqs.slice(0, 20),
    software: software.slice(0, 12),
    organization,
    siteName,
  };
}

/**
 * Sayfa şeması için tek yazılım kartı. Katalog sayfasındaki uzun liste sayfanın kendi şeması sayılmaz.
 */
export function pickPageSoftware(items: PublicHeadSoftware[]): PublicHeadSoftware | null {
  if (items.length === 0 || items.length > 3) return null;
  return items.find((item) => item.name) ?? null;
}
