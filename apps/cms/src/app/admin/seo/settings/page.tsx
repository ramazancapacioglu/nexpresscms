import React from "react";
import { headers } from "next/headers";
import { pluginRegistry, resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { getPluginState } from "@/lib/plugin-state";
import { SeoTabs } from "@/components/admin/section-tabs";
import "@/plugins/register";
import { PermalinkCard } from "@/components/admin/seo/permalink-card";
import { SeoSettingsPanel } from "./settings-panel";

export const dynamic = "force-dynamic";

const PLUGIN_ID = "@nexpress-pro/agentic-seo";

/** Agentic SEO ayarları. Eklenti sayfası yalnızca modül anahtarını tutar. */
export default async function AdminSeoSettingsPage() {
  await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const manifest = pluginRegistry.list().find((item) => item.id === PLUGIN_ID);
  const site = await getScopedRepository(siteId).getSite();

  return (
    <div className="space-y-4">
      <SeoTabs />
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">SEO ayarları</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Marka, yerel işletme, yorum, yazım kuralları ve kalıcı bağlantılar bu sayfada.</p>
      </div>
      <PermalinkCard initial={resolveSiteSettings(site?.settings).seo.permalinkStructure ?? "postname"} />
      {!manifest ? (
        <p className="text-[13px] text-[#5F6570]">SEO eklentisi yüklü değil.</p>
      ) : (
        <SeoSettingsFormLoader siteId={siteId} siteDna={site?.siteDna ?? ""} manifest={manifest} />
      )}
    </div>
  );
}

async function SeoSettingsFormLoader({
  siteId,
  siteDna,
  manifest,
}: {
  siteId: string;
  siteDna: string;
  manifest: NonNullable<ReturnType<typeof pluginRegistry.list>[number]>;
}) {
  const state = await getPluginState(siteId, manifest);
  const moduleOn = Object.fromEntries(manifest.modules.map((mod) => [mod.id, state.enabled && state.modules[mod.id] === true]));
  return (
    <SeoSettingsPanel
      pluginId={manifest.id}
      fields={manifest.settings ?? []}
      initial={state.settings}
      moduleOn={moduleOn}
      siteDna={siteDna}
      showDna={moduleOn["ai-brand"] === true}
    />
  );
}
