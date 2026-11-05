import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import Link from "next/link";
import { LinkAuditCard } from "@/components/admin/seo/link-audit-card";
import { ExternalLinkAudit } from "@/components/admin/seo/external-link-audit";
import { SearchIndexCard } from "@/components/admin/seo/search-index-card";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SeoStudio } from "@/components/admin/seo/seo-studio";
import { buildSeoSummary } from "@/components/admin/seo/seo-summary";

export const dynamic = "force-dynamic";

/** Motor, dizin ve bağlantı denetimi. Konsol bağlantısı webmaster sekmesindedir. */
export default async function AdminSeoEnginePage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: site?.defaultLocale ?? "tr" });
  const seo = resolveSiteSettings(site?.settings).seo;
  const summary = buildSeoSummary(contents, seo);
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
    <div className="space-y-4">
      <SeoTabs />
      <SearchIndexCard stats={stats} activeModel={model} semantic={semantic} publishedCount={published} />
      <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
        Search Console, Analytics, Bing ve Yandex bağlantıları{" "}
        <Link href="/admin/seo/integrations" className="font-medium text-blue-700 underline dark:text-blue-300">
          Webmaster ve analitik
        </Link>{" "}
        sayfasındadır.
      </p>
      <LinkAuditCard contents={contents} locales={site?.supportedLocales ?? ["tr"]} />
      <ExternalLinkAudit />
      <SeoStudio initial={seo} summary={summary} siteName={site?.name ?? "NexPress"} />
    </div>
  );
}
