/**
 * Parçalı site haritası: `/sitemap.xml` bir indekstir, adresler `/sitemaps/{tür}-{sayfa}.xml`
 * dosyalarına bölünür. Saf işlevlerdir; veritabanı ve HTTP bilmez.
 */
export const SITEMAP_PAGE_SIZE = 10_000;

export interface SitemapEntry {
  contentId: string;
  type: string;
  locale: string;
  region: string;
  slug: string;
  updatedAt: Date;
}

export interface SitemapFile {
  type: string;
  page: number;
  entries: SitemapEntry[];
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function entryPath(entry: Pick<SitemapEntry, "locale" | "slug">): string {
  // Slug URL parçası olarak kodlanır (boşluk, &, Unicode); XML kaçışı ayrıca uygulanır.
  return entry.slug === "ana-sayfa"
    ? `/${entry.locale}`
    : `/${entry.locale}/${encodeURIComponent(entry.slug)}`;
}

export function hreflangOf(entry: Pick<SitemapEntry, "locale" | "region">): string {
  // Bölge yoksa yalnızca dil (ör. `en`); varsa `tr-TR` biçimi
  return entry.region ? `${entry.locale}-${entry.region.toUpperCase()}` : entry.locale;
}

export function sitemapFileName(type: string, page: number): string {
  return `${type}-${page}.xml`;
}

/** `kb_tech-2.xml` -> `{ type: "kb_tech", page: 2 }`; geçersizse `null`. */
export function parseSitemapFileName(name: string): { type: string; page: number } | null {
  const match = /^([a-z0-9_]+)-([1-9][0-9]*)\.xml$/.exec(name);
  return match ? { type: match[1]!, page: Number(match[2]) } : null;
}

/** İzinli türlere göre süzer, tür başına sabit sırayla `pageSize` büyüklüğünde dosyalara böler. */
export function splitIntoFiles(
  entries: SitemapEntry[],
  allowedTypes: readonly string[],
  pageSize = SITEMAP_PAGE_SIZE
): SitemapFile[] {
  const allowed = new Set(allowedTypes);
  const byType = new Map<string, SitemapEntry[]>();
  for (const entry of entries) {
    if (!allowed.has(entry.type)) continue;
    const list = byType.get(entry.type) ?? [];
    list.push(entry);
    byType.set(entry.type, list);
  }
  const files: SitemapFile[] = [];
  for (const type of [...byType.keys()].sort()) {
    const sorted = byType.get(type)!.sort((a, b) => entryPath(a).localeCompare(entryPath(b)));
    for (let i = 0; i < sorted.length; i += pageSize) {
      files.push({ type, page: i / pageSize + 1, entries: sorted.slice(i, i + pageSize) });
    }
  }
  return files;
}

const latest = (entries: SitemapEntry[]): Date =>
  new Date(Math.max(...entries.map((e) => new Date(e.updatedAt).getTime())));

export function buildSitemapIndex(baseUrl: string, files: SitemapFile[]): string {
  const items = files
    .map(
      (f) => `  <sitemap>
    <loc>${xmlEscape(`${baseUrl}/sitemaps/${sitemapFileName(f.type, f.page)}`)}</loc>
    <lastmod>${latest(f.entries).toISOString()}</lastmod>
  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

/**
 * `allEntries` tüm dillerin tamamını içermelidir (yalnızca bu dosyanınkini değil):
 * karşılıklı `hreflang` başka dosyadaki çevirilere de bağlanır.
 */
export function buildUrlset(
  baseUrl: string,
  file: SitemapFile,
  allEntries: SitemapEntry[],
  defaultLocale: string
): string {
  const byContent = new Map<string, SitemapEntry[]>();
  for (const e of allEntries) {
    const list = byContent.get(e.contentId) ?? [];
    list.push(e);
    byContent.set(e.contentId, list);
  }
  const urls = file.entries
    .map((entry) => {
      const group = byContent.get(entry.contentId) ?? [entry];
      const alternates = group.map(
        (g) =>
          `    <xhtml:link rel="alternate" hreflang="${xmlEscape(hreflangOf(g))}" href="${xmlEscape(baseUrl + entryPath(g))}" />`
      );
      const fallback = group.find((g) => g.locale === defaultLocale) ?? group[0]!;
      alternates.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(baseUrl + entryPath(fallback))}" />`
      );
      return `  <url>
    <loc>${xmlEscape(baseUrl + entryPath(entry))}</loc>
    <lastmod>${new Date(entry.updatedAt).toISOString()}</lastmod>
${alternates.join("\n")}
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
