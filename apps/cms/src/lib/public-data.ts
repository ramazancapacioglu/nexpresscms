import "server-only";
import { collectFormIds, resolvePublishing, type BlockNode } from "@nexpress/core";
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

export const resolvePublicContent = cachedRead("resolve", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).resolveContentBySlug(slug, locale, { publicOnly: true })
);

export const getPublicContentBySlug = cachedRead("by-slug", (siteId: string, slug: string, locale: string) =>
  getScopedRepository(siteId).getContentBySlug(slug, locale, { publicOnly: true })
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
  if (own) return own;
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
