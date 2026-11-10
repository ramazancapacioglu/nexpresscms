import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { ContentListClient } from "@/components/admin/content-list-client";
import { ReadingCard } from "@/components/admin/reading-card";

export const dynamic = "force-dynamic";

export default async function AdminPagesListPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [allContents, taxonomies] = await Promise.all([
    repo.listContents({ locale }),
    repo.listTaxonomies(),
  ]);
  const reading = resolveSiteSettings(site?.settings).general;

  const pageItems = allContents
    .filter((c) => c.type === "page")
    .map((c) => ({
      ...c,
      // Performans: Liste görünümünde sadece blok adedi okunur; tam AST ve markdown aktarılmaz.
      blocks: new Array(Array.isArray(c.blocks) ? c.blocks.length : 0).fill(null as any),
      markdownCache: "",
    }));

  const readingPages = pageItems
    .filter((row) => row.status !== "trashed")
    .map((row) => ({ slug: row.slug, title: row.title }));

  return (
    <div className="space-y-4">
      <ReadingCard pages={readingPages} frontPageSlug={reading.frontPageSlug ?? ""} postsPageSlug={reading.postsPageSlug ?? ""} />
      <ContentListClient
        mode="page"
        items={pageItems}
        taxonomies={taxonomies}
      />
    </div>
  );
}
