import React from "react";
import { headers } from "next/headers";
import { getCommerceRepository } from "@nexpress/database";
import { CommerceProductsClient } from "@/components/admin/commerce/commerce-products-client";

export const dynamic = "force-dynamic";

export default async function AdminCommerceProductsPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const products = await repo.listProducts();

  return <CommerceProductsClient products={products} />;
}
