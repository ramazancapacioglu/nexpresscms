import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { ContentListClient } from "@/components/admin/content-list-client";

export const dynamic = "force-dynamic";

export default async function AdminPagesListPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const [allContents, taxonomies] = await Promise.all([
    repo.listContents({ locale: "tr" }),
    repo.listTaxonomies(),
  ]);

  const pageItems = allContents.filter((c) => c.type === "page");

  return (
    <ContentListClient
      mode="page"
      items={pageItems}
      taxonomies={taxonomies}
    />
  );
}
