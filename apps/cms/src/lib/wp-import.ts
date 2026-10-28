import "server-only";
import { randomBytes } from "node:crypto";
import { buildMediaRef, type BlockNode } from "@nexpress/core";
import { getRedirectRepository, getScopedRepository } from "@nexpress/database";
import { parseWxr, buildPlan, WxrError, type ImportOptions, type ImportPlan } from "@nexpress/wp-importer";
import { MAX_UPLOAD_BYTES, inspectUpload } from "@/lib/media/process";
import { putOriginal } from "@/lib/media/storage";
import { fetchPublicFile } from "@/lib/safe-fetch";

export const WP_IMPORT_LIMITS = { fileBytes: 64 * 1024 * 1024, images: 400, imageConcurrency: 4 } as const;

export interface WpRunOptions extends ImportOptions {
  createRedirects: boolean;
  downloadImages: boolean;
  /** Aynı WordPress kimliği daha önce içe alındıysa güncelle (yoksa atla) */
  update: boolean;
}

export interface WpImportReport {
  created: number;
  updated: number;
  skippedExisting: number;
  failed: Array<{ title: string; error: string }>;
  terms: { created: number };
  redirects: { created: number; skipped: number };
  images: { downloaded: number; failed: number; skippedOverLimit: number };
  warnings: string[];
}

export type ParsedWp = { ok: true; plan: ImportPlan } | { ok: false; error: string };

export function planFromXml(xml: string, options: ImportOptions): ParsedWp {
  try {
    return { ok: true, plan: buildPlan(parseWxr(xml), options) };
  } catch (e) {
    return { ok: false, error: e instanceof WxrError ? e.message : "Dosya işlenemedi." };
  }
}

const contentIdFor = (siteId: string, wpId: string) => `cnt_wp_${siteId === "default" ? "" : `${siteId}_`}${wpId}`.replace(/[^A-Za-z0-9_-]/g, "_");

/** Plan hazırlandıktan sonra yazar: terimler → görseller → içerikler → yönlendirmeler. İçerik başına hata diğerlerini durdurmaz. */
export async function runWpImport(siteId: string, plan: ImportPlan, opts: WpRunOptions, actor: { id: string; email: string }): Promise<WpImportReport> {
  const repo = getScopedRepository(siteId);
  const report: WpImportReport = { created: 0, updated: 0, skippedExisting: 0, failed: [], terms: { created: 0 }, redirects: { created: 0, skipped: 0 }, images: { downloaded: 0, failed: 0, skippedOverLimit: 0 }, warnings: [] };

  // 1) Terimler (kategori üst-alt ilişkisi ikinci geçişte kurulur)
  const existingTerms = await repo.listTaxonomies();
  const termKey = (type: string, slug: string) => `${type}:${slug}`;
  const have = new Map(existingTerms.map((t) => [termKey(t.taxonomyType, t.slug), t]));
  const idBySlug = new Map<string, string>();
  for (const t of plan.terms) {
    const type = t.kind;
    const hit = have.get(termKey(type, t.slug));
    if (hit) { idBySlug.set(termKey(type, t.slug), hit.id); continue; }
    const saved = await repo.saveTaxonomy({ taxonomyType: type, slug: t.slug, name: t.name });
    idBySlug.set(termKey(type, t.slug), saved.id);
    report.terms.created++;
  }
  for (const t of plan.terms) {
    if (t.kind !== "category" || !t.parentSlug) continue;
    const id = idBySlug.get(termKey("category", t.slug));
    const parentId = idBySlug.get(termKey("category", t.parentSlug));
    const cur = have.get(termKey("category", t.slug));
    if (id && parentId && !cur) await repo.saveTaxonomy({ id, taxonomyType: "category", slug: t.slug, name: t.name, parentId });
  }

  // 2) Görseller (isteğe bağlı): yalnızca genel adresler, boyut/tür doğrulamalı
  const urlMap = new Map<string, string>();
  if (opts.downloadImages) {
    const urls = plan.imageUrls.slice(0, WP_IMPORT_LIMITS.images);
    report.images.skippedOverLimit = Math.max(0, plan.imageUrls.length - urls.length);
    let next = 0;
    const worker = async () => {
      while (next < urls.length) {
        const url = urls[next++]!;
        try {
          const { data } = await fetchPublicFile(url, { maxBytes: MAX_UPLOAD_BYTES });
          const info = await inspectUpload(data);
          const id = `med_${randomBytes(9).toString("base64url")}`;
          await putOriginal(siteId, id, data);
          const name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "gorsel").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || "gorsel";
          await repo.saveMediaAsset({ id, filename: name, url: buildMediaRef({ id, width: info.width, height: info.height, hasAlpha: info.hasAlpha }), mimeType: info.mimeType, width: info.width, height: info.height, sizeBytes: data.length, altText: "" });
          urlMap.set(url, buildMediaRef({ id, width: info.width, height: info.height, hasAlpha: info.hasAlpha }));
          report.images.downloaded++;
        } catch {
          report.images.failed++;
        }
      }
    };
    await Promise.all(Array.from({ length: WP_IMPORT_LIMITS.imageConcurrency }, worker));
  }
  const remap = (blocks: BlockNode[]): BlockNode[] =>
    blocks.map((b) => (b.type === "image_figure" && typeof b.props?.url === "string" && urlMap.has(b.props.url) ? { ...b, props: { ...b.props, url: urlMap.get(b.props.url)! } } : b));

  // 3) İçerikler
  const locale = opts.locale;
  const siteContents = await repo.listContents({ locale });
  const slugOwner = new Map(siteContents.map((c) => [`${c.type}:${c.slug}`, c.id]));
  const saved: Array<{ slug: string; oldPath: string; published: boolean }> = [];
  for (const item of plan.items) {
    const contentId = contentIdFor(siteId, item.wpId);
    try {
      const existing = await repo.getContentById(contentId, locale);
      if (existing && !opts.update) { report.skippedExisting++; continue; }
      let slug = existing?.slug ?? item.slug;
      if (!existing) {
        let n = 2;
        while (slugOwner.has(`${item.contentType}:${slug}`) && slugOwner.get(`${item.contentType}:${slug}`) !== contentId) slug = `${item.slug.slice(0, 94)}-${n++}`;
        slugOwner.set(`${item.contentType}:${slug}`, contentId);
      }
      const featured = item.featuredImageUrl ? urlMap.get(item.featuredImageUrl) ?? item.featuredImageUrl : null;
      await repo.saveContent({
        actor,
        contentId,
        type: item.contentType,
        status: item.status,
        importanceScore: item.contentType === "product" ? 8 : item.contentType === "page" ? 7 : 6,
        schemaType: item.schemaType,
        schemaAttributes: {
          ...(existing?.schemaAttributes ?? {}),
          migratedFrom: "wordpress",
          wpId: item.wpId,
          originalPermalink: item.oldPath,
          _publishing: {
            ...(((existing?.schemaAttributes ?? {}) as Record<string, unknown>)._publishing as object | undefined),
            visibility: item.visibility,
            authorName: item.authorName || undefined,
            categories: item.categories,
            tags: item.tags,
            featuredImageUrl: featured || undefined,
            focusKeyword: item.focusKeyword || undefined,
          },
        },
        featuredImage: featured,
        locale,
        slug,
        title: item.title,
        excerpt: item.excerpt || undefined,
        tldr: item.tldr || undefined,
        blocks: remap(item.blocks),
        metaTitle: item.metaTitle || undefined,
        metaDescription: item.metaDescription || undefined,
        noIndex: item.noIndex,
        ...(item.date && !existing ? { publishedAt: item.date } : {}),
      });
      if (existing) report.updated++;
      else report.created++;
      saved.push({ slug, oldPath: item.oldPath, published: item.status === "published" && item.visibility === "public" });
    } catch (e) {
      report.failed.push({ title: item.title, error: e instanceof Error ? e.message.slice(0, 200) : "Bilinmeyen hata" });
    }
  }

  // 4) Yönlendirmeler: eski adres → yeni adres (yalnızca herkese açık yayındakiler)
  if (opts.createRedirects) {
    const redirects = getRedirectRepository(siteId);
    for (const s of saved) {
      const to = `/${locale}/${s.slug}`;
      if (!s.published || !s.oldPath || s.oldPath === to) { report.redirects.skipped++; continue; }
      const r = await redirects.save({ fromPath: s.oldPath, toPath: to, code: 301, note: "WordPress içe aktarma" });
      if (r.ok) report.redirects.created++;
      else report.redirects.skipped++;
    }
  }
  if (report.skippedExisting) report.warnings.push(`${report.skippedExisting} içerik daha önce içe alındığı için atlandı (güncellemek için seçeneği işaretleyin).`);
  return report;
}
