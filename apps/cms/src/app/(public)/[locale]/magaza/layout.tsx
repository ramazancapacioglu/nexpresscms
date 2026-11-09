import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isPluginModuleEnabled } from "@nexpress/core";
import { COMMERCE_PLUGIN_ID } from "@/lib/plugin-gate";

/** Mağaza vitrini e-ticaret eklentisinin vitrin modülüne bağlıdır. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (!(await isPluginModuleEnabled(siteId, COMMERCE_PLUGIN_ID, "storefront"))) notFound();
  return <>{children}</>;
}
