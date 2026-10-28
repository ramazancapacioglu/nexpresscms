import React from "react";
import { headers } from "next/headers";
import { getCommerceRepository } from "@nexpress/database";
import { CommerceHub } from "@/components/admin/commerce/commerce-hub";

export const dynamic = "force-dynamic";

export default async function AdminCommercePage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const [settings, products, orders] = await Promise.all([
    repo.getCommerceSettings(),
    repo.listProducts(),
    repo.listOrders(20),
  ]);

  return (
    <CommerceHub
      settings={settings}
      products={products}
      orders={orders}
      shopPublicPath={`/tr/${settings.shopBasePath}`}
    />
  );
}
