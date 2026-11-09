import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getMarketplaceRepository } from "@nexpress/database";
import { getMarketplaceDriver, registerBuiltinMarketplaceDrivers } from "@nexpress/marketplace";
import { MarketplaceChannelEditor } from "@/components/admin/commerce/marketplace-channel-editor";

export const dynamic = "force-dynamic";

export default async function AdminMarketplaceChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  registerBuiltinMarketplaceDrivers();
  const { id } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getMarketplaceRepository(siteId);
  const channel = await repo.getChannel(id);
  if (!channel) notFound();
  const driver = getMarketplaceDriver(channel.driverId);
  if (!driver) notFound();
  const [jobs, orders] = await Promise.all([repo.listJobs(id), repo.listInboundOrders(id)]);

  return (
    <MarketplaceChannelEditor
      channel={channel}
      driver={{
        id: driver.id,
        name: driver.name,
        summary: driver.summary,
        docsUrl: driver.docsUrl,
        auth: driver.auth,
        credentialFields: driver.credentialFields,
        capabilities: driver.capabilities,
      }}
      jobs={jobs}
      orders={orders}
    />
  );
}
