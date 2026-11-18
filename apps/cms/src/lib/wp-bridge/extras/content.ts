import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { truncateSmart } from "@nexpress/seo-core";
import { parsePublicHead, paletteFromHtml, pickPageSoftware, plainText, schemaFromBridge } from "@nexpress/wp-importer";
import { ingestImages, remapContentImages } from "../media";
import { readMediaMap } from "../store";
import { compileBlocks } from "../live-import";
import { formRefsOf, rebindFormBlocks } from "./forms";
import { wpAll, type WpSession } from "./session";

interface WpPost {
  id: number;
  slug: string;
  status: string;
  link: string;
  date?: string;
  author?: number;
  title?: { raw?: string };
  excerpt?: { raw?: string };
  content?: { raw?: string; rendered?: string };
  categories?: number[];
  tags?: number[];
}

interface WpTerm {
  id: number;
  slug: string;
}

const COLLECTIONS: Array<{ rest: string; kind: "page" | "post" | "ai_prompt" }> = [
  { rest: "pages", kind: "page" },
  { rest: "posts", kind: "post" },
  { rest: "ai_prompt", kind: "ai_prompt" },
];

/**
 * Taslak, bekleyen ve zamanlanmış içerik. Ziyaretçiye açılmaz (`draft`). Başlığı boş kayıtlar atlanır.
 * SEO başlığı ve açıklama, yönetici oturumuyla açılan önizleme sayfasından okunur.
 */
export async function importDrafts(session: WpSession, siteId: string, authors: Map<number, string>): Promise<{ drafts: number; skippedEmpty: number }> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const palette = paletteFromHtml(await session.text("/"));
  const [cats, tags] = await Promise.all([wpAll<WpTerm>(session, "categories?_fields=id,slug"), wpAll<WpTerm>(session, "tags?_fields=id,slug")]);
  const catSlug = new Map(cats.map((term) => [term.id, term.slug]));
  const tagSlug = new Map(tags.map((term) => [term.id, term.slug]));
  const used = new Set((await repo.listContents({ locale })).map((row) => row.slug));
  const have = new Set((await repo.listContents({ locale })).map((row) => row.id));
  let drafts = 0;
  let skippedEmpty = 0;
  for (const { rest, kind } of COLLECTIONS) {
    const rows = await wpAll<WpPost>(session, `${rest}?status=draft,pending,future&context=edit&_fields=id,slug,status,link,date,author,title,excerpt,content,categories,tags`, 10);
    for (const row of rows) {
      const title = plainText(row.title?.raw ?? "", 240);
      const contentId = `cnt_wp_${row.id}`;
      if (!title) {
        skippedEmpty += 1;
        continue;
      }
      if (have.has(contentId)) continue;
      let head = null;
      try {
        head = parsePublicHead(await session.text(`/?p=${row.id}&preview=true`));
      } catch {
        head = null;
      }
      const html = row.content?.rendered ?? row.content?.raw ?? "";
      const blocks = compileBlocks(html, head?.faqs ?? [], row.id, session.origin, palette, true);
      const base = (row.slug || title.toLocaleLowerCase("tr").replace(/[^a-z0-9ığüşöç]+/g, "-")).replace(/^-+|-+$/g, "") || `wp-${row.id}`;
      let slug = base;
      for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
      used.add(slug);
      const software = pickPageSoftware(head?.software ?? []);
      const mapped = schemaFromBridge({
        kind: kind === "post" ? "post" : "page",
        schemaType: kind === "ai_prompt" ? "FAQPage" : kind === "post" ? "Article" : software ? "SoftwareApplication" : "",
        name: software?.name ?? "",
        description: software?.description || head?.description || "",
        os: software?.os ?? "",
        category: software?.category ?? "",
        price: software?.price ?? "",
        currency: software?.currency || "TRY",
        faqs: head?.faqs ?? [],
        slug,
      });
      const excerpt = plainText(row.excerpt?.raw ?? "", 500);
      await repo.saveContent({
        contentId,
        type: kind,
        authorName: row.author ? authors.get(row.author) : undefined,
        status: "draft",
        importanceScore: 4,
        schemaType: mapped.schemaType,
        schemaAttributes: {
          migratedFrom: "wordpress",
          wpId: String(row.id),
          wpKind: kind,
          wpStatus: row.status,
          ...(mapped.richSchema ? { richSchema: mapped.richSchema } : {}),
          _publishing: {
            visibility: "public",
            categories: (row.categories ?? []).map((id) => catSlug.get(id)).filter(Boolean),
            tags: (row.tags ?? []).map((id) => tagSlug.get(id)).filter(Boolean),
            allowComments: true,
          },
        },
        locale,
        slug,
        title,
        excerpt: excerpt || undefined,
        tldr: (head?.description || excerpt || title).slice(0, 260),
        blocks,
        metaTitle: head?.title || title,
        metaDescription: head?.description || (excerpt ? truncateSmart(excerpt, 160) : undefined),
        noIndex: head?.noindex === true,
        ...(row.date ? { publishedAt: new Date(`${row.date}+03:00`) } : {}),
      });
      drafts += 1;
    }
  }
  return { drafts, skippedEmpty };
}

/** Yayındaki içeriğe yazar adı ve doğru form bağını işler (içerik gövdesi ve SEO'ya dokunmaz). */
export async function enrichPublished(session: WpSession, siteId: string, authors: Map<number, string>, forms: Map<string, string>): Promise<{ authored: number; formsBound: number }> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const rows = await repo.listContents({ locale });
  const byId = new Map(rows.map((row) => [row.id, row]));
  let authored = 0;
  let formsBound = 0;
  for (const { rest } of COLLECTIONS) {
    const posts = await wpAll<WpPost>(session, `${rest}?status=publish&context=edit&_fields=id,author,content`, 10);
    for (const post of posts) {
      const row = byId.get(`cnt_wp_${post.id}`);
      if (!row) continue;
      const name = post.author ? authors.get(post.author) : undefined;
      const rebound = rebindFormBlocks(row.blocks, formRefsOf(post.content?.raw ?? ""), forms);
      // SSS listesi olan sayfa tek bir soru gibi çizilmesin: varlık WebPage olur, FAQPage düğümü bloklardan gelir.
      const schemaType = row.type === "page" && row.schemaType === "FAQPage" ? "WebPage" : row.schemaType;
      if (!name && rebound.changed === 0 && schemaType === row.schemaType) continue;
      await repo.saveContent({
        contentId: row.id,
        type: row.type,
        status: row.status,
        authorName: name,
        importanceScore: row.importanceScore,
        schemaType,
        schemaAttributes: row.schemaAttributes,
        featuredImage: row.featuredImage,
        locale: row.locale,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt ?? undefined,
        tldr: row.tldr ?? undefined,
        blocks: rebound.blocks,
        metaTitle: row.metaTitle ?? undefined,
        metaDescription: row.metaDescription ?? undefined,
        canonicalUrl: row.canonicalUrl ?? undefined,
        noIndex: row.noIndex,
      });
      if (name) authored += 1;
      formsBound += rebound.changed;
    }
  }
  return { authored, formsBound };
}

interface WpMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  mime_type?: string;
  title?: { raw?: string };
  caption?: { raw?: string };
  description?: { raw?: string };
}

/** Tüm medya kitaplığı. Görsel olmayan dosyalar (PDF, zip) atlanır. Aynı adres ikinci kez inmez; eksik alt metin/başlık yine de doldurulur. */
export async function importMedia(session: WpSession, siteId: string): Promise<{ downloaded: number; failed: number; total: number; metaFilled: number }> {
  const items = await wpAll<WpMedia>(session, "media?context=edit&_fields=id,source_url,alt_text,mime_type,title,caption,description", 100);
  const images = items.filter((item) => (item.mime_type ?? "").startsWith("image/") && item.source_url.startsWith(session.origin));
  const queue = images.map((item) => ({
    url: item.source_url,
    alt: plainText(item.alt_text ?? "", 300),
    title: plainText(item.title?.raw ?? "", 200),
    caption: plainText(item.caption?.raw ?? "", 400),
    description: plainText(item.description?.raw ?? "", 600),
  }));
  const before = await readMediaMap(siteId);
  const result = await ingestImages(siteId, queue);
  const repo = getScopedRepository(siteId);
  const map = await readMediaMap(siteId);
  let metaFilled = 0;
  for (const item of queue) {
    if (!before[item.url] || !map[item.url]) continue;
    const id = /^\/media\/([^?]+)/.exec(map[item.url] ?? "")?.[1];
    const asset = id ? await repo.findMediaAsset(id) : null;
    if (!asset || (asset.altText && asset.titleText) || (!item.alt && !item.title)) continue;
    await repo.saveMediaAsset({
      id: asset.id,
      filename: asset.filename,
      url: asset.url,
      mimeType: asset.mimeType,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      sizeBytes: asset.sizeBytes ?? undefined,
      altText: asset.altText || item.alt,
      titleText: asset.titleText || item.title || undefined,
      caption: asset.caption || item.caption || undefined,
      description: asset.description || item.description || undefined,
    });
    metaFilled += 1;
  }
  const site = await repo.getSite();
  if (result.downloaded > 0) await remapContentImages(siteId, site?.defaultLocale || "tr");
  return { ...result, total: images.length, metaFilled };
}
