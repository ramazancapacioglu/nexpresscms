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
  parsePublicHead,
  pickPageSoftware,
  plainText,
  restoreRemoteMedia,
  rewriteBlockLinks,
  schemaFromBridge,
  type PublicHead,
} from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { fetchPublicHtml } from "@/lib/safe-fetch";
import { removeAsset } from "@/lib/media/storage";
import { applyDatasetChrome, DATASET_PALETTE } from "./dataset-chrome";
import { appendDatasetLists } from "./dataset-images";

/** Kaynak site. Yalnızca bu alan adı okunur. */
export const LIVE_IMPORT_ORIGIN = "https://www.akinsoftizmir.com.tr";

export interface LiveImportResult {
  ok: boolean;
  dryRun: boolean;
  pages: number;
  posts: number;
  prompts: number;
  comments: number;
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
  linkPath: string;
  featured: string;
  categories: string[];
  tags: string[];
  head: PublicHead | null;
  front: boolean;
}

const FIELDS = "id,slug,link,date,status,title,excerpt,content,featured_image_src_large,categories,tags";

function featuredUrl(value: WpItem["featured_image_src_large"]): string {
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

async function fetchAll<T>(restPath: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 40; page++) {
    const join = restPath.includes("?") ? "&" : "?";
    const url = `${LIVE_IMPORT_ORIGIN}/wp-json/wp/v2/${restPath}${join}per_page=8&page=${page}`;
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

function compileBlocks(html: string, faqs: PublicHead["faqs"], wpId: number): BlockNode[] {
  let blocks: BlockNode[] = [];
  try {
    blocks = hasRichBlockMarkup(html)
      ? compileRichWpHtml(html, { baseUrl: LIVE_IMPORT_ORIGIN, palette: DATASET_PALETTE }).blocks
      : convertWpHtml(html, { baseUrl: LIVE_IMPORT_ORIGIN }).blocks;
  } catch {
    blocks = convertWpHtml(html.slice(0, 100_000), { baseUrl: LIVE_IMPORT_ORIGIN }).blocks;
  }
  const rewritten = restoreRemoteMedia(rewriteBlockLinks(blocks, LIVE_IMPORT_ORIGIN, "").blocks, LIVE_IMPORT_ORIGIN);
  const withLists = appendDatasetLists(rewritten);
  return ensureFaqs(withLists, faqs, wpId);
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

function prepare(item: WpItem, kind: Prepared["kind"], frontId: number, terms: Map<number, string>, tagSlugs: Map<number, string>): Prepared {
  return {
    wpId: item.id,
    kind,
    slug: item.slug,
    title: plainText(item.title?.rendered ?? item.slug, 240),
    excerpt: plainText(item.excerpt?.rendered ?? "", 500),
    html: item.content?.rendered ?? "",
    date: item.date ?? "",
    linkPath: pathOf(item.link),
    featured: featuredUrl(item.featured_image_src_large),
    categories: (item.categories ?? []).map((id) => terms.get(id)).filter((slug): slug is string => Boolean(slug)),
    tags: (item.tags ?? []).map((id) => tagSlugs.get(id)).filter((slug): slug is string => Boolean(slug)),
    head: null,
    front: item.id === frontId,
  };
}

/**
 * akinsoftizmir.com.tr yayımlanmış içeriğini, şemasını ve SEO alanlarını yazar.
 * Şablon ve tasarım kütüphanesine dokunmaz. Arama indeksi açılmaz.
 * Canonical eski alan adına kilitlenmez; bu sitenin kendi adresi üretilir.
 */
export async function importLiveAkinsoft(siteId: string, opts?: { dryRun?: boolean }): Promise<LiveImportResult> {
  const dryRun = opts?.dryRun === true;
  const empty: LiveImportResult = { ok: false, dryRun, pages: 0, posts: 0, prompts: 0, comments: 0, redirects: 0, seoHeads: 0, templates: 0, designs: 0 };
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  if (!site) return { ...empty, error: "Site kaydı yok." };
  const locale = site.defaultLocale || "tr";
  const templatesBefore = (await repo.listContents({ locale, type: "template" })).length;
  const designsBefore = (await getDesignLibraryRepository(siteId).list()).length;

  const homeHtml = await fetchPublicHtml(`${LIVE_IMPORT_ORIGIN}/`);
  const homeHead = parsePublicHead(homeHtml);
  const frontId = Number(/page-id-(\d+)/.exec(homeHtml)?.[1] ?? "0");
  const index = JSON.parse(await fetchJson(`${LIVE_IMPORT_ORIGIN}/wp-json/`)) as { name?: string; description?: string };
  const [pages, posts, prompts, categories, tags] = await Promise.all([
    fetchAll<WpItem>(`pages?_fields=${FIELDS}`),
    fetchAll<WpItem>(`posts?_fields=${FIELDS}`),
    fetchAll<WpItem>(`ai_prompt?_fields=${FIELDS}`),
    fetchAll<WpTerm>("categories?_fields=id,slug,name,description,parent"),
    fetchAll<WpTerm>("tags?_fields=id,slug,name,description"),
  ]);
  if (pages.length < 60 || posts.length < 40) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts: prompts.length, error: "Kaynak eksik göründü. Hiçbir kayıt silinmedi." };
  }

  const catSlug = new Map(categories.map((term) => [term.id, term.slug]));
  const tagSlug = new Map(tags.map((term) => [term.id, term.slug]));
  const items = [
    ...pages.map((item) => prepare(item, "page", frontId, catSlug, tagSlug)),
    ...posts.map((item) => prepare(item, "post", frontId, catSlug, tagSlug)),
    ...prompts.map((item) => prepare(item, "ai_prompt", frontId, catSlug, tagSlug)),
  ];
  await mapPool(items, 4, async (item) => {
    try {
      const html = await fetchPublicHtml(item.link || `${LIVE_IMPORT_ORIGIN}/${item.slug}/`);
      item.head = parsePublicHead(html);
    } catch {
      item.head = null;
    }
  });
  const seoHeads = items.filter((item) => item.head?.title).length;
  if (seoHeads < Math.floor(items.length * 0.8)) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts: prompts.length, seoHeads, error: "SEO başlıklarının çoğu okunamadı. Hiçbir kayıt silinmedi." };
  }
  const front = items.find((item) => item.front) ?? items.find((item) => item.kind === "page");
  const frontBlocks = front ? compileBlocks(front.html, front.head?.faqs ?? [], front.wpId) : [];
  if (!front?.head?.title || frontBlocks.length === 0) {
    return { ...empty, pages: pages.length, posts: posts.length, prompts: prompts.length, seoHeads, error: "Ana sayfa yerleşimi kurulamadı. Hiçbir kayıt silinmedi." };
  }
  if (dryRun) {
    return { ok: true, dryRun, pages: pages.length, posts: posts.length, prompts: prompts.length, comments: 0, redirects: 0, seoHeads, templates: templatesBefore, designs: designsBefore };
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
    if (item.kind === "page" && item.slug === "blog") blogSlug = slug;
    const head = item.head;
    const software = pickPageSoftware(head?.software ?? []);
    const schemaKind = item.kind === "post" ? "post" : "page";
    const declared = head?.types ?? [];
    const rawType =
      item.kind === "ai_prompt"
        ? "FAQPage"
        : item.kind === "post"
          ? "Article"
          : declared.includes("FAQPage") || declared.includes("QAPage")
            ? "FAQPage"
            : software || declared.includes("SoftwareApplication")
              ? "SoftwareApplication"
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
    const featured = item.featured.startsWith("/") ? `${LIVE_IMPORT_ORIGIN}${item.featured}` : item.featured;
    const date = item.date ? new Date(item.date) : null;
    const type: ContentType = item.kind;
    await repo.saveContent({
      contentId: `cnt_wp_${item.wpId}`,
      type,
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
          featuredImageUrl: featured || undefined,
          allowComments: true,
        },
      },
      featuredImage: featured || null,
      locale,
      slug,
      title: item.title,
      excerpt: item.excerpt || undefined,
      tldr: (head?.description || item.excerpt || item.title).slice(0, 260),
      blocks: compileBlocks(item.html, head?.faqs ?? [], item.wpId),
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

  await applyDatasetChrome(siteId, locale);
  const siteName = homeHead.siteName || index.name || site.name;
  await getSiteIdentityRepository(siteId).update({ name: siteName, tagline: plainText(index.description ?? site.tagline ?? "", 180) || null });
  const org = homeHead.organization;
  await repo.saveSiteSettings({
    seo: {
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
    const rows = await fetchAll<WpComment>("comments?_fields=id,post,parent,author_name,content,status");
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
    prompts: prompts.length,
    comments,
    redirects: redirectCount,
    seoHeads,
    templates: templatesAfter,
    designs: designsAfter,
    ...(designsAfter === designsBefore ? {} : { error: "Tasarım kütüphanesi sayısı değişti." }),
  };
}
