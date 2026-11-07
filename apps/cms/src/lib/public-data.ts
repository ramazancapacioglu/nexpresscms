import "server-only";
import { collectFormIds, isPrefixless, resolvePublishing, stripLocaleDeep, type BlockNode } from "@nexpress/core";
import { getFormDefinitionRepository, getScopedRepository, getSitemapRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/** `form_block`ların bağlı olduğu kurucu formlar (virgüllü kimlik listesi → kimlik → tanım); yönetim kaydında düşer. */
export const getPublicForms = cachedRead("forms", async (siteId: string, ids: string) => {
  const defs = await getFormDefinitionRepository(siteId).getMany(ids.split(",").filter(Boolean));
  return Object.fromEntries(defs.map((f) => [f.id, { id: f.id, name: f.name, status: f.status, spec: f.spec }]));
});

/**
 * Ziyaretçi sayfalarının veritabanı okumaları. Hepsi `cachedRead` ile istekler arası
 * saklanır ve yönetim panelinden yapılan her yazmada düşer (`lib/cache.ts`).
 * Ticaret (stok, sepet) ve oturumlu veriler bilerek önbelleğe alınmaz.
 */
export const getPublicSite = cachedRead("site", (siteId: string) => getScopedRepository(siteId).getSite());

/**
 * Tek dilli sitede kayıtlı `/{dil}/...` adresleri (blok bağlantıları, HTML href'leri) ziyaretçiye ön eksiz verilir.
 * Veri tabanındaki kayıt değişmez; yalnızca ziyaretçi okumasının çıktısı dönüştürülür.
 */
async function forVisitor<T>(siteId: string, locale: string, value: T): Promise<T> {
  const site = await getPublicSite(siteId);
  return isPrefixless(site, locale) ? stripLocaleDeep(value, locale) : value;
}

export const resolvePublicContent = cachedRead("resolve", async (siteId: string, slug: string, locale: string) =>
  forVisitor(siteId, locale, await getScopedRepository(siteId).resolveContentBySlug(slug, locale, { publicOnly: true }))
);

export const getPublicContentBySlug = cachedRead("by-slug", async (siteId: string, slug: string, locale: string) =>
  forVisitor(siteId, locale, await getScopedRepository(siteId).getContentBySlug(slug, locale, { publicOnly: true }))
);

/** Yayındaki içerikler; `private` görünürlüklü içerik hiçbir ziyaretçi/bot yüzeyine (llms, besleme, arama) girmez. */
export const listPublishedContents = cachedRead("published", async (siteId: string, locale: string) =>
  (await getScopedRepository(siteId).listContents({ locale, status: "published" })).filter(
    (c) => c.type !== "template" && resolvePublishing(c.schemaAttributes).visibility !== "private"
  )
);

/** Bir içeriğin tüm dil çevirileri (hreflang ve dil değiştirici için); yayın filtresi çağıranda. */
export const getPublicTranslations = cachedRead("translations", (siteId: string, contentId: string) =>
  getScopedRepository(siteId).getTranslationsForContent(contentId)
);

/** Dil başına yerleşim; o dil için kayıt yoksa varsayılan dilinki kullanılır (menü/header/footer boş kalmaz). */
export const getPublicNavigation = cachedRead("nav", async (siteId: string, locale: string) => {
  const repo = getScopedRepository(siteId);
  const own = await repo.getNavigationLayout(locale);
  if (own) return forVisitor(siteId, locale, own);
  const site = await repo.getSite();
  return site && site.defaultLocale !== locale ? repo.getNavigationLayout(site.defaultLocale) : null;
});

export const listPublicReviews = cachedRead("reviews", (siteId: string, contentId: string) =>
  getScopedRepository(siteId).listCommentsReviews(contentId)
);

export const listPublicEntityLinks = cachedRead("entity-links", (siteId: string) =>
  getScopedRepository(siteId).listEntityLinks()
);

export const listSitemapEntries = cachedRead("sitemap-entries", (siteId: string) =>
  getSitemapRepository(siteId).listEntries()
);

/** Medya kimliği -> odak noktası. Yalnızca varsayılan (50/50) dışındakiler; yük küçük kalır. */
export const getPublicMediaFocal = cachedRead("media-focal", async (siteId: string) => {
  const assets = await getScopedRepository(siteId).listMediaAssets();
  const map: Record<string, { x: number; y: number }> = {};
  for (const a of assets) {
    const f = a.focalPoint;
    if (f && (f.x !== 50 || f.y !== 50)) map[a.id] = { x: f.x, y: f.y };
  }
  return map;
});

/** Sayfa bloklarındaki bağlı formları yükler (yoksa boş nesne). */
export async function loadPageForms(siteId: string, blocks: BlockNode[]) {
  const ids = [...collectFormIds(blocks)].sort();
  return ids.length ? getPublicForms(siteId, ids.join(",")) : {};
}

export interface PublicWidgetFeed {
  categories: Array<{ id: string; name: string; slug: string; count: number; parentId: string | null }>;
  tags: Array<{ id: string; name: string; slug: string; count: number }>;
  recentPosts: Array<{ id: string; title: string; slug: string; featuredImage: string | null; dateLabel: string }>;
  recentComments: Array<{ id: string; authorName: string; body: string; rating: number }>;
  featuredProducts: Array<{ id: string; title: string; slug: string; priceLabel: string }>;
}

/** Kenar çubuğu (sidebar) ve footer bileşenlerinin (widget) ihtiyaç duyduğu özet dinamik veriler. */
export const getPublicWidgetFeed = cachedRead("widget-feed", async (siteId: string, locale: string): Promise<PublicWidgetFeed> => {
  const repo = getScopedRepository(siteId);
  const [taxonomies, contents, comments] = await Promise.all([
    repo.listTaxonomies(),
    repo.listContents({ locale, status: "published" }),
    repo.listCommentsReviews(),
  ]);

  const publicContents = contents.filter(
    (c) => c.type !== "template" && resolvePublishing(c.schemaAttributes).visibility !== "private"
  );

  const categories = taxonomies
    .filter((t) => t.taxonomyType === "category")
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      count: t.itemCount || 1,
      parentId: t.parentId ?? null,
    }));

  const tags = taxonomies
    .filter((t) => t.taxonomyType === "tag")
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      count: t.itemCount || 1,
    }));

  const recentPosts = publicContents
    .filter((c) => c.type === "post" || c.type === "kb_tech")
    .slice(0, 8)
    .map((p) => ({
      id: p.contentId,
      title: p.title,
      slug: p.slug,
      featuredImage: p.featuredImage ?? null,
      dateLabel: p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
        : "",
    }));

  const featuredProducts = publicContents
    .filter((c) => c.type === "product" || c.type === "campaign")
    .slice(0, 6)
    .map((p) => {
      const priceRaw = (p.schemaAttributes as Record<string, unknown>)?.price;
      return {
        id: p.contentId,
        title: p.title,
        slug: p.slug,
        priceLabel: priceRaw ? `₺${String(priceRaw)}` : "İncele",
      };
    });

  const recentComments = comments
    .filter((c) => c.status === "approved")
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      rating: c.rating ?? 5,
    }));

  return {
    categories,
    tags,
    recentPosts,
    recentComments,
    featuredProducts,
  };
});
