import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { slotRegistry } from "@nexpress/core";
import {
  getBotStatsRepository,
  getChunkRepository,
  getIntelRepository,
  getRedirectRepository,
  getScopedRepository,
  utcDay,
} from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { BotCrawlReport } from "@/components/admin/seo/bot-crawl-report";
import { KpiStatCard } from "@/components/admin/ui/saas-charts";
import { Activity, Bot, Calendar, Database, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const GROUPS = [
  {
    id: "bots",
    slot: null,
    title: "AI Bot Taramaları",
    detail: "AI ve arama motoru botlarının tarih aralığına göre hangi sayfaları hangi formatta (HTML / Markdown / LLMs / MCP) taradığı.",
  },
  {
    id: "visibility",
    slot: "seo.reports.visibility" as const,
    title: "Görünürlük & AI",
    detail: "AI yönlendirme, bot özeti, alıntı takibi, MCP günlüğü, Google yorumları ve cevapsız aramalar.",
  },
  {
    id: "content",
    slot: "seo.reports.content" as const,
    title: "İçerik Sağlığı",
    detail: "İçerik açığı, tazelik, erime (decay), bilgi bankası dönüşümü ve katalog denetimi.",
  },
  {
    id: "queries",
    slot: "seo.reports.queries" as const,
    title: "Sorgular & Kümeler",
    detail: "SERP & PAA madenciliği, soru havuzu ve arama motoru fırsatları.",
  },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

const PRESETS = [
  { id: "7d", label: "7 Gün", days: 7 },
  { id: "14d", label: "14 Gün", days: 14 },
  { id: "30d", label: "30 Gün", days: 30 },
  { id: "90d", label: "90 Gün", days: 90 },
] as const;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveRange(sp: { range?: string; from?: string; to?: string }) {
  const now = new Date();
  const today = utcDay(now);
  if (sp.from && sp.to && DAY_RE.test(sp.from) && DAY_RE.test(sp.to) && sp.from <= sp.to) {
    const diff = Math.max(1, Math.round((new Date(`${sp.to}T00:00:00Z`).getTime() - new Date(`${sp.from}T00:00:00Z`).getTime()) / 86_400_000) + 1);
    return { range: "custom", fromDay: sp.from, toDay: sp.to, days: diff, label: `${sp.from} – ${sp.to}` };
  }
  const preset = PRESETS.find((p) => p.id === sp.range) ?? PRESETS[2];
  const fromDay = utcDay(new Date(now.getTime() - (preset.days - 1) * 86_400_000));
  return { range: preset.id, fromDay, toDay: today, days: preset.days, label: `Son ${preset.days} gün` };
}

export default async function AdminSeoReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; panel?: string; range?: string; from?: string; to?: string; bot?: string; kind?: string }>;
}) {
  const [reqHeaders, sp] = await Promise.all([headers(), searchParams]);
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const activeId: GroupId =
    sp.group === "bots" || sp.group === "content" || sp.group === "queries" || sp.group === "visibility"
      ? sp.group
      : "bots";
  const active = GROUPS.find((g) => g.id === activeId) ?? GROUPS[0];
  const dateRange = resolveRange(sp);
  const activeBot = (sp.bot ?? "").trim();
  const activeKind = (sp.kind ?? "").trim();

  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const botRepo = getBotStatsRepository(siteId);

  const [contents, signals, botSummary, botDaily, botPages, ragStats, notFoundCount] = await Promise.all([
    repo.listContents({ locale, status: "published" }),
    getIntelRepository(siteId).listSignals(500).catch(() => []),
    botRepo.summaryInRange(dateRange.fromDay, dateRange.toDay).catch(() => []),
    active.id === "bots" ? botRepo.dailySeriesInRange(dateRange.fromDay, dateRange.toDay).catch(() => []) : Promise.resolve([]),
    active.id === "bots"
      ? botRepo.pageHitsInRange(dateRange.fromDay, dateRange.toDay, { botId: activeBot || undefined, kind: activeKind || undefined, limit: 100 }).catch(() => [])
      : Promise.resolve([]),
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

  const slotEntries = active.slot ? slotRegistry.getEntries(active.slot) : [];
  const activeEntry = slotEntries.find((e) => e.id === sp.panel) ?? slotEntries[0] ?? null;

  const rangeParams = (extra?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    p.set("group", extra?.group ?? active.id);
    if (extra && "panel" in extra) {
      if (extra.panel) p.set("panel", extra.panel);
    } else if (active.slot && activeEntry && (!extra?.group || extra.group === active.id)) {
      p.set("panel", activeEntry.id);
    }
    if (extra?.range) {
      p.set("range", extra.range);
    } else if (dateRange.range === "custom") {
      p.set("from", dateRange.fromDay);
      p.set("to", dateRange.toDay);
    } else {
      p.set("range", dateRange.range);
    }
    return p.toString();
  };

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
              const badgeCount = g.slot ? slotRegistry.getEntries(g.slot).length : botSummary.length;
              return (
                <Link
                  key={g.id}
                  href={`/admin/seo/reports?${rangeParams({ group: g.id, panel: undefined })}`}
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
                    {badgeCount}
                  </span>
                </Link>
              );
            })}
          </nav>
        }
      />

      {/* Tarih Aralığı Seçici Şeridi */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-1">Tarih aralığı:</span>
          {PRESETS.map((pr) => {
            const isSel = dateRange.range === pr.id;
            return (
              <Link
                key={pr.id}
                href={`/admin/seo/reports?${rangeParams({ range: pr.id })}`}
                prefetch={false}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  isSel
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {pr.label}
              </Link>
            );
          })}
        </div>

        <form method="get" action="/admin/seo/reports" className="flex flex-wrap items-center gap-1.5 text-xs">
          <input type="hidden" name="group" value={active.id} />
          {activeEntry ? <input type="hidden" name="panel" value={activeEntry.id} /> : null}
          {activeBot ? <input type="hidden" name="bot" value={activeBot} /> : null}
          {activeKind ? <input type="hidden" name="kind" value={activeKind} /> : null}
          <input
            type="date"
            name="from"
            defaultValue={dateRange.fromDay}
            aria-label="Başlangıç tarihi"
            className="h-8 rounded-md border border-border bg-background px-2 font-mono text-[11px]"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            name="to"
            defaultValue={dateRange.toDay}
            aria-label="Bitiş tarihi"
            className="h-8 rounded-md border border-border bg-background px-2 font-mono text-[11px]"
          />
          <button
            type="submit"
            className="h-8 rounded-md border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Uygula
          </button>
        </form>
      </div>

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
          href="/admin/seo/integrations"
        />
        <KpiStatCard
          label="AI & Arama Botları"
          value={totalBotHits.toLocaleString("tr-TR")}
          suffix={`hit (${dateRange.days}g)`}
          badge={`${botSummary.length} aktif bot`}
          badgeTone="amber"
          hint={dateRange.label}
          icon={<Bot className="h-4 w-4" />}
          iconTone="amber"
          href={`/admin/seo/reports?${rangeParams({ group: "bots", panel: undefined })}`}
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

      {/* Aktif Grup İçeriği: AI Bot Taramaları veya Geniş Alt Sekmeli Rapor */}
      {active.id === "bots" ? (
        <BotCrawlReport
          fromDay={dateRange.fromDay}
          toDay={dateRange.toDay}
          queryBase={rangeParams({ group: "bots", panel: undefined })}
          activeBot={activeBot}
          activeKind={activeKind}
          summary={botSummary}
          dailySeries={botDaily}
          pages={botPages}
        />
      ) : slotEntries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-[13px] text-muted-foreground">
          Bu kategoride etkin rapor sekmesi yok. İlgili modülleri Eklentiler sayfasından açabilirsiniz.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Geniş Alt Sekme Çubuğu */}
          <nav
            aria-label={`${active.title} alt raporları`}
            className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5"
          >
            {slotEntries.map((entry) => {
              const isSel = activeEntry?.id === entry.id;
              const title = entry.label ?? entry.id.replace(/^(agentic-seo-|content-ops-)/, "");
              return (
                <Link
                  key={entry.id}
                  href={`/admin/seo/reports?${rangeParams({ panel: entry.id })}`}
                  prefetch={false}
                  aria-current={isSel ? "page" : undefined}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    isSel
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {title}
                </Link>
              );
            })}
          </nav>

          {/* Seçili Rapor Tam Genişlikte */}
          {activeEntry ? (
            <div className="w-full min-w-0" data-nexpress-report-panel={activeEntry.id}>
              {activeEntry.render({
                siteId,
                context: { fromDay: dateRange.fromDay, toDay: dateRange.toDay, days: dateRange.days },
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
