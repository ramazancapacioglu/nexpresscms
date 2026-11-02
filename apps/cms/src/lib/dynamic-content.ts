import "server-only";
import { collectDynamicBlocks, normalizeDynamicQuery, resolvePublishing, selectDynamicItems, type BlockNode, type DynamicCandidate, type DynamicDataMap } from "@nexpress/core";
import { getCommerceRepository } from "@nexpress/database";
import { cachedRead } from "./cache";
import { listPublishedContents } from "./public-data";

const money = (cents: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
};

/** Dinamik listelerin aday havuzu: yalnızca herkese açık, dizine açık yayınlar ve yayındaki ürünler (yönetim kaydında düşer). */
export const getDynamicCandidates = cachedRead("dynamic-candidates", async (siteId: string, locale: string): Promise<DynamicCandidate[]> => {
  const [contents, products] = await Promise.all([
    listPublishedContents(siteId, locale),
    getCommerceRepository(siteId).listProducts({ status: "published" }).catch(() => []),
  ]);
  const out: DynamicCandidate[] = [];
  for (const c of contents) {
    const pub = resolvePublishing(c.schemaAttributes);
    if (c.noIndex || pub.visibility !== "public" || c.slug === "ana-sayfa") continue;
    const kind = c.type === "post" ? "posts" : c.type === "page" ? "pages" : null;
    if (!kind) continue;
    out.push({
      id: c.contentId,
      kind,
      title: c.title,
      url: `/${locale}/${c.slug}`,
      excerpt: (c.tldr || c.excerpt || c.metaDescription || "").slice(0, 220),
      image: pub.featuredImageUrl || c.featuredImage || null,
      imageAlt: pub.featuredImageAlt || "",
      date: new Date(c.publishedAt ?? c.createdAt).toISOString(),
      categories: pub.categories,
      tags: pub.tags,
    });
  }
  for (const p of products) {
    out.push({
      id: p.id,
      kind: "products",
      title: p.name,
      url: `/${locale}/magaza/${p.slug}`,
      excerpt: p.shortDescription.slice(0, 220),
      image: p.imageUrl,
      date: p.updatedAt.toISOString(),
      categories: [],
      tags: [],
      price: money(p.priceCents, p.currency, locale),
    });
  }
  return out;
});

/** Sayfadaki `dynamic_list` blokları için öğeleri çözer; blok yoksa veritabanına hiç dokunmaz. */
export async function loadDynamicData(siteId: string, locale: string, blocks: BlockNode[], currentContentId?: string | null): Promise<DynamicDataMap> {
  const found = collectDynamicBlocks(blocks);
  if (found.length === 0) return {};
  const candidates = await getDynamicCandidates(siteId, locale);
  return Object.fromEntries(found.map((b) => [b.id, selectDynamicItems(candidates, normalizeDynamicQuery(b.props), currentContentId)]));
}
