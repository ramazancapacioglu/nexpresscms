import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SchemaPlacements } from "@/components/admin/seo/schema-placements";
import { SearchIndexCard } from "@/components/admin/seo/search-index-card";

export const dynamic = "force-dynamic";

/** Kayıtlı şema kuralları ve RAG vektör arama dizini. */
export default async function AdminSeoSchemasPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: site?.defaultLocale ?? "tr" });
  const counts = new Map<string, number>();
  for (const item of contents) {
    if (item.type === "template") continue;
    counts.set(item.schemaType, (counts.get(item.schemaType) ?? 0) + 1);
  }
  const inventory = [...counts.entries()]
    .map(([schemaType, count]) => ({ schemaType, count }))
    .sort((a, b) => b.count - a.count);

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
        title="Şemalar & Arama Dizini"
        description="JSON-LD şema yerleşim kuralları ve yapay zeka / site içi arama için RAG vektör dizini."
      />
      <SchemaPlacements initial={resolveSiteSettings(site?.settings).seo.schemaPlacements ?? []} inventory={inventory} />
      <section id="arama-dizini" className="space-y-2 border-t border-[#E6E7EA] pt-5 dark:border-[#23262E]">
        <SearchIndexCard stats={stats} activeModel={model} semantic={semantic} publishedCount={published} />
      </section>
    </div>
  );
}
