import "server-only";
import { getScopedRepository, getSitemapRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/**
 * Ziyaretçi sayfalarının veritabanı okumaları. Hepsi `cachedRead` ile istekler arası
 * saklanır ve yönetim panelinden yapılan her yazmada düşer (`lib/cache.ts`).
 * Ticaret (stok, sepet) ve oturumlu veriler bilerek önbelleğe alınmaz.
 */
export const getPublicSite = cachedRead("site", (siteId: string) => getScopedRepository(siteId).getSite());

export const resolvePublicContent = cachedRead("resolve", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).resolveContentBySlug(slug, locale)
);

export const getPublicContentBySlug = cachedRead("by-slug", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).getContentBySlug(slug, locale)
);

export const listPublishedContents = cachedRead("published", (siteId: string, locale: string) =>
  getScopedRepository(siteId).listContents({ locale, status: "published" })
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
