import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { CommerceChrome } from "@/components/admin/commerce/commerce-chrome";
import { COMMERCE_PLUGIN_ID, pluginEnabled } from "@/lib/plugin-gate";

/** E-ticaret paneli yalnızca eklenti açıkken çizilir. */
export default async function AdminCommerceLayout({ children }: { children: React.ReactNode }) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (!(await pluginEnabled(siteId, COMMERCE_PLUGIN_ID))) {
    return (
      <div className="space-y-2">
        <h1 className="text-[18px] font-semibold">E-ticaret kapalı</h1>
        <p className="text-[13px] text-[#5F6570]">Bu bölüm eklentidedir. Açmak için eklenti listesini kullanın.</p>
        <Link href="/admin/plugins" className="text-[13px] text-[#1D5ED8] hover:underline">Eklentiler</Link>
      </div>
    );
  }
  return <CommerceChrome>{children}</CommerceChrome>;
}
