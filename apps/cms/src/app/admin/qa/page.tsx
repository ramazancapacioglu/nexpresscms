import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { ContentListClient } from "@/components/admin/content-list-client";

export const dynamic = "force-dynamic";

/** Soru-cevap sayfaları (`ai_prompt`): sayfa ve blog listeleriyle aynı liste; ziyaretçi soruları ayrı olarak Gelen sorular'dadır. */
export default async function AdminQaListPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const [allContents, taxonomies] = await Promise.all([repo.listContents({ locale: site?.defaultLocale ?? "tr" }), repo.listTaxonomies()]);

  const items = allContents
    .filter((c) => c.type === "ai_prompt")
    .map((c) => ({
      ...c,
      // Performans: Liste görünümünde sadece blok adedi okunur; tam AST ve markdown aktarılmaz.
      blocks: new Array(Array.isArray(c.blocks) ? c.blocks.length : 0).fill(null as any),
      markdownCache: "",
    }));

  return <ContentListClient mode="ai_prompt" items={items} taxonomies={taxonomies} />;
}
