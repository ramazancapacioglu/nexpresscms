import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { pluginRegistry, pluginSummary } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { getPluginState } from "@/lib/plugin-state";
import "@/plugins/register";
import { DeveloperView } from "./developer-view";
import { PluginsManager, type PluginCardData } from "./plugins-manager";

export const dynamic = "force-dynamic";

export default async function AdminPluginsPage({ searchParams }: { searchParams?: Promise<{ tab?: string; plugin?: string }> }) {
  await requireAdminPage();
  const sp = searchParams ? await searchParams : {};
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const siteDna = (await getScopedRepository(siteId).getSite())?.siteDna ?? "";
  const tab = sp.tab === "dev" ? "dev" : "installed";

  const manifests = pluginRegistry.list();
  const cards: PluginCardData[] = await Promise.all(
    manifests.map(async (m) => {
      const state = await getPluginState(siteId, m);
      return {
        id: m.id,
        name: m.name,
        version: m.version,
        vendor: m.vendor,
        license: m.license,
        builtin: Boolean(m.builtin),
        icon: m.icon,
        description: m.description,
        settingsHref: m.settingsHref,
        endpoints: m.endpoints ?? [],
        settingFields: m.settings ?? [],
        settingValues: state.settings,
        enabled: state.enabled,
        modules: m.modules.map((mod) => ({
          id: mod.id,
          label: mod.label,
          description: mod.description,
          group: mod.group,
          status: mod.status,
          on: state.modules[mod.id] === true,
          surfaces: mod.surfaces ?? [],
        })),
      };
    })
  );

  const totals = manifests.reduce(
    (acc, m, i) => {
      const s = pluginSummary(m, { enabled: cards[i]!.enabled, modules: Object.fromEntries(cards[i]!.modules.map((x) => [x.id, x.on])), settings: {} });
      return { ready: acc.ready + s.ready, planned: acc.planned + s.planned, active: acc.active + (cards[i]!.enabled ? s.active : 0) };
    },
    { ready: 0, planned: 0, active: 0 }
  );

  const stats = [
    { label: "Kurulu eklenti", value: manifests.length },
    { label: "Açık modül", value: totals.active },
    { label: "Hazır modül", value: totals.ready },
    { label: "Yolda (yakında)", value: totals.planned },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] pb-3.5">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Eklentiler</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Bu site için eklentileri ve modüllerini aç/kapat. Değişiklikler anında geçerli olur.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5 text-[12px] font-medium">
          {[
            { id: "installed", label: "Kurulu eklentiler", href: "/admin/plugins" },
            { id: "dev", label: "Geliştirici", href: "/admin/plugins?tab=dev" },
          ].map((t) => (
            <Link
              key={t.id}
              href={t.href}
              role="tab"
              aria-selected={tab === t.id}
              className={`rounded px-3 py-1 transition ${tab === t.id ? "bg-white dark:bg-[#2A2D35] text-[#14151A] dark:text-[#F3F4F6] shadow-sm" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {tab === "installed" ? (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-3.5 py-2.5">
                <dt className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{s.label}</dt>
                <dd className="text-[20px] font-semibold tabular-nums text-[#14151A] dark:text-[#F3F4F6]">{s.value}</dd>
              </div>
            ))}
          </dl>
          <PluginsManager plugins={cards} siteDna={siteDna} initialId={sp.plugin && cards.some((c) => c.id === sp.plugin) ? sp.plugin : cards[0]?.id ?? ""} />
        </>
      ) : (
        <DeveloperView />
      )}
    </div>
  );
}
