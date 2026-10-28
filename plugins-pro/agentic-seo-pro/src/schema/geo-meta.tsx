import React from "react";
import { getPluginSettings } from "@nexpress/core";
import { PLUGIN_ID } from "../module-gate";
import { buildGeoMeta, type LocalBusinessSettings } from "./local-seo";

/** `<head>` geo etiketleri; adres ve koordinat ayarı yoksa hiçbir şey çizmez. */
export async function GeoMeta({ siteId }: { siteId: string }) {
  const settings = (await getPluginSettings(siteId, PLUGIN_ID)) as LocalBusinessSettings;
  if (!settings.city && settings.latitude === undefined) return null;
  return (
    <>
      {buildGeoMeta(settings).map((t) => (
        <meta key={t.name} name={t.name} content={t.content} />
      ))}
    </>
  );
}
