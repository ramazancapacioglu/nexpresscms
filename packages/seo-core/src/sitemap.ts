/**
 * Parçalı site haritası: `/sitemap.xml` bir indekstir, adresler `/sitemaps/{tür}-{sayfa}.xml`
 * dosyalarına bölünür. Saf işlevlerdir; veritabanı ve HTTP bilmez.
 */
export const SITEMAP_PAGE_SIZE = 10_000;

/** Görsel site haritası öğesi (`image:image`): sayfadaki görseller Google Görseller'e bildirilir. */
export interface SitemapImage {
  /** Site köküne göre (/media/…) ya da mutlak adres */
  loc: string;
  title?: string;
  caption?: string;
}

export interface SitemapEntry {
  contentId: string;
  type: string;
  locale: string;
  region: string;
  slug: string;
  updatedAt: Date;
  images?: SitemapImage[];
  /** Slug'dan önce gelen sabit yol parçası (kategori/etiket arşivleri: `kategori`, `etiket`) */
  pathPrefix?: string;
}

/** Bir sayfada bildirilecek en çok görsel (protokol sınırı 1000; kalabalığı önlemek için daha düşük). */
export const SITEMAP_MAX_IMAGES = 50;

/**
 * Bloklardan ve öne çıkan görselden site haritası görselleri. Yalnızca `/…` veya http(s) adresleri; veri URI'leri atlanır;
 * yinelenenler tek kez. Yerel medya başvurusu (`/media/{id}?w=…`) taranabilir WebP türevine çevrilir.
 */
export function collectSitemapImages(
  blocks: Array<{ type: string; props?: Record<string, unknown> | null; children?: unknown }>,
  featured: string | null | undefined
): SitemapImage[] {
  const out: SitemapImage[] = [];
  const seen = new Set<string>();
  const add = (url: unknown, title?: unknown, caption?: unknown) => {
    if (typeof url !== "string") return;
    const local = /^\/media\/([A-Za-z0-9_-]{6,64})\?/.exec(url);
    const loc = local ? `/media/${local[1]}/1280.webp` : /^(https?:\/\/|\/(?!\/))/i.test(url) && !/^\/media\//.test(url) ? url : "";
    if (!loc || seen.has(loc) || out.length >= SITEMAP_MAX_IMAGES) return;
    seen.add(loc);
    out.push({ loc, ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}), ...(typeof caption === "string" && caption.trim() ? { caption: caption.trim() } : {}) });
  };
  add(featured);
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const b of list as Array<{ type?: string; props?: Record<string, unknown> | null; children?: unknown }>) {
      const p = b.props ?? {};
      if (b.type === "image_figure") add(p.url, p.titleText, p.caption || p.altText);
      walk(b.children);
    }
  };
  walk(blocks);
  return out;
}

const imageXml = (images: SitemapImage[] | undefined, baseUrl: string) =>
  (images ?? [])
    .map((i) => {
      const abs = i.loc.startsWith("/") ? baseUrl + i.loc : i.loc;
      return `    <image:image>
      <image:loc>${xmlEscape(abs)}</image:loc>${i.title ? `\n      <image:title>${xmlEscape(i.title)}</image:title>` : ""}${i.caption ? `\n      <image:caption>${xmlEscape(i.caption)}</image:caption>` : ""}
    </image:image>`;
    })
    .join("\n");

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

export function entryPath(entry: Pick<SitemapEntry, "locale" | "slug" | "pathPrefix">): string {
  // Slug URL parçası olarak kodlanır (boşluk, &, Unicode); XML kaçışı ayrıca uygulanır.
  return entry.slug === "ana-sayfa"
    ? `/${entry.locale}`
    : `/${entry.locale}/${entry.pathPrefix ? `${entry.pathPrefix}/` : ""}${encodeURIComponent(entry.slug)}`;
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
${alternates.join("\n")}${entry.images?.length ? `\n${imageXml(entry.images, baseUrl)}` : ""}
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}
