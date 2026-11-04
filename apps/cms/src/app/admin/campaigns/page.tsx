import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { resolveCampaignData, type ResolvedCampaign } from "@nexpress/core";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsListPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  // Hem doğrudan campaign tipindeki içerikleri hem de legacy camp_* meta alanlı içerikleri listele
  const allContents = await repo.listContents({ locale: "tr" });

  const campaignContents = allContents.filter(
    (c) =>
      c.type === "campaign" ||
      Boolean(
        c.schemaAttributes?.camp_discount ||
        c.schemaAttributes?.camp_name ||
        (c.schemaAttributes?.campaign as Record<string, unknown> | undefined)?.discount
      )
  );

  const resolvedCampaigns: ResolvedCampaign[] = campaignContents.map((c) =>
    resolveCampaignData(c)
  );

  return <CampaignsClient campaigns={resolvedCampaigns} />;
}

