/** Site haritasına girecek arşiv türleri. Etiket, noindex ise haritaya yazılmaz. */
export function sitemapArchiveTypes(seo: {
  sitemapIncludeCategories?: boolean;
  sitemapIncludeTags?: boolean;
  sitemapIncludeAuthors?: boolean;
  noIndexTagArchives?: boolean;
}): string[] {
  const types: string[] = [];
  if (seo.sitemapIncludeCategories !== false) types.push("kategori");
  if (seo.sitemapIncludeTags !== false && seo.noIndexTagArchives !== true) types.push("etiket");
  if (seo.sitemapIncludeAuthors !== false) types.push("yazar");
  types.push("archive");
  return types;
}
