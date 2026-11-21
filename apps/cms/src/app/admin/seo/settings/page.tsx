import React from "react";
import { headers } from "next/headers";
import { pluginRegistry, resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { getPluginState } from "@/lib/plugin-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import "@/plugins/register";
import { SeoSettingsShell } from "./settings-shell";

export const dynamic = "force-dynamic";

const PLUGIN_ID = "@nexpress-pro/agentic-seo";

/** Agentic SEO ayarları. Eklenti sayfası yalnızca modül anahtarını tutar. */
export default async function AdminSeoSettingsPage() {
  await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const manifest = pluginRegistry.list().find((item) => item.id === PLUGIN_ID);
  const site = await getScopedRepository(siteId).getSite();
  const seo = resolveSiteSettings(site?.settings).seo;
  const { indexNowKey, ...seoForm } = seo;
  const plugin = manifest
    ? await (async () => {
        const state = await getPluginState(siteId, manifest);
        const moduleOn = Object.fromEntries(manifest.modules.map((mod) => [mod.id, state.enabled && state.modules[mod.id] === true]));
        return { fields: manifest.settings ?? [], initial: state.settings, moduleOn, siteDna: site?.siteDna ?? "", showDna: moduleOn["ai-brand"] === true, id: manifest.id };
      })()
    : null;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <AdminPageHeader
        title="SEO Ayarları"
        description="Yayın, başlık ve kimlik, yerel işletme, marka yazımı ve anahtarlar. Site haritası kendi sekmesindedir."
      />
      <SeoSettingsShell
        seo={seoForm}
        siteName={site?.name ?? "Site"}
        pluginId={plugin?.id ?? null}
        fields={plugin?.fields ?? []}
        initial={plugin?.initial ?? {}}
        moduleOn={plugin?.moduleOn ?? {}}
        siteDna={plugin?.siteDna ?? ""}
        showDna={plugin?.showDna ?? false}
        indexNowStored={Boolean(indexNowKey?.trim())}
        indexNowEnv={Boolean(process.env.INDEXNOW_API_KEY?.trim())}
      />
    </div>
  );
}
