import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { pluginRegistry, pluginSummary, verifyPluginLicenseKey } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { KpiStatCard } from "@/components/admin/ui/saas-charts";
import { Blocks, CheckCircle2, Clock, Sparkles } from "lucide-react";
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
  const site = await getScopedRepository(siteId).getSite();
  const siteDna = site?.siteDna ?? "";
  const tab = sp.tab === "dev" ? "dev" : "installed";

  const manifests = pluginRegistry.list();
  const cards: PluginCardData[] = await Promise.all(
    manifests.map(async (m) => {
      const state = await getPluginState(siteId, m);
      const licenseVerification =
        m.license === "pro"
          ? await verifyPluginLicenseKey(state.licenseKey, {
              pluginId: m.id,
              siteDomain: site?.domain ?? undefined,
            })
          : undefined;
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
        // Yalnızca bildirilen ayar alanları istemciye gider (eklentinin sakladığı sırlar/ölçüm önbelleği gitmez)
        settingValues: Object.fromEntries((m.settings ?? []).filter((f) => state.settings[f.key] !== undefined).map((f) => [f.key, state.settings[f.key]])),
        enabled: state.enabled,
        licenseKey: state.licenseKey ?? "",
        licenseStatus: licenseVerification?.status,
        licenseDaysRemaining: licenseVerification?.daysRemaining ?? null,
        licenseHolder: licenseVerification?.payload?.holder ?? null,
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

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Eklentiler"
        description="Bu site için eklentileri ve modüllerini aç/kapat. Değişiklikler anında geçerli olur."
        actions={
          <div role="tablist" className="inline-flex rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:border-[#23262E] dark:bg-[#1C1E24]">
            {[
              { id: "installed", label: "Kurulu eklentiler", href: "/admin/plugins" },
              { id: "dev", label: "Geliştirici", href: "/admin/plugins?tab=dev" },
              { id: "packages", label: "Paket yükle (.nxplugin)", href: "/admin/plugins/packages" },
            ].map((t) => (
              <Link
                key={t.id}
                href={t.href}
                role="tab"
                aria-selected={tab === t.id}
                className={`rounded-md px-3 py-1 transition ${tab === t.id ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        }
      />

      {tab === "installed" ? (
        <>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            <KpiStatCard
              label="Kurulu Eklenti"
              value={manifests.length}
              badge={`${cards.filter((c) => c.enabled).length} aktif`}
              badgeTone="emerald"
              icon={<Blocks className="h-4 w-4" />}
              iconTone="blue"
            />
            <KpiStatCard
              label="Açık Modül"
              value={totals.active}
              suffix={`/ ${totals.ready}`}
              badgeTone="emerald"
              progressPct={totals.ready > 0 ? (totals.active / totals.ready) * 100 : 0}
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconTone="emerald"
            />
            <KpiStatCard
              label="Hazır Modül"
              value={totals.ready}
              hint="Anında etkinleştirilebilir"
              icon={<Sparkles className="h-4 w-4" />}
              iconTone="violet"
            />
            <KpiStatCard
              label="Yolda (Yakında)"
              value={totals.planned}
              hint="Planlanan modüller"
              icon={<Clock className="h-4 w-4" />}
              iconTone="amber"
            />
          </div>
          <PluginsManager plugins={cards} siteDna={siteDna} initialId={sp.plugin && cards.some((c) => c.id === sp.plugin) ? sp.plugin : cards[0]?.id ?? ""} />
        </>
      ) : (
        <DeveloperView />
      )}
    </div>
  );
}
