import { isAuthoredType, resolvePublishing } from "@nexpress/core";
import type { SitemapEntry } from "@nexpress/seo-core";
import { authorSlug } from "./author-slug";

/**
 * Site haritasına giren merkez (hub) sayfalar: ziyaretçiye açık, dizine açık ve içeriği olan listeler.
 * Kural: sayfa dizine açıksa haritada olmalı, dizine kapalıysa (boş arşiv, etiket) haritada olmamalı.
 * Saf işlevlerdir (veritabanı bilmez); veriyi `sitemap-source.ts` toplar.
 */

interface PublishedItem {
  type: string;
  slug: string;
  noIndex?: boolean | null;
  authorName?: string | null;
  schemaAttributes?: Record<string, unknown> | null;
  updatedAt: Date | string;
}

const newest = (dates: Array<Date | string>): Date =>
  new Date(Math.max(0, ...dates.map((d) => new Date(d).getTime())));

/**
 * Yazar sayfaları (`/yazar/<ad>`) ve dizin (`/yazar`): yalnızca yayında, dizine açık, herkese açık yazarlı içeriği olan
 * ve yazar sayfası gerçekten açılan (`authors` içinde kayıtlı) yazarlar. İçeriği olmayan yazar sayfası ince olduğundan girmez.
 */
export function authorSitemapEntries(items: readonly PublishedItem[], authors: Record<string, unknown>, locale: string): SitemapEntry[] {
  const latestBySlug = new Map<string, Date[]>();
  for (const item of items) {
    if (!isAuthoredType(item.type) || item.noIndex) continue;
    const pub = resolvePublishing(item.schemaAttributes);
    if (pub.visibility !== "public") continue;
    const owner = (pub.authorName || item.authorName || "").trim();
    if (!owner) continue;
    const slug = authorSlug(owner);
    if (!authors[slug]) continue;
    latestBySlug.set(slug, [...(latestBySlug.get(slug) ?? []), new Date(item.updatedAt)]);
  }
  if (latestBySlug.size === 0) return [];
  const out: SitemapEntry[] = [...latestBySlug.entries()].map(([slug, dates]) => ({
    contentId: `archive:author:${slug}`,
    type: "yazar",
    locale,
    region: "",
    slug,
    pathPrefix: "yazar",
    updatedAt: newest(dates),
  }));
  out.push({ contentId: "archive:authors", type: "yazar", locale, region: "", slug: "yazar", updatedAt: newest(out.map((e) => e.updatedAt)) });
  return out;
}

/**
 * Yerleşik liste sayfaları: `/kampanyalar` (en az bir etkin kampanya) ve `/sorular` (soru arşivi eklentisi açık ve en az bir soru sayfası).
 * `campaigns` ve `questions` yalnızca haritaya girecek (yayında, dizine açık) kayıtların güncelleme tarihleridir.
 */
export function builtInHubEntries(input: { campaignDates: Array<Date | string>; questionDates: Array<Date | string>; questionsArchiveOn: boolean; locale: string }): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  const { locale } = input;
  if (input.campaignDates.length > 0) out.push({ contentId: "archive:campaigns", type: "archive", locale, region: "", slug: "kampanyalar", updatedAt: newest(input.campaignDates) });
  if (input.questionsArchiveOn && input.questionDates.length > 0) out.push({ contentId: "archive:questions", type: "archive", locale, region: "", slug: "sorular", updatedAt: newest(input.questionDates) });
  return out;
}
