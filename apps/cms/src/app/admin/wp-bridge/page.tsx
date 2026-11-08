import React from "react";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { bridgeReport, type BridgeReport } from "@/lib/wp-bridge/store";
import { WP_BRIDGE_PLUGIN_ID, WP_BRIDGE_VERSION } from "@/plugins/wp-bridge";
import { BridgePanel } from "./bridge-panel";

export const dynamic = "force-dynamic";

export default async function AdminWpBridgePage() {
  const session = await requireAdminPage();
  const report = await bridgeReport(session.siteId);
  const enabled = (await getScopedRepository(session.siteId).getSitePlugin(WP_BRIDGE_PLUGIN_ID))?.enabled ?? true;
  return (
    <div className="space-y-5">
      <div className="border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">WordPress Köprüsü</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Kaynak WordPress, hedef bu sitedir. Sayfa, yazı, yorum, form, şema, medya ve menü eklentiden gelir. E-ticaret gelmez.
        </p>
      </div>
      <BridgePanel version={WP_BRIDGE_VERSION} report={report} pluginOn={enabled} />
    </div>
  );
}
