import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { CampaignBoard } from "@/components/admin/commerce/campaign-board";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const ops = getCommerceOpsRepository(siteId);
  const [campaigns, coupons, groups, customers] = await Promise.all([
    ops.listCampaigns(),
    ops.listCoupons(),
    ops.listGroups(),
    ops.listCustomers(),
  ]);
  return <CampaignBoard campaigns={campaigns} coupons={coupons} groups={groups} customers={customers} />;
}
