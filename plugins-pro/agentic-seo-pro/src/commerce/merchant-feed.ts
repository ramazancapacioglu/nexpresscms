import { xmlEscape } from "../xml";

/** Google Merchant Center ürün beslemesi (RSS 2.0 + g: alanları). Saf: veritabanı ve HTTP bilmez. */
export interface MerchantProduct {
  id: string;
  sku: string;
  name: string;
  shortDescription: string;
  descriptionHtml: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  imageUrl: string | null;
  galleryUrls: string[];
}

export interface MerchantFeedInput {
  siteName: string;
  baseUrl: string;
  locale: string;
  products: MerchantProduct[];
}

const AVAILABILITY: Record<MerchantProduct["stockStatus"], string> = { instock: "in_stock", outofstock: "out_of_stock", onbackorder: "backorder" };

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
export const money = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

const absolute = (url: string, base: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/") || url.startsWith("//")) return "";
  // Yerel medya başvurusu (/media/{id}?w=…) taranabilir JPEG türevine çevrilir
  const m = /^\/media\/([A-Za-z0-9_-]{6,64})\?/.exec(url);
  return base + (m ? `/media/${m[1]}/1280.jpg` : url);
};

export interface MerchantSkip {
  id: string;
  reason: string;
}

/** Beslemeye girebilecek ürünler ve girmeyenlerin nedeni (Merchant reddetmeden önce yöneticiye gösterilir). */
export function selectMerchantProducts(products: MerchantProduct[], baseUrl: string): { ok: MerchantProduct[]; skipped: MerchantSkip[] } {
  const ok: MerchantProduct[] = [];
  const skipped: MerchantSkip[] = [];
  for (const p of products) {
    if (p.priceCents <= 0) skipped.push({ id: p.id, reason: "Fiyat 0 veya eksik" });
    else if (!p.imageUrl || !absolute(p.imageUrl, baseUrl)) skipped.push({ id: p.id, reason: "Görsel yok" });
    else if (!(plain(p.shortDescription) || plain(p.descriptionHtml))) skipped.push({ id: p.id, reason: "Açıklama yok" });
    else if (!p.name.trim()) skipped.push({ id: p.id, reason: "Ad yok" });
    else if (!/^[A-Za-z]{3}$/.test(p.currency)) skipped.push({ id: p.id, reason: "Para birimi geçersiz" });
    else ok.push(p);
  }
  return { ok, skipped };
}

export function buildMerchantFeed(input: MerchantFeedInput): string {
  const base = input.baseUrl.replace(/\/$/, "");
  const { ok } = selectMerchantProducts(input.products, base);
  const items = ok
    .map((p) => {
      const onSale = p.compareAtCents !== null && p.compareAtCents > p.priceCents;
      const extra = p.galleryUrls.map((u) => absolute(u, base)).filter(Boolean).slice(0, 10);
      return `    <item>
      <g:id>${xmlEscape(p.sku || p.id)}</g:id>
      <g:title>${xmlEscape(p.name.trim().slice(0, 150))}</g:title>
      <g:description>${xmlEscape((plain(p.shortDescription) || plain(p.descriptionHtml)).slice(0, 5000))}</g:description>
      <g:link>${xmlEscape(`${base}/${input.locale}/magaza/${p.slug}`)}</g:link>
      <g:image_link>${xmlEscape(absolute(p.imageUrl!, base))}</g:image_link>${extra.map((u) => `\n      <g:additional_image_link>${xmlEscape(u)}</g:additional_image_link>`).join("")}
      <g:availability>${AVAILABILITY[p.stockStatus]}</g:availability>
      <g:price>${money(onSale ? p.compareAtCents! : p.priceCents, p.currency)}</g:price>${onSale ? `\n      <g:sale_price>${money(p.priceCents, p.currency)}</g:sale_price>` : ""}
      <g:condition>new</g:condition>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(input.siteName)}</title>
    <link>${xmlEscape(`${base}/${input.locale}`)}</link>
    <description>${xmlEscape(`${input.siteName} ürün beslemesi`)}</description>
${items}
  </channel>
</rss>
`;
}
