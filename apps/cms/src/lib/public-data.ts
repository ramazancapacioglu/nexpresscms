import "server-only";
import { resolvePublishing } from "@nexpress/core";
import { getScopedRepository, getSitemapRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/**
 * Ziyaretçi sayfalarının veritabanı okumaları. Hepsi `cachedRead` ile istekler arası
 * saklanır ve yönetim panelinden yapılan her yazmada düşer (`lib/cache.ts`).
 * Ticaret (stok, sepet) ve oturumlu veriler bilerek önbelleğe alınmaz.
 */
export const getPublicSite = cachedRead("site", (siteId: string) => getScopedRepository(siteId).getSite());

export const resolvePublicContent = cachedRead("resolve", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).resolveContentBySlug(slug, locale, { publicOnly: true })
);

export const getPublicContentBySlug = cachedRead("by-slug", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).getContentBySlug(slug, locale, { publicOnly: true })
);

/** Yayındaki içerikler; `private` görünürlüklü içerik hiçbir ziyaretçi/bot yüzeyine (llms, besleme, arama) girmez. */
export const listPublishedContents = cachedRead("published", async (siteId: string, locale: string) =>
  (await getScopedRepository(siteId).listContents({ locale, status: "published" })).filter(
    (c) => resolvePublishing(c.schemaAttributes).visibility !== "private"
  )
);

/** Bir içeriğin tüm dil çevirileri (hreflang ve dil değiştirici için); yayın filtresi çağıranda. */
export const getPublicTranslations = cachedRead("translations", (siteId: string, contentId: string) =>
  getScopedRepository(siteId).getTranslationsForContent(contentId)
);

export const getPublicNavigation = cachedRead("nav", (siteId: string, locale: string) =>
  getScopedRepository(siteId).getNavigationLayout(locale)
);

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
