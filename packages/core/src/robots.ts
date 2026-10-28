import { KNOWN_BOTS } from "./ai-bots";

export type BotDecision = "allow" | "block";

export interface RobotsInput {
  baseUrl: string;
  /** Bot kimliği → karar; kayıt olmayan bot izinli sayılır. */
  botPolicy?: Record<string, BotDecision>;
  extra?: string;
  sitemapUrls?: string[];
  /** `*` grubuna eklenecek ek satırlar (ör. Content-Signal) */
  groupLines?: string[];
}

/**
 * robots.txt metnini üretir. Engellenen botlar kendi `User-agent` grubunda `Disallow: /` alır;
 * genel grup (`*`) yönetim ve API yollarını her zaman kapatır.
 */
export function buildRobotsTxt(input: RobotsInput): string {
  const policy = input.botPolicy ?? {};
  const lines: string[] = [];
  const blockedTokens = KNOWN_BOTS.filter((b) => policy[b.id] === "block").flatMap((b) => b.robotsTokens);
  for (const token of blockedTokens) lines.push(`User-agent: ${token}`);
  if (blockedTokens.length) lines.push("Disallow: /", "");
  lines.push("User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api", ...(input.groupLines ?? []), "");
  const base = input.baseUrl.replace(/\/$/, "");
  for (const url of input.sitemapUrls ?? [`${base}/sitemap.xml`]) lines.push(`Sitemap: ${url}`);
  const extra = input.extra?.trim();
  if (extra) lines.push("", extra);
  return `${lines.join("\n")}\n`;
}

/** Next `Metadata.verification` biçimi; boş/geçersiz kodlar atılır (etiket enjeksiyonu olmasın). */
export function webmasterVerification(v?: { google?: string; bing?: string; yandex?: string }) {
  const clean = (s?: string) => {
    const t = (s ?? "").trim();
    return /^[A-Za-z0-9_\-]{8,100}$/.test(t) ? t : undefined;
  };
  const google = clean(v?.google);
  const yandex = clean(v?.yandex);
  const bing = clean(v?.bing);
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}
