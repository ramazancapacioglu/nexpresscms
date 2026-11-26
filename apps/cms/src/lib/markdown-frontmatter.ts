/**
 * `?format=md` / `Accept: text/markdown` yanıtının ön bilgisi (YAML) ve kanonik bağlantı başlığı.
 *
 * Yalnızca ziyaretçiye ve yapay zeka istemcisine yararlı, doğrulanabilir alanlar yazılır. İçerideki düzenleme
 * puanları (`seoScore`, `importanceScore`) ve kiracı kimliği asla dışarı verilmez (Kural 9: ön yüzde yapay puan yok).
 */

export interface MarkdownFrontmatterInput {
  title: string;
  slug: string;
  locale: string;
  region?: string | null;
  type: string;
  schemaType?: string | null;
  /** Aynı içeriğin HTML sayfasının mutlak adresi (kanonik) */
  url: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  /** Kampanya gibi türe özgü ek satırlar (`anahtar: "değer"`) */
  extraLines?: string[];
}

const q = (value: string): string => JSON.stringify(value);

function isoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** `---` çitleriyle çevrili YAML ön bilgisi; sonunda boş satır YOKTUR (çağıran ekler). */
export function buildMarkdownFrontmatter(input: MarkdownFrontmatterInput): string {
  const published = isoDate(input.publishedAt);
  const updated = isoDate(input.updatedAt);
  return [
    "---",
    `title: ${q(input.title)}`,
    `slug: ${q(input.slug)}`,
    `url: ${q(input.url)}`,
    `locale: ${q(input.region ? `${input.locale}-${input.region}` : input.locale)}`,
    `type: ${q(input.type)}`,
    ...(input.schemaType ? [`schema_type: ${q(input.schemaType)}`] : []),
    ...(published ? [`published: ${q(published)}`] : []),
    ...(updated ? [`updated: ${q(updated)}`] : []),
    ...(input.extraLines ?? []),
    "---",
  ].join("\n");
}

/**
 * Markdown karşılığı HTML sayfasının kopyasıdır: arama motorları ikinci bir dizin kaydı açmasın diye
 * `Link: <kanonik>; rel="canonical"` başlığı eklenir (RFC 8288; Google HTML dışı yanıtlarda da bu başlığı okur).
 */
export function markdownCanonicalLink(url: string): string {
  return `<${url}>; rel="canonical"`;
}

/** HTML sayfasının mutlak adresi: tek dilde `lb` boştur; ana sayfa köke (`lb || "/"`) gider. */
export function markdownCanonicalUrl(origin: string, localeBase: string, segments: string[]): string {
  const base = origin.replace(/\/+$/, "");
  const rest = segments.filter(Boolean);
  return rest.length === 0 ? `${base}${localeBase || "/"}` : `${base}${localeBase}/${rest.join("/")}`;
}
