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

/** `prefixless`: tek dilli sitede dil ön eki yoktur (`/hakkimizda`, ana sayfa `/`). */
export function entryPath(entry: Pick<SitemapEntry, "locale" | "slug" | "pathPrefix">, prefixless = false): string {
  // Slug URL parçası olarak kodlanır (boşluk, &, Unicode); XML kaçışı ayrıca uygulanır.
  const root = prefixless ? "" : `/${entry.locale}`;
  return entry.slug === "ana-sayfa"
    ? root || "/"
    : `${root}/${entry.pathPrefix ? `${entry.pathPrefix}/` : ""}${encodeURIComponent(entry.slug)}`;
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

/** W3C tarih-saat. Milisaniye bazı doğrulayıcılarda elenir; saniye ve `+00:00` kalır. */
export function sitemapLastMod(value: Date | string): string {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

const TYPE_LABEL: Record<string, string> = {
  page: "Sayfalar",
  post: "Yazılar",
  campaign: "Kampanyalar",
  product: "Ürünler",
  kategori: "Kategoriler",
  etiket: "Etiketler",
  archive: "Arşivler",
  ai_prompt: "Sorular",
  kb_tech: "Bilgi bankası",
};

export function sitemapTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type;
}

/** Bilinen tarayıcı gezintisi tablo ister. Arama motoru ve düz istek XML alır. */
const SITEMAP_BOT = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|applebot|petalbot|bytespider|ahrefs|semrush|mj12bot|facebookexternal|twitterbot|linkedinbot|gptbot|claudebot|amazonbot|perplexity|chrome-lighthouse|adsbot|mediapartners/i;

export function sitemapWantsHtml(input: { userAgent?: string | null; secFetchDest?: string | null; secFetchMode?: string | null }): boolean {
  const ua = input.userAgent ?? "";
  if (!ua || SITEMAP_BOT.test(ua)) return false;
  return input.secFetchDest === "document" && input.secFetchMode === "navigate";
}

export function buildSitemapIndex(baseUrl: string, files: SitemapFile[]): string {
  const items = files
    .map(
      (f) => `  <sitemap>
    <loc>${xmlEscape(`${baseUrl}/sitemaps/${sitemapFileName(f.type, f.page)}`)}</loc>
    <lastmod>${sitemapLastMod(latest(f.entries))}</lastmod>
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
  defaultLocale: string,
  prefixless = false
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
      const alternates = alternateLinks(group, baseUrl, defaultLocale, prefixless);
      return `  <url>
    <loc>${xmlEscape(baseUrl + entryPath(entry, prefixless))}</loc>
    <lastmod>${sitemapLastMod(entry.updatedAt)}</lastmod>${alternates}${entry.images?.length ? `\n${imageXml(entry.images, baseUrl)}` : ""}
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

/** Tek dilde hreflang satırı yeni bilgi vermez; iki ve daha fazla dilde karşılıklı bağ yazılır. */
function alternateLinks(group: SitemapEntry[], baseUrl: string, defaultLocale: string, prefixless: boolean): string {
  if (new Set(group.map((g) => hreflangOf(g))).size < 2) return "";
  const lines = group.map(
    (g) =>
      `    <xhtml:link rel="alternate" hreflang="${xmlEscape(hreflangOf(g))}" href="${xmlEscape(baseUrl + entryPath(g, prefixless))}" />`
  );
  const fallback = group.find((g) => g.locale === defaultLocale) ?? group[0]!;
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(baseUrl + entryPath(fallback, prefixless))}" />`);
  return `\n${lines.join("\n")}`;
}

const pageShell = (title: string, body: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>${xmlEscape(title)}</title>
<style>
body{margin:0;background:#f6f7f9;color:#14202b;font:15px/1.5 system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 20px 64px}
h1{font-size:22px;margin:0 0 8px}
p{margin:0 0 16px;color:#52616e}
a{color:#0b4f8a}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3e7ec}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #eef1f4;vertical-align:top}
th{font-size:12px;color:#52616e;font-weight:600}
td:last-child,th:last-child{white-space:nowrap}
</style>
</head>
<body><main>${body}</main></body>
</html>
`;

/** Tarayıcıda açılan dizin: alt haritalar bağlantıdır. Arama motoru XML ister. */
export function buildSitemapIndexPage(baseUrl: string, files: SitemapFile[]): string {
  const rows = files
    .map((f) => {
      const loc = `${baseUrl}/sitemaps/${sitemapFileName(f.type, f.page)}`;
      return `<tr><td>${xmlEscape(sitemapTypeLabel(f.type))}</td><td><a href="${xmlEscape(loc)}">${xmlEscape(loc)}</a></td><td>${f.entries.length}</td><td>${xmlEscape(sitemapLastMod(latest(f.entries)))}</td></tr>`;
    })
    .join("");
  return pageShell(
    "Site haritası",
    `<h1>Site haritası</h1><p>${files.length} harita. Arama motorları bu adresin XML biçimini okur.</p><table><thead><tr><th>Tür</th><th>Adres</th><th>Kayıt</th><th>Son güncelleme</th></tr></thead><tbody>${rows}</tbody></table>`
  );
}

/** Tarayıcıda açılan alt harita: her adres bağlantıdır. */
export function buildUrlsetPage(baseUrl: string, file: SitemapFile, prefixless = false): string {
  const rows = file.entries
    .map((entry) => {
      const loc = baseUrl + entryPath(entry, prefixless);
      return `<tr><td><a href="${xmlEscape(loc)}">${xmlEscape(loc)}</a></td><td>${entry.images?.length ?? 0}</td><td>${xmlEscape(sitemapLastMod(entry.updatedAt))}</td></tr>`;
    })
    .join("");
  return pageShell(
    sitemapTypeLabel(file.type),
    `<h1>${xmlEscape(sitemapTypeLabel(file.type))}</h1><p><a href="${xmlEscape(baseUrl)}/sitemap.xml">Site haritasına dön</a> · ${file.entries.length} adres</p><table><thead><tr><th>Adres</th><th>Görsel</th><th>Son güncelleme</th></tr></thead><tbody>${rows}</tbody></table>`
  );
}
