import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { describePermissions, parseTrustedKeys } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { DataPluginsPanel, type DataPluginView } from "./data-plugins-panel";

export const dynamic = "force-dynamic";

/** `.nxplugin` veri eklentileri: yükleme, izin özeti, etkinleştirme (açık onayla), webhook sırrı. */
export default async function DataPluginsPage() {
  const me = await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  const plugins = await getScopedRepository(siteId).listDataPlugins();
  const views: DataPluginView[] = plugins.map((p) => ({
    id: p.pluginId,
    name: p.manifest.name,
    version: p.manifest.version,
    vendor: p.manifest.vendor,
    description: p.manifest.description,
    homepage: p.manifest.homepage ?? null,
    enabled: p.enabled,
    signature: p.signature,
    permissions: describePermissions({ contentTypes: p.contentTypes, pages: p.pages as Array<{ slug: string; title: string }>, webhooks: p.webhooks }),
    hasPages: p.pages.length > 0,
    hasWebhooks: p.webhooks.length > 0,
    lastDelivery: p.lastDelivery,
    installedAt: p.installedAt.toISOString().slice(0, 10),
  }));
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div>
          <h1 className="text-[18px] font-semibold">Eklenti paketleri (.nxplugin)</h1>
          <p className="max-w-[70ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Veri eklentileri <strong>kod çalıştırmaz</strong>: özel içerik türleri, taslak başlangıç sayfaları ve imzalı giden webhook bildirimleri ekler. Yüklemek etkinleştirmek değildir; etkinleştirmeden önce paketin yapacağı her şey listelenir ve onayınız istenir.
          </p>
        </div>
        <Link href="/admin/plugins" className="text-[12px] text-[#266DF0] hover:underline">← Eklentiler</Link>
      </header>
      <DataPluginsPanel plugins={views} trustedKeyCount={parseTrustedKeys(process.env.PLUGIN_TRUSTED_KEYS).length} />
    </div>
  );
}
