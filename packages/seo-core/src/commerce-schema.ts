/**
 * Mağaza ürün sayfaları için JSON-LD (saf): Product + Offer/AggregateOffer + BreadcrumbList.
 * Yalnızca gerçek veri yazılır: fiyatı olmayan ürün Offer üretmez, puan yalnızca onaylı gerçek yorumlardan gelir,
 * marka/GTIN gibi veride olmayan alanlar uydurulmaz.
 */
export interface ProductSchemaInput {
  baseUrl: string;
  url: string;
  name: string;
  /** Kısa açıklama; yoksa uzun açıklamanın düz metni */
  description: string;
  images: Array<string | null | undefined>;
  sku?: string | null;
  priceCents: number;
  currency: string;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  variants?: Array<{ sku?: string | null; priceCents: number }>;
  rating?: { value: number; count: number } | null;
  breadcrumbs: Array<{ name: string; url: string }>;
}

const AVAILABILITY = { instock: "https://schema.org/InStock", outofstock: "https://schema.org/OutOfStock", onbackorder: "https://schema.org/BackOrder" } as const;

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const price = (cents: number) => (cents / 100).toFixed(2);

/** Yerel medya başvurusunu taranabilir JPEG türevine çevirir; veri URI'leri ve göreli olmayan adresler atılır. */
export function schemaImageUrl(raw: string | null | undefined, baseUrl: string): string | null {
  if (!raw) return null;
  const base = baseUrl.replace(/\/$/, "");
  const local = /^\/media\/([A-Za-z0-9_-]{6,64})\?/.exec(raw);
  if (local) return `${base}/media/${local[1]}/1280.jpg`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return `${base}${raw}`;
  return null;
}

export function buildProductGraph(i: ProductSchemaInput): { "@context": "https://schema.org"; "@graph": Array<Record<string, unknown>> } {
  const id = `${i.url}#product`;
  const images = [...new Set(i.images.map((x) => schemaImageUrl(x, i.baseUrl)).filter((x): x is string => x !== null))].slice(0, 6);
  const currency = /^[A-Za-z]{3}$/.test(i.currency) ? i.currency.toUpperCase() : "";
  const prices = [i.priceCents, ...(i.variants ?? []).map((v) => v.priceCents)].filter((p) => Number.isFinite(p) && p > 0);
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const availability = AVAILABILITY[i.stockStatus];
  let offers: Record<string, unknown> | undefined;
  if (currency && prices.length > 0) {
    offers =
      lo !== hi
        ? { "@type": "AggregateOffer", lowPrice: price(lo), highPrice: price(hi), priceCurrency: currency, offerCount: (i.variants?.length ?? 0) + 1, availability, url: i.url }
        : { "@type": "Offer", price: price(lo), priceCurrency: currency, availability, url: i.url };
  }
  const product: Record<string, unknown> = {
    "@type": "Product",
    "@id": id,
    name: i.name,
    url: i.url,
    ...(plain(i.description) ? { description: plain(i.description).slice(0, 5000) } : {}),
    ...(images.length ? { image: images } : {}),
    ...(i.sku ? { sku: i.sku } : {}),
    ...(offers ? { offers } : {}),
    ...(i.rating && i.rating.count > 0 && i.rating.value >= 1 && i.rating.value <= 5 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(i.rating.value.toFixed(1)), reviewCount: i.rating.count, bestRating: 5, worstRating: 1 } } : {}),
  };
  const crumbs = i.breadcrumbs.filter((b) => b.name && b.url);
  const graph: Array<Record<string, unknown>> = [product];
  if (crumbs.length) {
    graph.push({ "@type": "BreadcrumbList", "@id": `${i.url}#breadcrumb`, itemListElement: crumbs.map((c, n) => ({ "@type": "ListItem", position: n + 1, name: c.name, item: c.url })) });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * JSON-LD'yi `<script>` içine güvenle basmak için serileştirir: `<`, `>`, `&` ve satır ayırıcılar kaçışlanır; içerikteki
 * `</script>` gibi bir dizi betik etiketini kapatıp sayfaya kod enjekte edemez. Ayrıştırıcıya göre değer aynıdır.
 */
export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
