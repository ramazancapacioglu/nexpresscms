import React from "react";
import { headers } from "next/headers";
import { resolvePublishing, resolveSiteSettings } from "@nexpress/core";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SchemaStudio, type SchemaStudioContentSummary } from "@/components/admin/seo/schema-studio/schema-studio";
import { SearchIndexCard } from "@/components/admin/seo/search-index-card";

export const dynamic = "force-dynamic";

const BUILTIN_TYPES = [
  { id: "page", label: "Sayfa (page)" },
  { id: "post", label: "Blog Yazısı (post)" },
  { id: "kb_tech", label: "Bilgi Bankası (kb_tech)" },
  { id: "ai_prompt", label: "Soru-Cevap (ai_prompt)" },
  { id: "campaign", label: "Kampanya (campaign)" },
  { id: "product", label: "Ürün (product)" },
];

/** Gelişmiş Şema & Entity Graph Stüdyosu + RAG vektör arama dizini. */
export default async function AdminSeoSchemasPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [contents, taxonomies] = await Promise.all([
    repo.listContents({ locale }),
    repo.listTaxonomies(),
  ]);

  const settings = resolveSiteSettings(site?.settings);
  const counts = new Map<string, number>();
  const summaries: SchemaStudioContentSummary[] = [];

  for (const item of contents) {
    if (item.type === "template" || item.status === "trashed") continue;
    counts.set(item.schemaType, (counts.get(item.schemaType) ?? 0) + 1);
    const pub = resolvePublishing(item.schemaAttributes);
    summaries.push({
      contentId: item.contentId,
      title: item.title,
      slug: item.slug,
      type: item.type,
      schemaType: item.schemaType,
      categories: pub.categories,
      tags: pub.tags,
    });
  }

  const inventory = [...counts.entries()]
    .map(([schemaType, count]) => ({ schemaType, count }))
    .sort((a, b) => b.count - a.count);

  const categories = taxonomies
    .filter((t) => t.taxonomyType === "category")
    .map((t) => ({ id: t.slug, label: t.name, sub: t.slug }));
  const tags = taxonomies
    .filter((t) => t.taxonomyType === "tag")
    .map((t) => ({ id: t.slug, label: t.name, sub: t.slug }));
  const customTypes = [
    ...BUILTIN_TYPES,
    ...(settings.general.contentTypes ?? []).map((ct) => ({
      id: ct.id,
      label: `${ct.labelPlural} (${ct.id})`,
    })),
  ];

  let model = "yerel";
  let semantic = false;
  try {
    const provider = providerFromEnv();
    model = provider.model;
    semantic = provider.semantic;
  } catch {
    model = "anahtar yok";
  }
  const stats = await getChunkRepository(siteId).stats();
  const published = contents.filter((c) => c.status === "published").length;

  return (
    <div className="space-y-6">
      <SeoTabs />
      <AdminPageHeader
        title="Şemalar, Entity Graph & Arama Dizini"
        description="Dinamik değişkenli JSON-LD kuralları, dahil/hariç hedefleme, Speakable AI alıntı işaretlemesi, Wikidata Entity Graph ve canlı Bot/AI doğrulayıcı."
      />
      <SchemaStudio
        initial={settings.seo.schemaPlacements ?? []}
        inventory={inventory}
        contents={summaries}
        categories={categories}
        tags={tags}
        contentTypes={customTypes}
      />
      <section id="arama-dizini" className="space-y-2 border-t border-[#E6E7EA] pt-5 dark:border-[#23262E]">
        <SearchIndexCard stats={stats} activeModel={model} semantic={semantic} publishedCount={published} />
      </section>
    </div>
  );
}
