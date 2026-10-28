import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { ReturnsBoard } from "@/components/admin/commerce/returns-board";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const returns = await getCommerceOpsRepository(siteId).listReturns();
  return <ReturnsBoard returns={returns} />;
}
