import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { ContentListClient } from "@/components/admin/content-list-client";

export const dynamic = "force-dynamic";

export default async function AdminPostsListPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const [allContents, taxonomies] = await Promise.all([
    repo.listContents({ locale: "tr" }),
    repo.listTaxonomies(),
  ]);

  const postItems = allContents
    .filter(
      (c) => c.type === "post" || c.type === "kb_tech" || c.type === "ai_prompt"
    )
    .map((c) => ({
      ...c,
      // Performans: Liste görünümünde sadece blok adedi okunur; tam AST ve markdown aktarılmaz.
      blocks: new Array(Array.isArray(c.blocks) ? c.blocks.length : 0).fill(null as any),
      markdownCache: "",
    }));

  return (
    <ContentListClient
      mode="post"
      items={postItems}
      taxonomies={taxonomies}
    />
  );
}
