import fs from "node:fs";
import path from "node:path";
import type { ContentStatus } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { truncateSmart } from "@nexpress/seo-core";
import { compileRichWpHtml, convertWpHtml, hasRichBlockMarkup, rewriteBlockLinks, schemaFromBridge } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { captureChromeSnapshot } from "@/lib/apply-yazilim-firmasi-theme";
import { applyDatasetChrome, DATASET_ORIGIN, DATASET_PALETTE } from "./dataset-chrome";
import { appendDatasetLists, remapDatasetAsset, remapDatasetImageUrls } from "./dataset-images";
import { addBridgeReport } from "./store";

interface DatasetPage {
  id: number;
  slug: string;
  path: string;
  title: string;
  excerpt: string;
  image: string | null;
  content: string;
}

interface DatasetPost extends DatasetPage {
  date?: string;
  categories?: number[];
}

interface DatasetCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface WpDataset {
  pages: DatasetPage[];
  posts: DatasetPost[];
  prompts: DatasetPost[];
  categories: DatasetCategory[];
}

interface ExistingRow {
  id: string;
  slug: string;
  status: ContentStatus;
  schemaType?: string | null;
  schemaAttributes?: Record<string, unknown> | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | null;
}

const DEFAULT_ORIGIN = DATASET_ORIGIN;

function compileDatasetBlocks(html: string, localImages: Set<string>) {
  const compiled = hasRichBlockMarkup(html)
    ? compileRichWpHtml(html, { baseUrl: DEFAULT_ORIGIN, palette: DATASET_PALETTE }).blocks
    : convertWpHtml(html, { baseUrl: DEFAULT_ORIGIN }).blocks;
  const rewritten = rewriteBlockLinks(compiled, DEFAULT_ORIGIN, "").blocks;
  return appendDatasetLists(remapDatasetImageUrls(rewritten, localImages));
}

function contentStatus(existing: { status: ContentStatus } | null): ContentStatus {
  return existing?.status ?? "published";
}

function schemaTypeFor(kind: "page" | "post", existingType: string | null | undefined, slug: string, description: string): string {
  return schemaFromBridge({
    kind,
    schemaType: existingType ?? "",
    name: "",
    description,
    os: "",
    category: "",
    price: "",
    currency: "",
    faqs: [],
    slug,
  }).schemaType;
}

function findRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "../.."), path.resolve(process.cwd(), "..")];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "docs", "akinsoftizmir-com-tr-aktarim", "public", "data", "wp-content.json"))) return dir;
  }
  return process.cwd();
}

function copyDatasetImages(repoRoot: string): Set<string> {
  const localNames = new Set<string>();
  const srcDir = path.join(repoRoot, "docs", "akinsoftizmir-com-tr-aktarim", "public", "images");
  const destDirs = [path.join(repoRoot, "apps", "cms", "public", "images"), path.join(process.cwd(), "public", "images")];
  if (!fs.existsSync(srcDir)) return localNames;
  for (const file of fs.readdirSync(srcDir)) {
    if (!/\.(?:webp|png|jpe?g|svg|avif)$/i.test(file)) continue;
    localNames.add(file);
    for (const destDir of destDirs) {
      try {
        fs.mkdirSync(destDir, { recursive: true });
        const destFile = path.join(destDir, file);
        if (!fs.existsSync(destFile)) fs.copyFileSync(path.join(srcDir, file), destFile);
      } catch {
        // Salt okunur dizinlerde atla
      }
    }
  }
  return localNames;
}

/**
 * Depodaki aktarım veri kümesini yeniden derler.
 * Eşleşmiş WordPress sitesini okumaz. Çöp veya taslak durumunu yayına çevirmez.
 */
export async function reconstructRichSiteDataset(siteId: string): Promise<{
  ok: boolean;
  pagesUpdated: number;
  postsUpdated: number;
  categoriesUpdated: number;
  imagesCopied: number;
}> {
  const repoRoot = findRepoRoot();
  const jsonPath = path.join(repoRoot, "docs", "akinsoftizmir-com-tr-aktarim", "public", "data", "wp-content.json");
  if (!fs.existsSync(jsonPath)) {
    return { ok: false, pagesUpdated: 0, postsUpdated: 0, categoriesUpdated: 0, imagesCopied: 0 };
  }

  const localImages = copyDatasetImages(repoRoot);
  const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as WpDataset;
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  await applyDatasetChrome(siteId, locale);

  const catIdToSlug = new Map<number, string>();
  let categoriesUpdated = 0;
  const existingTax = await repo.listTaxonomies();
  for (const cat of dataset.categories ?? []) {
    catIdToSlug.set(cat.id, cat.slug);
    const found = existingTax.find((row) => row.taxonomyType === "category" && row.slug === cat.slug);
    await repo.saveTaxonomy({
      id: found?.id,
      taxonomyType: "category",
      slug: cat.slug,
      name: cat.name,
      description: cat.description || undefined,
    });
    categoriesUpdated += 1;
  }

  const live = (await repo.listContents({ locale })) as ExistingRow[];
  const trashed = (await repo.listContents({ locale, status: "trashed" })) as ExistingRow[];
  const templateSlugs = new Set((await repo.listContents({ locale, type: "template" })).map((row) => row.slug));
  const bySlug = new Map(live.map((row) => [row.slug, row]));
  const liveById = new Map(live.map((row) => [row.id, row]));
  const trashById = new Map(trashed.map((row) => [row.id, row]));
  const findExisting = (wpId: number, ...slugs: string[]) =>
    liveById.get(`cnt_wp_${wpId}`) ?? slugs.map((slug) => bySlug.get(slug)).find(Boolean) ?? trashById.get(`cnt_wp_${wpId}`) ?? null;

  let pagesUpdated = 0;
  let blogSlug = "";
  for (const page of dataset.pages ?? []) {
    const rawSlug = page.slug === "home" ? "ana-sayfa" : page.slug;
    const slug = templateSlugs.has(rawSlug) ? `${rawSlug}-sayfa` : rawSlug;
    const existing = findExisting(page.id, slug, rawSlug);
    const finalSlug = existing && !templateSlugs.has(existing.slug) ? existing.slug : slug;
    const contentId = existing?.id ?? `cnt_wp_${page.id}`;
    const blocks = compileDatasetBlocks(page.content, localImages);
    const featured = page.image ? remapDatasetAsset(page.image, localImages) : existing?.featuredImage ?? null;

    await repo.saveContent({
      contentId,
      type: "page",
      status: contentStatus(existing),
      importanceScore: slug === "ana-sayfa" ? 10 : 8,
      schemaType: schemaTypeFor("page", existing?.schemaType, finalSlug, page.excerpt || ""),
      schemaAttributes: {
        ...(existing?.schemaAttributes ?? {}),
        migratedFrom: "wordpress",
        wpId: String(page.id),
        wpKind: "page",
      },
      featuredImage: featured,
      locale,
      slug: finalSlug,
      title: page.title,
      excerpt: page.excerpt || undefined,
      tldr: (page.excerpt || page.title).slice(0, 260),
      blocks,
      metaTitle: existing?.metaTitle ?? page.title,
      metaDescription: existing?.metaDescription ?? (page.excerpt ? truncateSmart(page.excerpt, 160) : undefined),
    });
    if (finalSlug === "blog" || rawSlug === "blog") blogSlug = finalSlug;
    pagesUpdated += 1;
  }
  if (blogSlug) await repo.saveSiteSettings({ general: { postsPageSlug: blogSlug } });

  let postsUpdated = 0;
  for (const post of [...(dataset.posts ?? []), ...(dataset.prompts ?? [])]) {
    const existing = findExisting(post.id, post.slug);
    const contentId = existing?.id ?? `cnt_wp_${post.id}`;
    const blocks = compileDatasetBlocks(post.content, localImages);
    const catSlugs = (post.categories ?? []).map((id) => catIdToSlug.get(id)).filter((s): s is string => Boolean(s));
    const date = post.date ? new Date(post.date) : null;
    const featured = post.image ? remapDatasetAsset(post.image, localImages) : existing?.featuredImage ?? null;

    await repo.saveContent({
      contentId,
      type: "post",
      status: contentStatus(existing),
      importanceScore: 7,
      schemaType: schemaTypeFor("post", existing?.schemaType, post.slug, post.excerpt || ""),
      schemaAttributes: {
        ...(existing?.schemaAttributes ?? {}),
        migratedFrom: "wordpress",
        wpId: String(post.id),
        wpKind: "post",
        _publishing: {
          visibility: "public",
          categories: catSlugs,
          tags: [],
          featuredImageUrl: featured || undefined,
          allowComments: true,
        },
      },
      featuredImage: featured,
      locale,
      slug: existing?.slug ?? post.slug,
      title: post.title,
      excerpt: post.excerpt || undefined,
      tldr: (post.excerpt || post.title).slice(0, 260),
      blocks,
      metaTitle: existing?.metaTitle ?? post.title,
      metaDescription: existing?.metaDescription ?? (post.excerpt ? truncateSmart(post.excerpt, 160) : undefined),
      ...(!existing?.publishedAt && date && !Number.isNaN(date.getTime()) ? { publishedAt: date } : {}),
    });
    postsUpdated += 1;
  }

  await captureChromeSnapshot(siteId, site?.activeThemeId || "corporate-aurora", locale);

  await addBridgeReport(siteId, {
    updated: pagesUpdated + postsUpdated,
    images: localImages.size,
    menus: 1,
    forms: 1,
  });

  try {
    await revalidatePath("/");
  } catch {
    // Betik modunda önbellek temizliği atlanır
  }

  return { ok: true, pagesUpdated, postsUpdated, categoriesUpdated, imagesCopied: localImages.size };
}
