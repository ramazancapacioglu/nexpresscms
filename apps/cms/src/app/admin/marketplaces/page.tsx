import React from "react";
import { headers } from "next/headers";
import { getMarketplaceRepository } from "@nexpress/database";
import { listMarketplaceDrivers, registerBuiltinMarketplaceDrivers } from "@nexpress/marketplace";
import { MarketplaceStudio } from "@/components/admin/commerce/marketplace-studio";

export const dynamic = "force-dynamic";

export default async function AdminMarketplacesPage() {
  registerBuiltinMarketplaceDrivers();
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const channels = await getMarketplaceRepository(siteId).listChannels();
  const drivers = listMarketplaceDrivers().map((driver) => ({
    id: driver.id,
    name: driver.name,
    summary: driver.summary,
    docsUrl: driver.docsUrl,
    auth: driver.auth,
    credentialFields: driver.credentialFields,
    capabilities: driver.capabilities,
  }));

  return (
    <MarketplaceStudio
      drivers={drivers}
      channels={channels.map(({ credentials, ...channel }) => ({
        ...channel,
        credentialKeys: Object.keys(credentials),
      }))}
    />
  );
}
