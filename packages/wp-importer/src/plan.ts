import type { BlockNode, ContentType } from "@nexpress/core";
import { slugify } from "@nexpress/seo-core";
import { convertWpHtml } from "./html";
import type { WxrDocument, WxrItem, WxrTerm } from "./wxr";

export type ImportableType = "post" | "page" | "product";

export interface ImportOptions {
  locale: string;
  types: ImportableType[];
  includeDrafts: boolean;
}

export interface PlannedItem {
  wpId: string;
  wpType: ImportableType;
  contentType: ContentType;
  schemaType: string;
  status: "published" | "draft";
  visibility: "public" | "private";
  title: string;
  slug: string;
  excerpt: string;
  tldr: string;
  blocks: BlockNode[];
  images: string[];
  featuredImageUrl: string;
  date: Date | null;
  authorName: string;
  categories: string[];
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  noIndex: boolean;
  /** Eski adresin yolu (yönlendirme kaynağı); yoksa "" */
  oldPath: string;
  warnings: string[];
  strippedShortcodes: number;
}

export interface ImportPlan {
  siteTitle: string;
  baseUrl: string;
  items: PlannedItem[];
  terms: WxrTerm[];
  /** İçe alınmayan öğeler: neden → adet (ör. "tür: elementor_library") */
  skipped: Record<string, number>;
  /** Tekil görsel adresleri (içeriklerde + öne çıkan) */
  imageUrls: string[];
  totals: { posts: number; pages: number; products: number; drafts: number; attachments: number; shortcodes: number };
  warnings: string[];
}

const TYPE_MAP: Record<ImportableType, { contentType: ContentType; schemaType: string; importance: number }> = {
  post: { contentType: "post", schemaType: "Article", importance: 6 },
  page: { contentType: "page", schemaType: "WebPage", importance: 7 },
  product: { contentType: "product", schemaType: "Product", importance: 8 },
};

const TEMPLATE_VAR = /%%|%[a-z_]+%/i;
const clean = (s: string | undefined) => (s && !TEMPLATE_VAR.test(s) ? s.trim() : "");
const plainText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function decodeSlug(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function pathOf(link: string): string {
  try {
    const u = new URL(link);
    return u.search && !u.pathname.replace(/\//g, "") ? "" : u.pathname; // ?p=123 biçimi yönlendirilemez
  } catch {
    return link.startsWith("/") ? link.split("?")[0]! : "";
  }
}

export function buildPlan(doc: WxrDocument, options: ImportOptions): ImportPlan {
  const skipped: Record<string, number> = {};
  const skip = (why: string) => { skipped[why] = (skipped[why] ?? 0) + 1; };
  const attachments = new Map(doc.items.filter((i) => i.type === "attachment").map((a) => [a.id, a.attachmentUrl]));
  const warnings: string[] = [];
  const items: PlannedItem[] = [];
  const imageUrls = new Set<string>();
  const totals = { posts: 0, pages: 0, products: 0, drafts: 0, attachments: attachments.size, shortcodes: 0 };

  for (const it of doc.items) {
    if (it.type === "attachment") continue;
    const type = it.type as ImportableType;
    if (!(type in TYPE_MAP)) { skip(`tür: ${it.type || "bilinmeyen"}`); continue; }
    if (!options.types.includes(type)) { skip(`seçilmedi: ${type}`); continue; }
    const published = it.status === "publish" || it.status === "private";
    const draftLike = it.status === "draft" || it.status === "pending" || it.status === "future" || it.status === "auto-draft";
    if (!published && !draftLike) { skip(`durum: ${it.status || "bilinmeyen"}`); continue; }
    if (draftLike && !options.includeDrafts) { skip("taslaklar (seçilmedi)"); continue; }

    const conv = convertWpHtml(it.contentHtml, { baseUrl: doc.baseUrl });
    const m = TYPE_MAP[type];
    const title = plainText(it.title) || `İçerik ${it.id}`;
    const slug = slugify(decodeSlug(it.postName) || title, options.locale).slice(0, 100) || `icerik-${it.id}`;
    const excerpt = plainText(it.excerptHtml).slice(0, 300);
    const featured = attachments.get(it.meta._thumbnail_id ?? "") ?? "";
    const itemWarnings = [...conv.warnings];
    if (it.status === "future") itemWarnings.push("Zamanlanmış yayın taslak olarak alındı.");
    if (type === "product") itemWarnings.push("Ürün fiyat, stok ve varyasyon verisi aktarılmaz; yalnızca içerik alınır.");
    for (const u of conv.images) imageUrls.add(u);
    if (featured) imageUrls.add(featured);
    totals[type === "post" ? "posts" : type === "page" ? "pages" : "products"]++;
    if (draftLike) totals.drafts++;
    totals.shortcodes += conv.strippedShortcodes;

    items.push({
      wpId: it.id,
      wpType: type,
      contentType: m.contentType,
      schemaType: m.schemaType,
      status: published ? "published" : "draft",
      visibility: it.status === "private" ? "private" : "public",
      title,
      slug,
      excerpt,
      tldr: (conv.firstParagraph || excerpt).slice(0, 260),
      blocks: conv.blocks,
      images: conv.images,
      featuredImageUrl: featured,
      date: it.date,
      authorName: it.author,
      categories: it.categories.filter((c) => c !== "uncategorized"),
      tags: it.tags,
      metaTitle: clean(it.meta._yoast_wpseo_title) || clean(it.meta.rank_math_title),
      metaDescription: clean(it.meta._yoast_wpseo_metadesc) || clean(it.meta.rank_math_description),
      focusKeyword: clean(it.meta._yoast_wpseo_focuskw) || clean(it.meta.rank_math_focus_keyword),
      noIndex: it.meta["_yoast_wpseo_meta-robots-noindex"] === "1",
      oldPath: pathOf(it.link),
      warnings: itemWarnings,
      strippedShortcodes: conv.strippedShortcodes,
    });
  }

  const slugCount = new Map<string, number>();
  for (const i of items) slugCount.set(`${i.contentType}:${i.slug}`, (slugCount.get(`${i.contentType}:${i.slug}`) ?? 0) + 1);
  if ([...slugCount.values()].some((n) => n > 1)) warnings.push("Aynı adresi paylaşan içerikler var; içe aktarmada sonuna sayı eklenir.");
  const usedTerms = new Set(items.flatMap((i) => [...i.categories, ...i.tags]));
  const terms = doc.terms.filter((t) => usedTerms.has(t.slug) || t.kind === "category").filter((t) => t.slug !== "uncategorized");
  return { siteTitle: doc.siteTitle, baseUrl: doc.baseUrl, items, terms, skipped, imageUrls: [...imageUrls], totals, warnings };
}

export type { WxrItem };
