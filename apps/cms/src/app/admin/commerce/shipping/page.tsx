import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { ShippingBoard } from "@/components/admin/commerce/shipping-board";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const methods = await getCommerceOpsRepository(siteId).listShipping();
  return <ShippingBoard methods={methods} />;
}
