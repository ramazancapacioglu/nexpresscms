import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { MARKETPLACE_PLUGIN_ID, pluginEnabled } from "@/lib/plugin-gate";

/** Sanal mağaza paneli e-ticaret menüsünün dışında durur. */
export default async function AdminMarketplacesLayout({ children }: { children: React.ReactNode }) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (!(await pluginEnabled(siteId, MARKETPLACE_PLUGIN_ID))) {
    return (
      <div className="space-y-2">
        <h1 className="text-[18px] font-semibold">Sanal mağaza kapalı</h1>
        <p className="text-[13px] text-[#5F6570]">Kanal bağlantıları ayrı eklentidedir. Açmak için eklenti listesini kullanın.</p>
        <Link href="/admin/plugins" className="text-[13px] text-[#1D5ED8] hover:underline">Eklentiler</Link>
      </div>
    );
  }
  return <>{children}</>;
}
