/** Site haritasına girecek arşiv türleri. Etiket, noindex ise haritaya yazılmaz. */
export function sitemapArchiveTypes(seo: {
  sitemapIncludeCategories?: boolean;
  sitemapIncludeTags?: boolean;
  noIndexTagArchives?: boolean;
}): string[] {
  const types: string[] = [];
  if (seo.sitemapIncludeCategories !== false) types.push("kategori");
  if (seo.sitemapIncludeTags !== false && seo.noIndexTagArchives !== true) types.push("etiket");
  types.push("archive");
  return types;
}
