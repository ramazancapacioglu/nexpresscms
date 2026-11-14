import type { BlockNode, ContentType } from "@nexpress/core";
import {
  getDesignLibraryRepository,
  getRedirectRepository,
  getScopedRepository,
  getSiteIdentityRepository,
  getSiteResetRepository,
} from "@nexpress/database";
import { truncateSmart } from "@nexpress/seo-core";
import {
  compileRichWpHtml,
  convertWpHtml,
  hasRichBlockMarkup,
  menuFromPublicHtml,
  normalizePublicOrigin,
  paletteFromHtml,
  parsePublicHead,
  pickPageSoftware,
  plainText,
  restoreRemoteMedia,
  rewriteBlockLinks,
  schemaFromBridge,
  tokensFromPalette,
  type PublicHead,
} from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { fetchPublicHtml } from "@/lib/safe-fetch";
import { removeAsset } from "@/lib/media/storage";
import { applyDatasetChrome } from "./dataset-chrome";
import { appendDatasetLists } from "./dataset-images";
import { ingestImages, remapContentImages } from "./media";

/** Kaynak site. Yalnızca bu alan adı okunur. */
export const LIVE_IMPORT_ORIGIN = "https://www.akinsoftizmir.com.tr";

export interface LiveImportResult {
  ok: boolean;
  dryRun: boolean;
  pages: number;
  posts: number;
  prompts: number;
  comments: number;
  authors: number;
  images: number;
  redirects: number;
  seoHeads: number;
  templates: number;
  designs: number;
  error?: string;
}

interface WpRendered {
  rendered?: string;
}

interface WpItem {
  id: number;
  slug: string;
  link: string;
  date?: string;
  status?: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  featured_image_src_large?: string | string[] | { url?: string } | null;
  categories?: number[];
  tags?: number[];
  author?: number;
}

interface WpUser {
  id: number;
  name?: string;
}

interface WpTerm {
  id: number;
  slug: string;
  name: string;
  description?: string;
  parent?: number;
}

interface WpComment {
  id: number;
  post: number;
  parent: number;
  author?: number;
  author_name?: string;
  content?: WpRendered;
  status?: string;
}

interface Prepared {
  wpId: number;
  kind: "page" | "post" | "ai_prompt";
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  date: string;
  link: string;
  linkPath: string;
  featured: string;
  categories: string[];
  tags: string[];
  authorName: string;
  head: PublicHead | null;
  front: boolean;
}

const FIELDS = "id,slug,link,date,status,title,excerpt,content,featured_image_src_large,categories,tags,author";

const SKIP_TYPE = new Set([
  "attachment",
  "nav_menu_item",
  "wp_block",
  "wp_template",
  "wp_template_part",
  "wp_global_styles",
  "wp_navigation",
  "wp_font_family",
  "wp_font_face",
  "rank_math_schema",
  "product",
  "product_variation",
  "shop_order",
  "shop_coupon",
  "shop_order_refund",
  "web-story",
  "web-story-font",
  "web-story-page",
]);

function readFeatured(value: WpItem["featured_image_src_large"]): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  if (value && typeof value === "object" && typeof value.url === "string") return value.url;
  return "";
}

function pathOf(link: string): string {
  try {
    const path = new URL(link).pathname;
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path || "/";
  } catch {
    return "/";
  }
}

async function fetchJson(url: string): Promise<string> {
  return fetchPublicHtml(url, { allow: "json", maxBytes: 12_000_000, timeoutMs: 40_000 });
}

async function fetchAll<T>(origin: string, restPath: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 80; page++) {
    const join = restPath.includes("?") ? "&" : "?";
    const url = `${origin}/wp-json/wp/v2/${restPath}${join}per_page=8&page=${page}`;
    let text = "";
    try {
      text = await fetchJson(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (page > 1 && /HTTP 400/.test(message)) break;
      throw error;
    }
    const rows = JSON.parse(text) as T[];
    if (!Array.isArray(rows) || rows.length === 0) break;
    out.push(...rows);
    if (rows.length < 8) break;
  }
  return out;
}

async function fetchAllOptional<T>(origin: string, restPath: string): Promise<T[]> {
  try {
    return await fetchAll<T>(origin, restPath);
  } catch {
    return [];
  }
}

async function mapPool<T>(items: T[], limit: number, run: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (current) await run(current);
    }
  });
  await Promise.all(workers);
}

function compileBlocks(html: string, faqs: PublicHead["faqs"], wpId: number, origin: string, palette: Record<string, string>, datasetLists: boolean): BlockNode[] {
  let blocks: BlockNode[] = [];
  try {
    blocks = hasRichBlockMarkup(html)
      ? compileRichWpHtml(html, { baseUrl: origin, palette }).blocks
      : convertWpHtml(html, { baseUrl: origin }).blocks;
  } catch {
    blocks = convertWpHtml(html.slice(0, 100_000), { baseUrl: origin }).blocks;
  }
  const rewritten = restoreRemoteMedia(rewriteBlockLinks(blocks, origin, "").blocks, origin);
  const withLists = datasetLists ? appendDatasetLists(rewritten) : rewritten;
  return ensureFaqs(withLists, faqs, wpId);
}

function collectUploadUrls(blocks: BlockNode[], origin: string, into: Set<string>): void {
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      const found = value.match(/https?:\/\/[^"'()\s]+\/wp-content\/uploads\/[^"'()\s]+/gi) ?? [];
      for (const url of found) {
        if (url.startsWith(origin)) into.add(url.split("?")[0] ?? url);
      }
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(walk);
  };
  for (const block of blocks) {
    walk(block.props);
    if (block.children) collectUploadUrls(block.children, origin, into);
  }
}

function contentKind(slug: string): Prepared["kind"] | null {
  if (
    SKIP_TYPE.has(slug) ||
    slug.startsWith("wp_") ||
    slug.startsWith("kadence_") ||
    slug.startsWith("web-story") ||
    slug.startsWith("jp_") ||
    slug.startsWith("jetpack_") ||
    slug === "feedback"
  ) return null;
  if (slug === "page") return "page";
  if (/prompt|faq|soru|question/.test(slug)) return "ai_prompt";
  return "post";
}

function ensureFaqs(blocks: BlockNode[], faqs: PublicHead["faqs"], wpId: number): BlockNode[] {
  if (faqs.length === 0) return blocks;
  const have = new Set<string>();
  const walk = (nodes: BlockNode[]) => {
    for (const node of nodes) {
      const items = node.props?.items;
      if (node.type === "faq_accordion" && Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === "object" && "question" in item) have.add(String(item.question).trim().toLowerCase());
        }
      }
      if (node.children) walk(node.children);
    }
  };
  walk(blocks);
  const missing = faqs.filter((item) => !have.has(item.q.trim().toLowerCase()));
  if (missing.length === 0) return blocks;
  return [
    ...blocks,
    {
      id: `wp_faq_${wpId}`,
      type: "section",
      props: {},
      children: [
        {
          id: `wp_faq_${wpId}_acc`,
          type: "faq_accordion",
          props: { items: missing.map((item) => ({ question: item.q, answer: item.a })) },
        },
      ],
    },
  ];
}

function prepare(item: WpItem, kind: Prepared["kind"], frontId: number, terms: Map<number, string>, tagSlugs: Map<number, string>, authors: Map<number, string>): Prepared {
  return {
    wpId: item.id,
    kind,
    slug: item.slug,
    title: plainText(item.title?.rendered ?? item.slug, 240),
    excerpt: plainText(item.excerpt?.rendered ?? "", 500),
    html: item.content?.rendered ?? "",
    date: item.date ?? "",
    link: item.link,
    linkPath: pathOf(item.link),
    featured: readFeatured(item.featured_image_src_large),
    categories: (item.categories ?? []).map((id) => terms.get(id)).filter((slug): slug is string => Boolean(slug)),
    tags: (item.tags ?? []).map((id) => tagSlugs.get(id)).filter((slug): slug is string => Boolean(slug)),
    authorName: item.author ? authors.get(item.author) ?? "" : "",
    head: null,
    front: kind === "page" && (item.id === frontId || pathOf(item.link) === "/"),
  };
}

/**
 * Herkese açık bir WordPress sitesini tarar. Sayfa yapısını bozmadan bloklara çizer.
 * SEO, yorum, yazar adı, blog ve kullanılan görseller gelir. Şablon ve tasarım kütüphanesi durur.
 * Arama indeksi açılmaz. Canonical eski alan adına kilitlenmez.
 * Giriş hesabı açılmaz: WordPress e-posta ve parolayı yayımlamaz.
 */
export async function importPublicWordPress(siteId: string, opts: { origin: string; dryRun?: boolean }): Promise<LiveImportResult> {
  const origin = normalizePublicOrigin(opts.origin);
  const dryRun = opts.dryRun === true;
  const empty: LiveImportResult = { ok: false, dryRun, pages: 0, posts: 0, prompts: 0, comments: 0, authors: 0, images: 0, redirects: 0, seoHeads: 0, templates: 0, designs: 0 };
  if (!origin) return { ...empty, error: "Adres herkese açık bir https sitesi olmalı." };
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  if (!site) return { ...empty, error: "Site kaydı yok." };
  const locale = site.defaultLocale || "tr";
  const templatesBefore = (await repo.listContents({ locale, type: "template" })).length;
  const designsBefore = (await getDesignLibraryRepository(siteId).list()).length;

  const homeHtml = await fetchPublicHtml(`${origin}/`);
  const homeHead = parsePublicHead(homeHtml);
  const frontId = Number(/page-id-(\d+)/.exec(homeHtml)?.[1] ?? "0");
  const index = JSON.parse(await fetchJson(`${origin}/wp-json/`)) as { name?: string; description?: string; namespaces?: string[] };
  if (!index.namespaces?.includes("wp/v2") && !/wp-json/i.test(homeHtml) && !/wordpress/i.test(homeHtml)) {
    return { ...empty, error: "Bu adres WordPress gibi görünmüyor. Hiçbir kayıt silinmedi." };
  }
  let typeIndex: Record<string, { slug?: string; rest_base?: string }> = {};
  try {
    typeIndex = JSON.parse(await fetchJson(`${origin}/wp-json/wp/v2/types`)) as Record<string, { slug?: string; rest_base?: string }>;
  } catch {
    typeIndex = {};
  }
  const extras = Object.values(typeIndex)
    .map((row) => ({ slug: row.slug ?? "", rest: row.rest_base ?? "" }))
    .filter((row) => row.rest && row.slug !== "page" && row.slug !== "post" && contentKind(row.slug));
  const [pages, posts, categories, tags, users] = await Promise.all([
    fetchAll<WpItem>(origin, `pages?_fields=${FIELDS}`),
    fetchAll<WpItem>(origin, `posts?_fields=${FIELDS}`),
    fetchAll<WpTerm>(origin, "categories?_fields=id,slug,name,description,parent"),
    fetchAll<WpTerm>(origin, "tags?_fields=id,slug,name,description"),
    fetchAllOptional<WpUser>(origin, "users?_fields=id,name"),
  ]);
  const extraItems: Array<{ item: WpItem; kind: Prepared["kind"] }> = [];
  for (const extra of extras) {
    const kind = contentKind(extra.slug);
    if (!kind) continue;
    const rows = await fetchAllOptional<WpItem>(origin, `${extra.rest}?_fields=${FIELDS}`);
    for (const item of rows) extraItems.push({ item, kind });
  }
  if (pages.length < 1) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts: extraItems.length, error: "Yayımlanmış sayfa bulunamadı. Hiçbir kayıt silinmedi." };
  }

  const catSlug = new Map(categories.map((term) => [term.id, term.slug]));
  const tagSlug = new Map(tags.map((term) => [term.id, term.slug]));
  const authors = new Map<number, string>();
  for (const user of users) {
    const name = plainText(user.name ?? "", 120);
    if (name) authors.set(user.id, name);
  }
  const prompts = extraItems.filter((row) => row.kind === "ai_prompt").length;
  const items = [
    ...pages.map((item) => prepare(item, "page", frontId, catSlug, tagSlug, authors)),
    ...posts.map((item) => prepare(item, "post", frontId, catSlug, tagSlug, authors)),
    ...extraItems.map((row) => prepare(row.item, row.kind, frontId, catSlug, tagSlug, authors)),
  ];
  await mapPool(items, 4, async (item) => {
    try {
      const html = await fetchPublicHtml(item.link || `${origin}/${item.slug}/`);
      item.head = parsePublicHead(html);
    } catch {
      item.head = null;
    }
  });
  if (!items.some((item) => item.front) && homeHead.title) {
    const titled = items.find((item) => item.kind === "page" && item.title && (homeHead.title.startsWith(item.title) || item.title.startsWith(homeHead.title.slice(0, 48))));
    if (titled) titled.front = true;
  }
  const seoHeads = items.filter((item) => item.head?.title).length;
  if (items.length > 4 && seoHeads < Math.floor(items.length * 0.5)) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts, seoHeads, error: "SEO başlıklarının çoğu okunamadı. Hiçbir kayıt silinmedi." };
  }
  const palette = paletteFromHtml(homeHtml);
  const datasetLists = origin.includes("akinsoftizmir.com.tr");
  const front = items.find((item) => item.front) ?? items.find((item) => item.kind === "page");
  const frontBlocks = front ? compileBlocks(front.html, front.head?.faqs ?? [], front.wpId, origin, palette, datasetLists) : [];
  if (!front?.head?.title || frontBlocks.length === 0) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts, seoHeads, authors: authors.size, error: "Ana sayfa yerleşimi kurulamadı. Hiçbir kayıt silinmedi." };
  }
  if (dryRun) {
    return { ok: true, dryRun, pages: pages.length, posts: posts.length, prompts, comments: 0, authors: authors.size, images: 0, redirects: 0, seoHeads, templates: templatesBefore, designs: designsBefore };
  }

  const wiped = await getSiteResetRepository(siteId).wipeContent("everything");
  for (const id of wiped.mediaIds) {
    try {
      await removeAsset(siteId, id);
    } catch {
      // Kayıt silindi; eksik dosya aktarımı durdurmaz.
    }
  }
  const templatesAfter = (await repo.listContents({ locale, type: "template" })).length;
  if (templatesAfter !== templatesBefore) {
    return { ...empty, error: "Şablon sayısı değişti. Aktarım durdu.", templates: templatesAfter, designs: designsBefore };
  }

  const existingTax = await repo.listTaxonomies();
  const parentByWp = new Map<number, string>();
  const pendingCats = [...categories];
  for (let guard = 0; pendingCats.length > 0 && guard < 6; guard += 1) {
    for (let i = pendingCats.length - 1; i >= 0; i -= 1) {
      const term = pendingCats[i];
      if (!term) continue;
      if (term.parent && !parentByWp.has(term.parent)) continue;
      const found = existingTax.find((row) => row.taxonomyType === "category" && row.slug === term.slug);
      const saved = await repo.saveTaxonomy({
        id: found?.id ?? `tax_wp_cat_${term.id}`,
        taxonomyType: "category",
        slug: term.slug,
        name: plainText(term.name, 160),
        description: plainText(term.description ?? "", 500) || undefined,
        parentId: term.parent ? parentByWp.get(term.parent) ?? null : null,
      });
      parentByWp.set(term.id, saved.id);
      pendingCats.splice(i, 1);
    }
  }
  for (const term of pendingCats) {
    const found = existingTax.find((row) => row.taxonomyType === "category" && row.slug === term.slug);
    await repo.saveTaxonomy({
      id: found?.id ?? `tax_wp_cat_${term.id}`,
      taxonomyType: "category",
      slug: term.slug,
      name: plainText(term.name, 160),
      description: plainText(term.description ?? "", 500) || undefined,
    });
  }
  for (const term of tags) {
    const found = existingTax.find((row) => row.taxonomyType === "tag" && row.slug === term.slug);
    await repo.saveTaxonomy({
      id: found?.id ?? `tax_wp_tag_${term.id}`,
      taxonomyType: "tag",
      slug: term.slug,
      name: plainText(term.name, 160),
      description: plainText(term.description ?? "", 500) || undefined,
    });
  }

  const uploadUrls = new Set<string>();
  const templateSlugs = new Set((await repo.listContents({ locale, type: "template" })).map((row) => row.slug));
  const usedSlugs = new Set<string>(templateSlugs);
  const redirects = getRedirectRepository(siteId);
  let redirectCount = 0;
  let blogSlug = "";
  for (const item of items) {
    const baseSlug = item.front ? "ana-sayfa" : item.slug || `wp-${item.wpId}`;
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    if (item.kind === "page" && /^(blog|haberler|yazilar|news)$/.test(item.slug)) blogSlug = slug;
    const head = item.head;
    const software = pickPageSoftware(head?.software ?? []);
    const schemaKind = item.kind === "post" ? "post" : "page";
    const declared = head?.types ?? [];
    const rawType =
      item.kind === "ai_prompt"
        ? "FAQPage"
        : item.kind === "post"
          ? "Article"
          : software || declared.includes("SoftwareApplication")
            ? "SoftwareApplication"
            : declared.includes("FAQPage") || declared.includes("QAPage")
              ? "FAQPage"
              : declared.find((type) => type === "AboutPage" || type === "ContactPage" || type === "Service") ?? "";
    const mapped = schemaFromBridge({
      kind: schemaKind,
      schemaType: rawType,
      name: software?.name ?? "",
      description: software?.description || head?.description || item.excerpt,
      os: software?.os ?? "",
      category: software?.category || item.categories[0] || "",
      price: software?.price ?? "",
      currency: software?.currency || "TRY",
      faqs: head?.faqs ?? [],
      slug,
    });
    const imageUrl: string = item.featured.startsWith("/") ? `${origin}${item.featured}` : item.featured;
    if (imageUrl.startsWith(origin) && imageUrl.includes("/wp-content/uploads/")) {
      uploadUrls.add(imageUrl.split("?")[0] ?? imageUrl);
    }
    const blocks = compileBlocks(item.html, head?.faqs ?? [], item.wpId, origin, palette, datasetLists);
    collectUploadUrls(blocks, origin, uploadUrls);
    const date = item.date ? new Date(item.date) : null;
    const type: ContentType = item.kind;
    await repo.saveContent({
      contentId: `cnt_wp_${item.wpId}`,
      type,
      authorName: item.authorName || undefined,
      status: "published",
      importanceScore: item.front ? 10 : item.kind === "page" ? 8 : 6,
      schemaType: mapped.schemaType,
      schemaAttributes: {
        migratedFrom: "wordpress",
        wpId: String(item.wpId),
        wpKind: item.kind,
        ...(mapped.richSchema ? { richSchema: mapped.richSchema } : {}),
        _publishing: {
          visibility: "public",
          categories: item.categories,
          tags: item.tags,
          featuredImageUrl: imageUrl || undefined,
          allowComments: true,
        },
      },
      featuredImage: imageUrl || null,
      locale,
      slug,
      title: item.title,
      excerpt: item.excerpt || undefined,
      tldr: (head?.description || item.excerpt || item.title).slice(0, 260),
      blocks,
      metaTitle: head?.title || item.title,
      metaDescription: head?.description || (item.excerpt ? truncateSmart(item.excerpt, 160) : undefined),
      noIndex: head?.noindex === true,
      ...(!Number.isNaN(date?.getTime() ?? NaN) && date ? { publishedAt: date } : {}),
    });
    const target = item.front ? "/" : `/${slug}`;
    if (item.linkPath !== "/" && item.linkPath !== target) {
      const saved = await redirects.save({ fromPath: item.linkPath, toPath: target, code: 301, note: "WordPress aktarımı" });
      if (saved.ok) redirectCount += 1;
    }
  }

  if (datasetLists) await applyDatasetChrome(siteId, locale);
  else await applyScannedChrome(siteId, locale, homeHtml, origin);
  let images = 0;
  const queue = [...uploadUrls].slice(0, 80).map((url) => ({ url, alt: "" }));
  if (queue.length > 0) {
    const ingested = await ingestImages(siteId, queue);
    images = ingested.downloaded;
    if (ingested.downloaded > 0) await remapContentImages(siteId, locale);
  }
  const siteName = homeHead.siteName || index.name || site.name;
  await getSiteIdentityRepository(siteId).update({ name: siteName, tagline: plainText(index.description ?? site.tagline ?? "", 180) || null });
  const org = homeHead.organization;
  await repo.saveSiteSettings({
    seo: {
      // Kaynak başlık zaten tam başlıktır. Şablon yeniden sararsa marka iki kez yazılır.
      titleTemplate: "%title%",
      homeTitleTemplate: "%title%",
      ...(org?.name ? { organizationName: org.name } : {}),
      ...(org?.logo.startsWith("https://") ? { organizationLogo: org.logo } : {}),
      ...(org && org.sameAs.length > 0 ? { sameAs: org.sameAs } : {}),
      ...(homeHead.description ? { defaultMetaDescription: homeHead.description } : {}),
    },
    general: {
      frontPageSlug: "ana-sayfa",
      ...(blogSlug ? { postsPageSlug: blogSlug } : {}),
      ...(!site.settings.general.contactEmail && org?.email.includes("@") ? { contactEmail: org.email } : {}),
    },
  });

  let comments = 0;
  const importedIds = new Set(items.map((item) => item.wpId));
  try {
    const rows = await fetchAll<WpComment>(origin, "comments?_fields=id,post,parent,author_name,content,status");
    const ordered = [...rows].sort((a, b) => a.parent - b.parent);
    for (const comment of ordered) {
      if (!importedIds.has(comment.post)) continue;
      const body = plainText(comment.content?.rendered ?? "", 4000);
      if (!body) continue;
      await repo.saveCommentReview({
        id: `cmt_wp_${comment.id}`,
        contentId: `cnt_wp_${comment.post}`,
        authorName: plainText(comment.author_name ?? "Ziyaretçi", 120) || "Ziyaretçi",
        entryType: "comment",
        body,
        status: "approved",
        parentId: comment.parent ? `cmt_wp_${comment.parent}` : null,
      });
      comments += 1;
    }
  } catch {
    // Yorum ucu kapalıysa içerik ve SEO durur.
  }

  const designsAfter = (await getDesignLibraryRepository(siteId).list()).length;
  try {
    await revalidatePath("/");
  } catch {
    // Betik modunda önbellek temizliği atlanır.
  }
  return {
    ok: designsAfter === designsBefore && templatesAfter === templatesBefore,
    dryRun: false,
    pages: pages.length,
    posts: posts.length,
    prompts,
    comments,
    authors: authors.size,
    images,
    redirects: redirectCount,
    seoHeads,
    templates: templatesAfter,
    designs: designsAfter,
    ...(designsAfter === designsBefore && templatesAfter === templatesBefore
      ? {}
      : { error: designsAfter === designsBefore ? "Şablon sayısı değişti." : "Tasarım kütüphanesi sayısı değişti." }),
  };
}

/** Eski tek site çağrısı. Genel tarayıcıyı bu köke bağlar. */
export async function importLiveAkinsoft(siteId: string, opts?: { dryRun?: boolean }): Promise<LiveImportResult> {
  return importPublicWordPress(siteId, { origin: LIVE_IMPORT_ORIGIN, dryRun: opts?.dryRun });
}

async function applyScannedChrome(siteId: string, locale: string, homeHtml: string, origin: string): Promise<void> {
  const menu = menuFromPublicHtml(homeHtml, origin).map((item, index) => ({ ...item, id: `m_scan_${index}` }));
  const repo = getScopedRepository(siteId);
  const nav = await repo.getNavigationLayout(locale);
  const phone = (homeHtml.match(/tel:(\+?[0-9][0-9\s()-]{7,20})/)?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
  const email = (homeHtml.match(/mailto:([^"'?\s>]+)/)?.[1] ?? "").slice(0, 120);
  if (nav && menu.length > 0) {
    await repo.saveNavigationLayout({
      locale,
      headerConfig: {
        ...nav.headerConfig,
        topBar: {
          ...nav.headerConfig.topBar,
          enabled: Boolean(phone || email || nav.headerConfig.topBar.enabled),
          ...(phone ? { contactPhone: phone } : {}),
          ...(email.includes("@") ? { contactEmail: email } : {}),
        },
      },
      menuItems: menu,
      menus: [{ id: "menu_wp_header", name: "Ana Menü", header: true, items: menu }],
    });
  }
  if (Object.keys(paletteFromHtml(homeHtml)).length > 0) await repo.saveDesignTokens(tokensFromPalette(homeHtml));
}
