import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import {
  auditSeo,
  countImagesMissingAlt,
  resolvePublishing,
  resolveSiteSettings,
  SEO_ISSUE_LABELS,
  sitemapArchiveTypes,
  type SeoIssueId,
} from "@nexpress/core";
import {
  getBotStatsRepository,
  getChunkRepository,
  getIntelRepository,
  getRedirectRepository,
  getScopedRepository,
} from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SyncNowButton } from "@/components/admin/seo/sync-now-button";
import { buildSeoSummary } from "@/components/admin/seo/seo-summary";
import {
  HealthBarRow,
  KpiStatCard,
  SemiCircleGauge,
  StackedDistributionBar,
  VerticalBarChart,
} from "@/components/admin/ui/saas-charts";
import {
  SeoSignalsTableClient,
  type SeoSignalRow,
} from "@/components/admin/seo/seo-signals-table-client";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  Globe,
  Network,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const MODULE_LINKS = [
  { href: "/admin/seo/audit", label: "Denetim & Bağlantılar", detail: "Sayfa sayfa sorun listesi, konu kümesi ve kırık bağlantı kontrolü", icon: FileSearch },
  { href: "/admin/seo/reports", label: "SEO & GEO Raporları", detail: "AI yönlendirme, bot taraması, içerik erimesi ve sorgu raporları", icon: Sparkles },
  { href: "/admin/seo/schemas", label: "Şemalar & Arama Dizini", detail: "JSON-LD şema kuralları, Varlık Grafı ve RAG vektör dizini", icon: Network },
  { href: "/admin/redirects", label: "Yönlendirmeler & 404", detail: "301/302 kuralları ve bulunamayan adres günlüğü", icon: GitBranch },
  { href: "/admin/seo/integrations", label: "Webmaster", detail: "Google Search Console, GA4, Bing ve Yandex bağlantıları", icon: Globe },
  { href: "/admin/seo/settings", label: "SEO Ayarları", detail: "Yayın, başlık, yerel işletme, marka DNA ve anahtarlar", icon: Settings2 },
] as const;

export default async function AdminSeoPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";

  const [contents, entityLinks, signals, ragStats, botSummary, redirects, notFoundCount] =
    await Promise.all([
      repo.listContents({ locale, status: "published" }),
      repo.listEntityLinks(),
      getIntelRepository(siteId).listSignals(500).catch(() => []),
      getChunkRepository(siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
      getBotStatsRepository(siteId).summary(30).catch(() => []),
      getRedirectRepository(siteId).list().catch(() => []),
      getRedirectRepository(siteId).countNotFound().catch(() => 0),
    ]);

  const seo = resolveSiteSettings(site?.settings).seo;
  const summary = buildSeoSummary(contents, seo);
  const report = auditSeo(
    contents.map((c) => ({
      id: c.id,
      locale,
      slug: c.slug,
      title: c.title,
      type: c.type,
      status: c.status,
      metaTitle: c.metaTitle ?? null,
      metaDescription: c.metaDescription ?? null,
      tldr: c.tldr ?? null,
      noIndex: c.noIndex,
      seoScore: c.seoScore,
      words: (c.markdownCache ?? "").split(/\s+/).filter(Boolean).length,
      focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
      imagesMissingAlt: countImagesMissingAlt(c.blocks as never),
    }))
  );

  const s = report.summary;
  const issues = (Object.entries(s.byIssue) as Array<[SeoIssueId, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const issueMax = Math.max(1, ...issues.map(([, n]) => n));

  const gradeBars = [
    { label: "A (90+)", value: summary.grades.a, highlight: true },
    { label: "B (75–89)", value: summary.grades.b, tone: "blue" as const },
    { label: "C (60–74)", value: summary.grades.c, tone: "amber" as const },
    { label: "D (<60)", value: summary.grades.d, tone: "rose" as const },
  ];

  // Webmaster & Bot özetleri
  const totalClicks = signals.reduce((acc, x) => acc + x.clicks, 0);
  const totalImpressions = signals.reduce((acc, x) => acc + x.impressions, 0);
  const posSignals = signals.filter((x) => x.position10 > 0);
  const posTop3 = posSignals.filter((x) => x.position10 <= 30).length;
  const pos4to10 = posSignals.filter((x) => x.position10 > 30 && x.position10 <= 100).length;
  const pos11to20 = posSignals.filter((x) => x.position10 > 100 && x.position10 <= 200).length;
  const pos21plus = posSignals.filter((x) => x.position10 > 200).length;

  const topBots = botSummary.slice(0, 5);
  const botMax = Math.max(1, ...topBots.map((b) => b.total));
  const totalBotHits = botSummary.reduce((acc, b) => acc + b.total, 0);

  const signalRows: SeoSignalRow[] = signals.map((sig) => ({
    id: sig.id,
    source: sig.source,
    keyword: sig.keyword,
    clicks: sig.clicks,
    impressions: sig.impressions,
    ctrPct: sig.ctr100 / 100,
    position: sig.position10 / 10,
    prevPosition: (sig.prevPosition10 ?? 0) / 10,
    detail: sig.detail ?? "",
  }));

  const archives = sitemapArchiveTypes(seo);
  const indexed = seo.searchIndexing !== false;

  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="SEO & GEO Komuta Merkezi"
        description={`${site?.name ?? "Site"} · Harita: ${archives.includes("etiket") ? "etiketler dahil" : "etiketler hariç"} · ${redirects.length} yönlendirme`}
        badge={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
              indexed
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${indexed ? "bg-emerald-500" : "bg-amber-500"}`} />
            {indexed ? "İndeks açık" : "İndeks kapalı"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/seo/reports"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
            >
              <span>Raporları Aç</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <SyncNowButton />
          </div>
        }
      />

      {!indexed ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[12px] font-medium text-amber-900 dark:text-amber-200">
          Site arama motorlarına kapalı. Açmak için{" "}
          <Link href="/admin/seo/settings" className="underline">
            SEO Ayarları
          </Link>{" "}
          sayfasına gidin.
        </p>
      ) : null}

      {/* 4'lü KPI Şeridi */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="Ortalama SEO Puanı"
          value={s.avgScore}
          suffix="/100"
          badge={`${s.clean}/${s.pages} temiz`}
          badgeTone={s.avgScore >= 85 ? "emerald" : s.avgScore >= 70 ? "blue" : "amber"}
          hint={`${s.withErrors} hatalı · ${s.withWarnings} uyarılı`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconTone="emerald"
          progressPct={s.avgScore}
          href="/admin/seo/audit"
        />

        <KpiStatCard
          label="Webmaster Görünürlüğü"
          value={totalImpressions > 0 ? totalImpressions.toLocaleString("tr-TR") : "—"}
          suffix={totalImpressions > 0 ? "gösterim" : undefined}
          badge={totalClicks > 0 ? `${totalClicks.toLocaleString("tr-TR")} tıklama` : "Veri bekleniyor"}
          badgeTone={totalImpressions > 0 ? "blue" : "slate"}
          hint={`${signals.length} kayıtlı sorgu`}
          icon={<Search className="h-4 w-4" />}
          iconTone="blue"
          href="/admin/seo/integrations"
        />

        <KpiStatCard
          label="RAG & Varlık Grafı"
          value={ragStats.chunks.toLocaleString("tr-TR")}
          suffix="parça"
          badge={`${entityLinks.length} @id bağı`}
          badgeTone="violet"
          hint={`${ragStats.contents}/${s.pages} içerik dizinli`}
          icon={<Database className="h-4 w-4" />}
          iconTone="violet"
          progressPct={s.pages > 0 ? Math.min(100, (ragStats.contents / s.pages) * 100) : 0}
          href="/admin/seo/schemas"
        />

        <KpiStatCard
          label="Bot Tarama & 404"
          value={totalBotHits.toLocaleString("tr-TR")}
          suffix="hit (30g)"
          badge={notFoundCount === 0 ? "0 açık 404" : `${notFoundCount} açık 404`}
          badgeTone={notFoundCount === 0 ? "emerald" : notFoundCount < 15 ? "amber" : "rose"}
          hint={`${redirects.length} aktif yönlendirme`}
          icon={notFoundCount > 15 ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          iconTone={notFoundCount > 15 ? "rose" : "amber"}
          href="/admin/redirects"
        />
      </div>

      {/* 2 Sütunlu Görsel Analitik */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Sol: Yarım Daire Gösterge + Skor Dağılımı + Pozisyon Dağılımı */}
        <section className="space-y-5 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-7">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
            <SemiCircleGauge
              score={s.avgScore}
              label="Site SEO Sağlığı"
              subtitle={`${s.pages} yayındaki sayfa`}
            />
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">Skor Dağılımı</h2>
                <Link href="/admin/seo/audit" className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Denetimi aç →
                </Link>
              </div>
              <VerticalBarChart items={gradeBars} height={138} />
            </div>
          </div>

          <div className="space-y-2.5 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-foreground">
                Arama Pozisyonu Dağılımı (GSC & Bing)
              </h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                {posSignals.length} sıralı sorgu
              </span>
            </div>
            <StackedDistributionBar
              segments={[
                { label: "İlk 3", value: posTop3, tone: "emerald" },
                { label: "4–10", value: pos4to10, tone: "blue" },
                { label: "11–20", value: pos11to20, tone: "amber" },
                { label: "21+", value: pos21plus, tone: "slate" },
              ]}
            />
          </div>
        </section>

        {/* Sağ: Sorun Dağılımı + AI & Arama Botları */}
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">Öncelikli SEO Sorunları</h2>
              <Link href="/admin/seo/audit" className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                Tümünü incele →
              </Link>
            </div>
            {issues.length === 0 ? (
              <p className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-4 text-center text-[12px] text-emerald-700 dark:text-emerald-300">
                Yayında açık SEO sorunu bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {issues.map(([id, count]) => (
                  <HealthBarRow
                    key={id}
                    label={SEO_ISSUE_LABELS[id]}
                    valueText={`${count} sayfa`}
                    pct={(count / issueMax) * 100}
                    tone="blue"
                    href={`/admin/seo/audit?issue=${id}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/60 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-foreground">
                AI & Arama Botları (Son 30 Gün)
              </h3>
              <Link href="/admin/seo/reports?group=visibility" className="text-[11px] text-muted-foreground hover:text-foreground">
                Detay →
              </Link>
            </div>
            {topBots.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Son 30 günde bot kaydı yok.</p>
            ) : (
              <div className="space-y-2.5">
                {topBots.map((b) => (
                  <HealthBarRow
                    key={b.botId}
                    label={b.botId}
                    valueText={`${b.total.toLocaleString("tr-TR")} hit`}
                    pct={(b.total / botMax) * 100}
                    tone="emerald"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Filtrelenebilir Webmaster Sorgu & Fırsat Tablosu */}
      <SeoSignalsTableClient signals={signalRows} />

      {/* Hızlı SEO Modülleri */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MODULE_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition hover:border-blue-500/60"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-600 transition">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-blue-600 transition">
                  {item.label}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{item.detail}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
