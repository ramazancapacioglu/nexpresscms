import { KNOWN_BOTS } from "./ai-bots";
import { acceptVerifyCode, type WebmasterVerification } from "./webmaster-connect";

export type BotDecision = "allow" | "block";

export interface RobotsInput {
  baseUrl: string;
  /** Bot kimliği → karar; kayıt olmayan bot izinli sayılır. */
  botPolicy?: Record<string, BotDecision>;
  extra?: string;
  sitemapUrls?: string[];
  /** `*` grubuna eklenecek ek satırlar (ör. Content-Signal) */
  groupLines?: string[];
  /** `false` ise tüm site `Disallow: /` olur ve site haritası yazılmaz. */
  indexing?: boolean;
}

/**
 * robots.txt metnini üretir. Engellenen botlar kendi `User-agent` grubunda `Disallow: /` alır;
 * genel grup (`*`) yönetim ve API yollarını her zaman kapatır.
 */
export function buildRobotsTxt(input: RobotsInput): string {
  const extra = input.extra?.trim();
  if (input.indexing === false) {
    return `User-agent: *\nDisallow: /\n${extra ? `\n${extra}\n` : ""}`;
  }
  const policy = input.botPolicy ?? {};
  const lines: string[] = [];
  const blockedTokens = KNOWN_BOTS.filter((b) => policy[b.id] === "block").flatMap((b) => b.robotsTokens);
  for (const token of blockedTokens) lines.push(`User-agent: ${token}`);
  if (blockedTokens.length) lines.push("Disallow: /", "");
  lines.push("User-agent: *", "Allow: /", "Allow: /api/mcp", "Allow: /api/site-icon", "Disallow: /admin", "Disallow: /api", ...(input.groupLines ?? []), "");
  const base = input.baseUrl.replace(/\/$/, "");
  for (const url of input.sitemapUrls ?? [`${base}/sitemap.xml`]) lines.push(`Sitemap: ${url}`);
  if (extra) lines.push("", extra);
  return `${lines.join("\n")}\n`;
}

/** Next `Metadata.verification` biçimi; boş/geçersiz kodlar atılır (etiket enjeksiyonu olmasın). */
export function webmasterVerification(v?: Pick<WebmasterVerification, "google" | "bing" | "yandex">) {
  const google = acceptVerifyCode(v?.google) || undefined;
  const yandex = acceptVerifyCode(v?.yandex) || undefined;
  const bing = acceptVerifyCode(v?.bing) || undefined;
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}
