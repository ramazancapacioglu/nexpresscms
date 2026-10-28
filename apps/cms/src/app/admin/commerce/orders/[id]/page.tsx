import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCommerceRepository } from "@nexpress/database";
import { CommerceOrderDetail } from "@/components/admin/commerce/commerce-order-detail";

export const dynamic = "force-dynamic";

export default async function AdminCommerceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const order = await repo.getOrderById(id);
  if (!order) notFound();

  return <CommerceOrderDetail order={order} />;
}
