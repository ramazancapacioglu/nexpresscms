import "server-only";
import { resolveMenuTree, type MenuLookup, type NavigationMenuItem } from "@nexpress/core";
import { getCommerceRepository, getScopedRepository } from "@nexpress/database";
import { cachedRead } from "./cache";
import { getPublicNavigation, listPublishedContents } from "./public-data";

/** Menü bağlantılarını çözmek için kimlik → slug eşlemeleri (ziyaretçi; yönetim kaydında düşer). */
export const getMenuLookup = cachedRead("menu-lookup", async (siteId: string, locale: string): Promise<MenuLookup> => {
  const repo = getScopedRepository(siteId);
  const [contents, taxonomies, products] = await Promise.all([
    listPublishedContents(siteId, locale),
    repo.listTaxonomies(),
    getCommerceRepository(siteId).listProducts({ status: "published" }).catch(() => []),
  ]);
  return {
    locale,
    contents: Object.fromEntries(contents.map((c) => [c.contentId, { slug: c.slug, published: true }])),
    taxonomies: Object.fromEntries(taxonomies.map((t) => [t.id, { slug: t.slug, type: t.taxonomyType }])),
    products: Object.fromEntries(products.map((p) => [p.id, { slug: p.slug, published: true }])),
  };
});

/** Ziyaretçi için çözülmüş menü: güncel adresler, hedefi olmayan öğeler elenmiş. */
export async function getResolvedMenu(siteId: string, locale: string): Promise<NavigationMenuItem[]> {
  const [nav, lookup] = await Promise.all([getPublicNavigation(siteId, locale), getMenuLookup(siteId, locale)]);
  return resolveMenuTree(nav?.menuItems ?? [], lookup);
}
