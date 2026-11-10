"use server";

import { requireAdmin, requireUser } from "@/lib/auth/session";
import { removeAsset } from "@/lib/media/storage";
import { providerFromEnv, reindexSite, type ReindexSummary } from "@nexpress/rag";
import "@/plugins/register";
import { revalidatePath } from "@/lib/cache";
import { headers } from "next/headers";
import { getMediaAdminRepository, getScopedRepository, type MediaUsageDto } from "@nexpress/database";
import { getThemeManifest } from "@nexpress/themes";
import { switchThemeChrome } from "@/lib/apply-yazilim-firmasi-theme";
import { writePermalinkHtaccess } from "@/lib/permalink-htaccess";
import { sanitizePermalinkStructure } from "@nexpress/core/permalinks";
import { resolvePublishing, resolveSiteSettings, sanitizeMenu, sanitizeMenus, zonedLocalToUtc } from "@nexpress/core";
import type {
  BlockNode,
  ContentStatus,
  ContentType,
  DesignTokens,
  FooterConfig,
  HeaderConfig,
  NavigationMenuItem,
  SidebarConfig,
  SiteMenuRecord,
  SeoEngineSettings,
  SiteCustomizerSettings,
  SiteProfile,
} from "@nexpress/core";

export async function activateThemeAction(input: {
  themeId: string;
  customPrimaryColor?: string;
  customBorderRadius?: string;
  siteProfile?: SiteProfile;
}) {
  await requireUser({ audit: "cms.activateTheme" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const site = await repo.getSite();
  const previousId = site?.activeThemeId ?? "";
  const locale = site?.defaultLocale ?? "tr";
  const manifest = getThemeManifest(input.themeId);
  const mergedTokens: DesignTokens = {
    ...manifest.tokens,
    colors: {
      ...manifest.tokens.colors,
      ...(input.customPrimaryColor ? { primary: input.customPrimaryColor } : {}),
    },
    geometry: {
      ...manifest.tokens.geometry,
      ...(input.customBorderRadius ? { borderRadius: input.customBorderRadius } : {}),
    },
  };

  await repo.activateTheme(
    manifest.id,
    mergedTokens,
    input.siteProfile ?? manifest.recommendedProfile
  );
  await switchThemeChrome(siteId, previousId, manifest.id, locale);

  await revalidatePath("/admin");
  await revalidatePath("/admin/themes");
  await revalidatePath("/");
  await revalidatePath("/tr", "layout");
  return { ok: true, activeThemeId: manifest.id };
}

export async function saveThemeCustomizerAction(input: {
  themeId: string;
  siteProfile?: SiteProfile;
  tokens: DesignTokens;
  customizer: SiteCustomizerSettings;
}) {
  await requireUser({ audit: "cms.saveThemeCustomizer" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  await repo.activateTheme(
    input.themeId,
    input.tokens,
    input.siteProfile ?? "corporate"
  );
  const settings = await repo.saveSiteSettings({
    customizer: input.customizer,
  });

  await revalidatePath("/admin");
  await revalidatePath("/admin/themes");
  await revalidatePath("/tr");
  return { ok: true, settings };
}

export async function saveSeoEngineSettingsAction(input: {
  seo: Partial<SeoEngineSettings>;
}) {
  await requireAdmin("cms.saveSeoEngineSettings");
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const settings = await repo.saveSiteSettings({
    seo: input.seo,
  });
  const structure = sanitizePermalinkStructure(settings.seo.permalinkStructure);
  let htaccessPath = "";
  let htaccessError = "";
  try {
    htaccessPath = await writePermalinkHtaccess(structure);
  } catch (error) {
    htaccessError = error instanceof Error ? error.message : "htaccess yazılamadı";
  }

  await revalidatePath("/admin");
  await revalidatePath("/admin/themes");
  await revalidatePath("/admin/seo");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/");
  await revalidatePath("/tr", "layout");
  await revalidatePath("/llms.txt");
  await revalidatePath("/sitemap.xml");
  await revalidatePath("/robots.txt");
  return { ok: true, settings, htaccessPath, htaccessError };
}

export async function saveContentAction(input: {
  contentId?: string;
  type: ContentType;
  status?: ContentStatus;
  schemaType: string;
  importanceScore: number;
  slug: string;
  title: string;
  tldr: string;
  blocks: BlockNode[];
  featuredImage?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  schemaAttributes?: Record<string, unknown>;
  /** Düzenlenen dil; etkin diller dışındaki değer varsayılan dile düşer */
  locale?: string;
}) {
  const session = await requireUser({ audit: "cms.saveContent" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = input.locale && site?.supportedLocales.includes(input.locale) ? input.locale : (site?.defaultLocale ?? "tr");

  if (input.status === "scheduled") {
    // Tarihsiz/geçmiş zamanlama sonsuza dek bekler ya da hemen yayınlanır: kayıtta reddedilir
    const tz = resolveSiteSettings(site?.settings).general.timezone;
    const at = resolvePublishing(input.schemaAttributes).scheduledAt;
    const when = at ? zonedLocalToUtc(at, tz) : null;
    if (!when) return { ok: false as const, error: "Zamanlanmış yayın için geçerli bir tarih ve saat seçin." };
    if (when.getTime() <= Date.now()) return { ok: false as const, error: "Zamanlanmış yayın tarihi gelecekte olmalı." };
  }

  const res = await repo.saveContent({
    actor: { id: session.sub, email: session.email },
    contentId: input.contentId,
    type: input.type,
    status: input.status ?? "published",
    importanceScore: input.importanceScore,
    schemaType: input.schemaType,
    schemaAttributes: input.schemaAttributes,
    featuredImage: input.featuredImage ?? null,
    locale,
    region: "TR",
    slug: input.slug,
    title: input.title,
    tldr: input.tldr,
    blocks: input.blocks,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    canonicalUrl: input.canonicalUrl,
    noIndex: input.noIndex,
  });

  await revalidatePath("/admin");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath(`/${locale}`);
  await revalidatePath(`/${locale}/${res.slug}`);
  await revalidatePath("/llms.txt");

  return {
    ok: true,
    contentId: res.contentId,
    slug: res.slug,
    markdownCache: res.markdownCache,
    seoScore: res.seoScore,
  };
}

export async function patchContentAction(input: {
  contentId: string;
  title?: string;
  slug?: string;
  status?: ContentStatus;
  importanceScore?: number;
  tldr?: string;
  noIndex?: boolean;
  categories?: string[];
  tags?: string[];
  visibility?: "public" | "private" | "password" | "members_only";
}) {
  await requireUser({ audit: "cms.patchContent" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const res = await repo.patchContent(input.contentId, input);

  await revalidatePath("/admin");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/tr");
  await revalidatePath("/llms.txt");
  return res;
}

export async function bulkContentAction(input: {
  contentIds: string[];
  operation:
    | "publish"
    | "draft"
    | "scheduled"
    | "assign_category"
    | "assign_tag"
    | "delete";
  categorySlug?: string;
  tagSlug?: string;
}) {
  const session = await requireUser({ audit: "cms.bulkContent" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  if (input.operation === "delete") {
    // Silme artık çöp kutusuna taşır (30 gün geri alınabilir); kalıcı silme Çöp Kutusu sayfasındadır.
    const deletedCount = await repo.trashContents(input.contentIds, session.email);
    await revalidatePath("/admin");
    await revalidatePath("/admin/pages");
    await revalidatePath("/admin/posts");
    await revalidatePath("/admin/contents");
    await revalidatePath("/tr");
    return { ok: true, affected: deletedCount };
  }

  let affected = 0;
  for (const id of input.contentIds) {
    if (input.operation === "publish") {
      await repo.patchContent(id, { status: "published" });
      affected++;
    } else if (input.operation === "draft") {
      await repo.patchContent(id, { status: "draft" });
      affected++;
    } else if (input.operation === "scheduled") {
      // Tarih gerekir: toplu işlemde tarih alınmaz, yalnızca tarihi olan içerik zamanlanır
      if (await repo.patchContent(id, { status: "scheduled" })) affected++;
    } else if (input.operation === "assign_category" && input.categorySlug) {
      const existing = await repo.getContentById(id, "tr");
      if (existing) {
        const rawPub = (existing.schemaAttributes?._publishing ?? {}) as Record<string, any>;
        const currentCats = Array.isArray(rawPub.categories) ? rawPub.categories.map(String) : [];
        const nextCats = Array.from(new Set([...currentCats, input.categorySlug]));
        await repo.patchContent(id, { categories: nextCats });
        affected++;
      }
    } else if (input.operation === "assign_tag" && input.tagSlug) {
      const existing = await repo.getContentById(id, "tr");
      if (existing) {
        const rawPub = (existing.schemaAttributes?._publishing ?? {}) as Record<string, any>;
        const currentTags = Array.isArray(rawPub.tags) ? rawPub.tags.map(String) : [];
        const nextTags = Array.from(new Set([...currentTags, input.tagSlug]));
        await repo.patchContent(id, { tags: nextTags });
        affected++;
      }
    }
  }

  await revalidatePath("/admin");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/tr");
  return { ok: true, affected };
}

export async function duplicateContentAction(input: { contentId: string }) {
  await requireUser({ audit: "cms.duplicateContent" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const newContentId = await repo.duplicateContent(input.contentId, "tr");

  await revalidatePath("/admin");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  return { ok: true, contentId: newContentId };
}

export async function saveTaxonomyAction(input: {
  id?: string;
  taxonomyType: "category" | "tag";
  slug: string;
  name: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  color?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  await requireUser({ audit: "cms.saveTaxonomy" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const saved = await repo.saveTaxonomy(input);
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/admin/taxonomies");
  return { ok: true, taxonomy: saved };
}

export async function deleteTaxonomyAction(input: { id: string }) {
  await requireUser({ audit: "cms.deleteTaxonomy" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const res = await repo.deleteTaxonomy(input.id);
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/admin/taxonomies");
  return { ok: true, deletedId: res.deletedId };
}

export async function saveMediaAssetAction(input: {
  id?: string;
  filename: string;
  url: string;
  altText: string;
  titleText?: string;
  caption?: string;
  description?: string;
  focalPoint?: { x: number; y: number };
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
}) {
  await requireUser({ audit: "cms.saveMediaAsset" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const saved = await repo.saveMediaAsset(input);
  await revalidatePath("/admin/contents");
  await revalidatePath("/admin/media");
  return { ok: true, media: saved };
}

export async function saveCommentReviewAction(input: {
  id?: string;
  contentId: string;
  authorName: string;
  authorEmail?: string;
  entryType: "comment" | "review";
  rating?: number;
  title?: string;
  body: string;
  pros?: string[];
  cons?: string[];
  status?: string;
  isVerified?: boolean;
  parentId?: string | null;
  tags?: string[];
}) {
  await requireUser({ audit: "cms.saveCommentReview" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const saved = await repo.saveCommentReview(input);
  await revalidatePath("/admin/comments");
  await revalidatePath("/tr");
  return { ok: true, item: saved };
}

export async function deleteCommentReviewsAction(input: { ids: string[] }) {
  await requireUser({ audit: "cms.deleteCommentReviews" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const deleted = await repo.deleteCommentReviews(input.ids);
  await revalidatePath("/admin/comments");
  await revalidatePath("/tr");
  return { ok: true, deleted };
}

export async function bulkCommentStatusAction(input: {
  ids: string[];
  status: "approved" | "pending" | "spam";
}) {
  await requireUser({ audit: "cms.bulkCommentStatus" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const all = await repo.listCommentsReviews();
  const idSet = new Set(input.ids);
  let updated = 0;
  for (const item of all) {
    if (!idSet.has(item.id)) continue;
    await repo.saveCommentReview({
      id: item.id,
      contentId: item.contentId,
      authorName: item.authorName,
      authorEmail: item.authorEmail ?? undefined,
      entryType: (item.entryType === "comment" ? "comment" : "review"),
      rating: item.rating,
      title: item.title ?? undefined,
      body: item.body,
      pros: item.pros,
      cons: item.cons,
      status: input.status,
      isVerified: item.isVerified,
      parentId: item.parentId,
      tags: item.tags,
    });
    updated++;
  }
  await revalidatePath("/admin/comments");
  await revalidatePath("/tr");
  return { ok: true, updated };
}

export async function saveChromeAction(input: {
  /** Menünün dili; etkin diller dışındaki değer varsayılan dile düşer */
  locale?: string;
  headerConfig?: HeaderConfig;
  menuItems?: NavigationMenuItem[];
  footerConfig?: FooterConfig;
  sidebarConfig?: SidebarConfig;
  menus?: SiteMenuRecord[];
}) {
  await requireUser({ audit: "cms.saveChrome" });
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const site = await repo.getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const locale = input.locale && site?.supportedLocales.includes(input.locale) ? input.locale : defaultLocale;
  const { locale: _l, menus: rawMenus, menuItems: rawItems, ...rest } = input;
  const menus = rawMenus ? sanitizeMenus(rawMenus) : undefined;
  // Yeni bir dil için ilk kayıtta header/footer varsayılan dilden devralınır (menü o dile özgü olur)
  const base = locale !== defaultLocale && !(await repo.getNavigationLayout(locale)) ? await repo.getNavigationLayout(defaultLocale) : null;
  // Menü sunucuda temizlenir: sınırlar, güvenli adresler (javascript: yok), en çok 3 düzey
  await repo.saveNavigationLayout({
    locale,
    headerConfig: base?.headerConfig,
    footerConfig: base?.footerConfig,
    ...rest,
    ...(rawItems ? { menuItems: sanitizeMenu(rawItems) } : {}),
    ...(menus ? { menus, menuItems: menus.find((m) => m.header)?.items ?? [] } : {}),
  });

  await revalidatePath("/admin/appearance/navigation");
  await revalidatePath("/admin/appearance/header");
  await revalidatePath("/admin/appearance/menus");
  await revalidatePath("/admin/appearance/footer");
  await revalidatePath("/admin/appearance/sidebar");
  await revalidatePath(`/${locale}`, "layout");
  return { ok: true };
}

export async function saveNavigationLayoutAction(input: {
  headerConfig: HeaderConfig;
  menuItems: NavigationMenuItem[];
}) {
  await requireUser();
  return saveChromeAction(input);
}

export type DeleteMediaResult =
  | { ok: true }
  | { ok: false; reason: "in_use"; usage: MediaUsageDto[] }
  | { ok: false; reason: "not_found" };

/**
 * Görseli ve tüm dosyalarını siler. İçeriklerde kullanılıyorsa `force` olmadan reddeder
 * ve kullanım listesini döner (sessiz kırık görsel bırakmaz).
 */
export async function deleteMediaAssetAction(input: { id: string; force?: boolean }): Promise<DeleteMediaResult> {
  const session = await requireAdmin("cms.deleteMediaAsset");
  const media = getMediaAdminRepository(session.siteId);
  if (!input.force) {
    const usage = await media.findUsage(input.id);
    if (usage.length > 0) return { ok: false, reason: "in_use", usage };
  }
  const deleted = await media.deleteAsset(input.id);
  if (!deleted) return { ok: false, reason: "not_found" };
  await removeAsset(session.siteId, input.id);
  await revalidatePath("/admin/media");
  return { ok: true };
}

export type ReindexResult = { ok: true; model: string; semantic: boolean; summary: ReindexSummary } | { ok: false; error: string };

/**
 * Arama dizinini (RAG) yeniden kurar. Değişmeyen içerik için gömme çağrısı yapılmaz;
 * sağlayıcı/model değiştiyse tüm içerik yeniden gömülür.
 */
export async function reindexSearchAction(): Promise<ReindexResult> {
  const session = await requireAdmin("cms.reindexSearch");
  try {
    const provider = providerFromEnv();
    const summary = await reindexSite(session.siteId, "tr", provider);
    await revalidatePath("/admin/seo");
    return { ok: true, model: provider.model, semantic: provider.semantic, summary };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Dizin oluşturulamadı." };
  }
}
