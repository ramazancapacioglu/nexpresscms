import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { PluginSlot, slotRegistry } from "@nexpress/core";
import {
  getBotStatsRepository,
  getChunkRepository,
  getIntelRepository,
  getRedirectRepository,
  getScopedRepository,
} from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { KpiStatCard } from "@/components/admin/ui/saas-charts";
import { Activity, Bot, Database, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const GROUPS = [
  {
    id: "visibility",
    slot: "seo.reports.visibility" as const,
    title: "Görünürlük & AI",
    detail: "AI yönlendirme, bot taraması, alıntı hazırlığı, MCP günlüğü, yorumlar ve cevapsız aramalar.",
  },
  {
    id: "content",
    slot: "seo.reports.content" as const,
    title: "İçerik Sağlığı",
    detail: "İçerik açığı, erime (decay), kaynak denetimi ve katalog iyileştirmeleri.",
  },
  {
    id: "queries",
    slot: "seo.reports.queries" as const,
    title: "Sorgular & Kümeler",
    detail: "Kayıtlı kelimeler, konu kümeleri ve arama motoru sorgu fırsatları.",
  },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

export default async function AdminSeoReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [reqHeaders, sp] = await Promise.all([headers(), searchParams]);
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const activeId: GroupId =
    sp.group === "content" || sp.group === "queries" || sp.group === "visibility"
      ? sp.group
      : "visibility";
  const active = GROUPS.find((g) => g.id === activeId) ?? GROUPS[0];

  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";

  const [contents, signals, botSummary, ragStats, notFoundCount] = await Promise.all([
    repo.listContents({ locale, status: "published" }),
    getIntelRepository(siteId).listSignals(500).catch(() => []),
    getBotStatsRepository(siteId).summary(30).catch(() => []),
    getChunkRepository(siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
    getRedirectRepository(siteId).countNotFound().catch(() => 0),
  ]);

  const avgSeo =
    contents.length > 0
      ? Math.round(contents.reduce((acc, c) => acc + c.seoScore, 0) / contents.length)
      : 0;
  const totalImpressions = signals.reduce((acc, s) => acc + s.impressions, 0);
  const totalClicks = signals.reduce((acc, s) => acc + s.clicks, 0);
  const totalBotHits = botSummary.reduce((acc, b) => acc + b.total, 0);

  const counts = Object.fromEntries(
    GROUPS.map((g) => [g.id, slotRegistry.getEntries(g.slot).length])
  ) as Record<GroupId, number>;

  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="SEO & GEO Raporları"
        description={active.detail}
        actions={
          <nav
            aria-label="Rapor kategorileri"
            className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {GROUPS.map((g) => {
              const isCurrent = g.id === active.id;
              return (
                <Link
                  key={g.id}
                  href={`/admin/seo/reports?group=${g.id}`}
                  prefetch={false}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-medium transition ${
                    isCurrent
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{g.title}</span>
                  <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px]">
                    {counts[g.id]}
                  </span>
                </Link>
              );
            })}
          </nav>
        }
      />

      {/* Yönetici Özet KPI Şeridi */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="Ortalama SEO Skoru"
          value={avgSeo}
          suffix="/100"
          badge={`${contents.length} yayında`}
          badgeTone={avgSeo >= 85 ? "emerald" : avgSeo >= 70 ? "blue" : "amber"}
          hint={`${notFoundCount} açık 404`}
          icon={<Activity className="h-4 w-4" />}
          iconTone="emerald"
          progressPct={avgSeo}
          href="/admin/seo/audit"
        />
        <KpiStatCard
          label="Webmaster Performansı"
          value={totalImpressions > 0 ? totalImpressions.toLocaleString("tr-TR") : "—"}
          suffix={totalImpressions > 0 ? "gösterim" : undefined}
          badge={`${totalClicks.toLocaleString("tr-TR")} tıklama`}
          badgeTone="blue"
          hint={`${signals.length} kayıtlı sorgu`}
          icon={<Search className="h-4 w-4" />}
          iconTone="blue"
          href="/admin/seo"
        />
        <KpiStatCard
          label="AI & Arama Botları"
          value={totalBotHits.toLocaleString("tr-TR")}
          suffix="hit (30g)"
          badge={`${botSummary.length} aktif bot`}
          badgeTone="amber"
          hint="Doğrulanmış + bildirilen"
          icon={<Bot className="h-4 w-4" />}
          iconTone="amber"
        />
        <KpiStatCard
          label="RAG Vektör Dizini"
          value={ragStats.chunks.toLocaleString("tr-TR")}
          suffix="parça"
          badge={`${ragStats.contents} içerik`}
          badgeTone="violet"
          hint={ragStats.models[0]?.model ?? "Henüz dizinlenmedi"}
          icon={<Database className="h-4 w-4" />}
          iconTone="violet"
          href="/admin/seo/schemas"
        />
      </div>

      <PluginSlot
        name={active.slot}
        siteId={siteId}
        className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 [&>*]:min-w-0"
        fallback={
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-[13px] text-muted-foreground">
            Bu kategoride etkin rapor kartı yok. İlgili modülleri Eklentiler sayfasından açabilirsiniz.
          </div>
        }
      />
    </div>
  );
}
