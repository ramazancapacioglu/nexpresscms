import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { CustomerBoard } from "@/components/admin/commerce/customer-board";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const filter = source === "site" || source === "marketplace" ? source : "all";
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const ops = getCommerceOpsRepository(siteId);
  const [customers, groups] = await Promise.all([
    ops.listCustomers(filter === "all" ? undefined : filter),
    ops.listGroups(),
  ]);
  return <CustomerBoard customers={customers} groups={groups} source={filter} />;
}
