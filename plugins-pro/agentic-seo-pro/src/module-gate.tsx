import React from "react";
import { isPluginModuleEnabled } from "@nexpress/core";

export const PLUGIN_ID = "@nexpress-pro/agentic-seo";

/** Sunucu bileşeni kapısı: modül kapalıysa yuva hiçbir şey çizmez. */
export async function ModuleGate({ siteId, module, children }: { siteId: string; module: string; children: React.ReactNode }) {
  return (await isPluginModuleEnabled(siteId, PLUGIN_ID, module)) ? <>{children}</> : null;
}
