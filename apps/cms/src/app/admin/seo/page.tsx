import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { LinkAuditCard } from "@/components/admin/seo/link-audit-card";
import { SearchIndexCard } from "@/components/admin/seo/search-index-card";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SeoStudio } from "@/components/admin/seo/seo-studio";
import { buildSeoSummary } from "@/components/admin/seo/seo-summary";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: "tr" });
  const seo = resolveSiteSettings(site?.settings).seo;
  const summary = buildSeoSummary(contents, seo);

  const provider = providerFromEnv();
  const stats = await getChunkRepository(siteId).stats();
  const published = contents.filter((c) => c.status === "published").length;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <SearchIndexCard
        stats={stats}
        activeModel={provider.model}
        semantic={provider.semantic}
        publishedCount={published}
      />
      <LinkAuditCard contents={contents} locales={site?.supportedLocales ?? ["tr"]} />
      <SeoStudio initial={seo} summary={summary} siteName={site?.name ?? "NexPress"} />
    </div>
  );
}
