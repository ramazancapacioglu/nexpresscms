import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { resolveCampaignData } from "@nexpress/core";
import { CampaignEditorClient } from "./campaign-editor-client";

export const dynamic = "force-dynamic";

export default async function AdminCampaignEditPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; new?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const site = await repo.getSite();
  const siteName = site?.name ?? "NexPress CMS";
  const siteUrl = site?.domain
    ? `https://${site.domain}`
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let initialCampaign = null;
  if (sp.id) {
    const allContents = await repo.listContents({ locale: "tr" });
    const match = allContents.find((c) => c.contentId === sp.id || c.id === sp.id);
    if (match) {
      initialCampaign = resolveCampaignData(match);
    }
  }

  return (
    <CampaignEditorClient
      initialCampaign={initialCampaign}
      siteName={siteName}
      siteUrl={siteUrl}
    />
  );
}

