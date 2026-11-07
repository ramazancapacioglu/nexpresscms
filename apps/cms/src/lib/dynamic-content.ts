import "server-only";
import {
  collectDynamicBlocks,
  localeBase,
  normalizeDynamicQuery,
  resolveDynamicBlock,
  resolvePublishing,
  resolveCampaignData,
  type BlockNode,
  type DynamicCandidate,
  type DynamicDataMap,
} from "@nexpress/core";
import { getCommerceRepository } from "@nexpress/database";
import { cachedRead } from "./cache";
import { getPublicSite, listPublishedContents } from "./public-data";

const money = (cents: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
};

/** Dinamik listelerin aday havuzu: yalnızca herkese açık, dizine açık yayınlar, kampanyalar ve yayındaki ürünler (yönetim kaydında düşer). */
export const getDynamicCandidates = cachedRead("dynamic-candidates", async (siteId: string, locale: string): Promise<DynamicCandidate[]> => {
  const [site, contents, products] = await Promise.all([
    getPublicSite(siteId),
    listPublishedContents(siteId, locale),
    getCommerceRepository(siteId).listProducts({ status: "published" }).catch(() => []),
  ]);
  const base = localeBase(site, locale);
  const out: DynamicCandidate[] = [];
  for (const c of contents) {
    const pub = resolvePublishing(c.schemaAttributes);
    if (c.noIndex || pub.visibility !== "public" || c.slug === "ana-sayfa") continue;

    const isCampaign =
      c.type === "campaign" ||
      Boolean(
        c.schemaAttributes?.camp_discount ||
        c.schemaAttributes?.camp_name ||
        (c.schemaAttributes?.campaign as Record<string, unknown> | undefined)?.discount
      );

    if (isCampaign) {
      const camp = resolveCampaignData(c);
      out.push({
        id: c.contentId,
        kind: "campaigns",
        title: camp.title || c.title,
        url: `${base}/kampanya/${camp.slug || c.slug}`,
        excerpt: (camp.tldr || c.tldr || c.excerpt || c.metaDescription || "").slice(0, 220),
        image: camp.featuredImageUrl || pub.featuredImageUrl || c.featuredImage || null,
        imageAlt: camp.featuredImageAlt || pub.featuredImageAlt || "",
        date: new Date(c.publishedAt ?? c.createdAt).toISOString(),
        categories: pub.categories,
        tags: pub.tags,
        badge: camp.badge,
        discount: camp.discount,
        gift: camp.gift,
        daysRemaining: camp.daysRemaining,
        isExpired: camp.isExpired,
        ctaText: camp.ctaText,
        ctaUrl: camp.ctaUrl,
        contactWhatsapp: camp.contactWhatsapp,
        contactPhone: camp.contactPhone,
      });
      continue;
    }

    const kind = c.type === "post" ? "posts" : c.type === "page" ? "pages" : null;
    if (!kind) continue;
    out.push({
      id: c.contentId,
      kind,
      title: c.title,
      url: `${base}/${c.slug}`,
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
      url: `${base}/magaza/${p.slug}`,
      excerpt: p.shortDescription.slice(0, 220),
      image: p.imageUrl,
      date: p.updatedAt.toISOString(),
      categories: [],
      tags: [],
      price: money(p.priceCents, p.currency, locale),
      priceCents: p.priceCents,
    });
  }
  return out;
});

/** Sayfadaki `dynamic_list` ve `campaign_showcase` blokları için öğeleri çözer; blok yoksa veritabanına hiç dokunmaz. */
export async function loadDynamicData(
  siteId: string,
  locale: string,
  blocks: BlockNode[],
  currentContentId?: string | null,
  params: Record<string, string | string[] | undefined> = {}
): Promise<DynamicDataMap> {
  const found = collectDynamicBlocks(blocks);
  if (found.length === 0) return {};
  const candidates = await getDynamicCandidates(siteId, locale);

  return Object.fromEntries(
    found.map((b) => {
      if (b.type === "campaign_showcase") {
        const p = b.props ?? {};
        const filter = p.filter === "all" ? "all" : "active";
        const limit = Math.min(24, Math.max(1, Number(p.limit) || 6));
        const campCandidates = candidates.filter((c) => {
          if (c.kind !== "campaigns") return false;
          if (filter === "active" && c.isExpired) return false;
          return true;
        });
        const items = campCandidates.slice(0, limit);
        return [
          b.id,
          {
            items,
            meta: {
              key: b.id,
              total: campCandidates.length,
              page: 1,
              pages: 1,
              q: "",
              cat: "",
              sort: "newest",
              keep: "",
            },
          },
        ];
      }
      return [
        b.id,
        resolveDynamicBlock(candidates, normalizeDynamicQuery(b.props), params, b.id, currentContentId),
      ];
    })
  );
}
