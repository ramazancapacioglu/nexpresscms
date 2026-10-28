import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { TaxonomyStudioClient } from "@/components/admin/taxonomy-studio-client";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomiesPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const [taxonomies, mediaAssets] = await Promise.all([
    repo.listTaxonomies(),
    repo.listMediaAssets(),
  ]);

  return (
    <TaxonomyStudioClient
      initialTaxonomies={taxonomies}
      initialMediaAssets={mediaAssets}
    />
  );
}
