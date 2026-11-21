"use server";

import {
  buildAdditionalSchemaNodes,
  buildPlacementExtraProps,
  resolveLocalizedSiteIdentity,
  resolvePublishing,
  resolveSchemaPlacements,
  sanitizeSchemaPlacements,
  type SchemaPlacement,
} from "@nexpress/core";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { buildPageSchemaGraph, validateSchemaGraph, type SchemaIssue } from "@nexpress/seo-core";
import { requireUser } from "@/lib/auth/session";
import { organizationFor } from "@/lib/organization-schema";
import { schemaImagesFor } from "@/lib/schema-images";

export interface SchemaPreviewResult {
  ok: true;
  title: string;
  url: string;
  effectiveType: string;
  matchedPrimaryName: string | null;
  matchedAdditionalNames: string[];
  jsonLd: string;
  issues: SchemaIssue[];
  markdown: string;
  chunks: Array<{ index: number; headingPath: string; wordCount: number; preview: string }>;
}

/**
 * "Bot & AI Gözüyle Gör" önizleme eylemi:
 * Seçili gerçek içerik üzerinde taslak şema kurallarıyla üretilecek JSON-LD `@graph`,
 * `validateSchemaGraph` sonuçları, AI Markdown ve RAG vektör parçalarını döner.
 */
export async function previewSchemaForContentAction(input: {
  contentId: string;
  draftRules: SchemaPlacement[];
}): Promise<SchemaPreviewResult | { ok: false; error: string }> {
  const me = await requireUser({ audit: "seo.schemaPreview" });
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const all = await repo.listContents({ locale });
  const content = all.find((c) => c.contentId === input.contentId || c.id === input.contentId);
  if (!content) return { ok: false, error: "Önizlenecek içerik bulunamadı." };

  const cleanRules = sanitizeSchemaPlacements(input.draftRules);
  const pub = resolvePublishing(content.schemaAttributes);
  const placements = resolveSchemaPlacements(cleanRules, {
    contentId: content.contentId,
    type: content.type,
    schemaType: content.schemaType,
    categories: pub.categories,
    tags: pub.tags,
  });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const pagePath = content.slug === "ana-sayfa" || content.slug === "home" ? "/" : `/${content.slug}`;
  const pageUrl = `${baseUrl}${pagePath}`;
  const localizedSite = resolveLocalizedSiteIdentity(site, locale);
  const featuredImageUrl = pub.featuredImageUrl ?? undefined;
  const schemaMedia = await schemaImagesFor(me.siteId, content.blocks, featuredImageUrl);

  const schemaVars = {
    title: content.title,
    tldr: content.tldr ?? undefined,
    url: pageUrl,
    image:
      featuredImageUrl ??
      `${baseUrl}/og?title=${encodeURIComponent(content.title)}&site=${encodeURIComponent(localizedSite.name)}`,
    author: pub.authorName || content.authorName || localizedSite.name,
    site: localizedSite.name,
    siteUrl: baseUrl,
    category: pub.categories[0] ?? "",
    keywords: [pub.focusKeyword, ...pub.tags].filter(Boolean).join(", "),
    datePublished: (content.publishedAt ?? content.createdAt ?? content.updatedAt)?.toISOString?.() ?? "",
    dateModified: content.updatedAt?.toISOString?.() ?? "",
  };

  const graph = await buildPageSchemaGraph({
    siteId: me.siteId,
    siteName: localizedSite.name,
    siteUrl: baseUrl,
    locale,
    pageUrl,
    images: schemaMedia.images,
    autoSchema: localizedSite.seo.autoSchema !== false,
    organization: organizationFor(localizedSite.seo),
    content: {
      id: content.id,
      title: content.title,
      tldr: content.tldr,
      schemaType: placements.primary?.schemaType ?? content.schemaType,
      schemaAttributes: content.schemaAttributes,
      authorName: pub.authorName || content.authorName,
      updatedAt: content.updatedAt,
      publishedAt: content.publishedAt ?? content.createdAt ?? null,
      blocks: content.blocks,
      imageMeta: schemaMedia.featured,
      extraProps: buildPlacementExtraProps(placements.primary, schemaVars),
      imageUrl: schemaVars.image,
    },
  });

  for (const extraNode of buildAdditionalSchemaNodes(placements.additional, schemaVars)) {
    graph["@graph"].push(extraNode as never);
  }

  const issues = validateSchemaGraph(graph["@graph"]);
  const rawChunks = await getChunkRepository(me.siteId).listForContent(content.contentId, locale);

  return {
    ok: true,
    title: content.title,
    url: pageUrl,
    effectiveType: placements.primary?.schemaType ?? content.schemaType,
    matchedPrimaryName: placements.primary?.name ?? null,
    matchedAdditionalNames: placements.additional.map((r) => `${r.name} (${r.schemaType})`),
    jsonLd: JSON.stringify(graph, null, 2),
    issues,
    markdown: content.markdownCache || "(Bu içerik için henüz Markdown önbelleği üretilmemiş.)",
    chunks: rawChunks.slice(0, 12).map((ch) => ({
      index: ch.chunkIndex,
      headingPath: ch.headingPath || content.title,
      wordCount: ch.wordCount,
      preview: ch.chunkText.slice(0, 260),
    })),
  };
}
