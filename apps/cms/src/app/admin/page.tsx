import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { cmsHooks, getCmsMode, localeBase, PluginSlot } from "@nexpress/core";
import {
  getBotStatsRepository,
  getChunkRepository,
  getDbDialect,
  getFormSubmissionRepository,
  getIntelRepository,
  getRedirectRepository,
  getScopedRepository,
} from "@nexpress/database";
import { getThemeManifest } from "@nexpress/themes";
import { getSession } from "@/lib/auth/session";
import { SetupChecklist } from "@/components/admin/setup-checklist";
import {
  HealthBarRow,
  KpiStatCard,
  SemiCircleGauge,
  StackedDistributionBar,
  VerticalBarChart,
} from "@/components/admin/ui/saas-charts";
import {
  OverviewTableClient,
  type OverviewContentRow,
} from "@/components/admin/dashboard/overview-table-client";
import {
  Activity,
  ArrowUpRight,
  Bot,
  FileText,
  Globe,
  Inbox,
  Layers,
  Palette,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const [site, session] = await Promise.all([repo.getSite(), getSession()]);
  const locale = site?.defaultLocale ?? "tr";
  const base = localeBase(site, locale);

  const [contents, entityLinks, ragStats, botSummary, signals, notFoundCount, formCounts, unreadForms] =
    await Promise.all([
      repo.listContents({ locale }),
      repo.listEntityLinks(),
      getChunkRepository(siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
      getBotStatsRepository(siteId).summary(30).catch(() => []),
      getIntelRepository(siteId).listSignals(500).catch(() => []),
      getRedirectRepository(siteId).countNotFound().catch(() => 0),
      getFormSubmissionRepository(siteId).counts().catch(() => ({ new: 0, read: 0, spam: 0, archived: 0 })),
      getFormSubmissionRepository(siteId).list({ status: "new", limit: 3 }).catch(() => []),
    ]);

  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const registeredHooks = cmsHooks.getRegisteredHooksSummary();

  const published = contents.filter((c) => c.status === "published");
  const drafts = contents.filter((c) => c.status === "draft");
  const avgSeoScore =
    published.length > 0
      ? Math.round(published.reduce((acc, c) => acc + c.seoScore, 0) / published.length)
      : contents.length > 0
        ? Math.round(contents.reduce((acc, c) => acc + c.seoScore, 0) / contents.length)
        : 0;

  const highSeoCount = published.filter((c) => c.seoScore >= 85).length;
  const withTldrCount = published.filter((c) => (c.tldr ?? "").trim().length >= 40).length;
  const ragCoveragePct =
    published.length > 0 ? Math.min(100, Math.round((ragStats.contents / published.length) * 100)) : 0;

  // Webmaster gerçek verileri (GSC + Bing)
  const totalClicks = signals.reduce((acc, s) => acc + s.clicks, 0);
  const totalImpressions = signals.reduce((acc, s) => acc + s.impressions, 0);
  const posSignals = signals.filter((s) => s.position10 > 0);
  const avgPosition =
    posSignals.length > 0
      ? (posSignals.reduce((acc, s) => acc + s.position10 / 10, 0) / posSignals.length).toFixed(1)
      : null;

  const posTop3 = posSignals.filter((s) => s.position10 <= 30).length;
  const pos4to10 = posSignals.filter((s) => s.position10 > 30 && s.position10 <= 100).length;
  const pos11to20 = posSignals.filter((s) => s.position10 > 100 && s.position10 <= 200).length;
  const pos21plus = posSignals.filter((s) => s.position10 > 200).length;

  const totalBotHits = botSummary.reduce((acc, b) => acc + b.total, 0);

  // SEO puan kovaları (dikey sütun grafiği)
  const scoreBuckets = [
    { label: "90–100", value: published.filter((c) => c.seoScore >= 90).length, highlight: true },
    { label: "80–89", value: published.filter((c) => c.seoScore >= 80 && c.seoScore < 90).length, tone: "blue" as const },
    { label: "70–79", value: published.filter((c) => c.seoScore >= 70 && c.seoScore < 80).length, tone: "violet" as const },
    { label: "60–69", value: published.filter((c) => c.seoScore >= 60 && c.seoScore < 70).length, tone: "amber" as const },
    { label: "< 60", value: published.filter((c) => c.seoScore < 60).length, tone: "rose" as const },
  ];

  // En yüksek fırsatlı 4 webmaster sorgusu
  const topOpportunities = [...signals]
    .filter((s) => s.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 4);

  const tableRows: OverviewContentRow[] = contents.map((item) => {
    const publicPath =
      item.slug === "ana-sayfa" ? base || "/" : `${base}/${item.slug}`.replace(/\/+/g, "/");
    return {
      id: item.id,
      contentId: item.contentId,
      title: item.title,
      slug: item.slug,
      type: item.type,
      status: item.status,
      schemaType: item.schemaType,
      seoScore: item.seoScore,
      importanceScore: item.importanceScore,
      words: (item.markdownCache ?? "").split(/\s+/).filter(Boolean).length,
      publicPath,
    };
  });

  return (
    <div className="space-y-5">
      {session?.role === "admin" && <SetupChecklist siteId={siteId} />}

      {/* Üst Başlık & Hızlı Aksiyonlar */}
      <div className="flex flex-col justify-between gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
              {site?.name ?? "NexPress CMS"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {siteId} · {getDbDialect()} · 0 KB JS
            </span>
            <span className="hidden rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
              {getCmsMode()}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            İçerik performansı, arama görünürlüğü, SEO/GEO sağlığı ve yapay zeka dizini özeti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/themes"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
          >
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{activeTheme.name}</span>
          </Link>
          <Link
            href="/admin/seo"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>SEO Merkezi</span>
          </Link>
          <Link
            href="/admin/contents"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[12px] font-medium text-background hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Yeni Kayıt</span>
          </Link>
        </div>
      </div>

      {/* Okunmamış Yeni Form Bildirimi (yalnızca okunmamış gönderim varsa görünür) */}
      {formCounts.new > 0 && (
        <div
          role="status"
          className="flex flex-col justify-between gap-3 rounded-xl border border-blue-500/35 bg-blue-500/10 px-4 py-3 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Inbox className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  {formCounts.new} okunmamış yeni form gönderimi var
                </span>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                  YENİ
                </span>
              </div>
              {unreadForms.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {unreadForms.map((f) => (
                    <span key={f.id} className="truncate">
                      <strong className="font-medium text-foreground">{f.formTitle || "Form"}</strong>{" "}
                      <span className="font-mono">({f.pagePath})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Link
            href="/admin/forms/inbox?status=new"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700 transition"
          >
            <span>Gelen Kutusunu Aç</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4'lü SaaS KPI Şeridi */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="Yayınlanan İçerikler"
          value={published.length.toLocaleString("tr-TR")}
          suffix={`/ ${contents.length}`}
          badge={`${drafts.length} taslak`}
          badgeTone="blue"
          hint="%100 MarkdownCache"
          icon={<Layers className="h-4 w-4" />}
          iconTone="blue"
          progressPct={contents.length > 0 ? (published.length / contents.length) * 100 : 0}
          href="/admin/pages"
        />

        <KpiStatCard
          label="Ortalama SEO & GEO"
          value={avgSeoScore}
          suffix="/100"
          badge={`${highSeoCount} sayfa 85+`}
          badgeTone={avgSeoScore >= 85 ? "emerald" : avgSeoScore >= 70 ? "blue" : "amber"}
          hint="TL;DR + @graph"
          icon={<Sparkles className="h-4 w-4" />}
          iconTone="emerald"
          progressPct={avgSeoScore}
          href="/admin/seo"
        />

        <KpiStatCard
          label="Arama Görünürlüğü"
          value={totalImpressions > 0 ? totalImpressions.toLocaleString("tr-TR") : "—"}
          suffix={totalImpressions > 0 ? "gösterim" : undefined}
          badge={
            totalClicks > 0
              ? `${totalClicks.toLocaleString("tr-TR")} tıklama`
              : "Webmaster bağla"
          }
          badgeTone={totalImpressions > 0 ? "violet" : "slate"}
          hint={avgPosition ? `Ort. sıra ${avgPosition}` : "GSC & Bing"}
          icon={<Search className="h-4 w-4" />}
          iconTone="violet"
          href={totalImpressions > 0 ? "/admin/seo" : "/admin/seo/integrations"}
        />

        <KpiStatCard
          label="AI & RAG Hazırlığı"
          value={ragStats.chunks.toLocaleString("tr-TR")}
          suffix="parça"
          badge={`${entityLinks.length} @id bağı`}
          badgeTone="emerald"
          hint={`${totalBotHits.toLocaleString("tr-TR")} bot ziyareti (30g)`}
          icon={<Bot className="h-4 w-4" />}
          iconTone="amber"
          progressPct={ragCoveragePct}
          href="/admin/seo/schemas"
        />
      </div>

      {/* 2 Sütunlu Görsel Analiz Alanı */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Sol: SEO Puan Dağılımı + Webmaster Pozisyon Özeti */}
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">
                İçerik SEO Puan Dağılımı
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Yayındaki {published.length} içeriğin puan aralıklarına göre dağılımı
              </p>
            </div>
            <Link
              href="/admin/seo/audit"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition"
            >
              <span>Detaylı Denetim</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <VerticalBarChart items={scoreBuckets} height={156} />

          {/* Webmaster Pozisyon Dağılımı veya Hızlı Fırsatlar */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-foreground">
                Anahtar Kelime Pozisyon Dağılımı (GSC & Bing)
              </span>
              <Link href="/admin/seo" className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                Tüm sorgular ({signals.length}) →
              </Link>
            </div>
            <StackedDistributionBar
              segments={[
                { label: "İlk 3", value: posTop3, tone: "emerald" },
                { label: "4–10", value: pos4to10, tone: "blue" },
                { label: "11–20", value: pos11to20, tone: "amber" },
                { label: "21+", value: pos21plus, tone: "slate" },
              ]}
            />
            {topOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                {topOpportunities.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{sig.keyword}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {sig.source.toUpperCase()} · {sig.impressions.toLocaleString("tr-TR")} gösterim
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground border border-border">
                      #{(sig.position10 / 10).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Sağ: Yarı Daire Sağlık Göstergesi + Sağlık Çubukları */}
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">
                Site SEO & GEO Sağlığı
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Canlı veritabanı, RAG ve teknik durum özeti
              </p>
            </div>
            <Link
              href="/admin/seo/reports"
              className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Raporlar →
            </Link>
          </div>

          <div className="py-1">
            <SemiCircleGauge
              score={avgSeoScore}
              label="Genel SEO & GEO Puanı"
              subtitle={`${published.length} yayında · ${entityLinks.length} varlık bağı`}
            />
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <HealthBarRow
              label="Yüksek SEO Puanı (85+)"
              valueText={`${highSeoCount}/${published.length}`}
              pct={published.length > 0 ? (highSeoCount / published.length) * 100 : 0}
              tone="emerald"
              href="/admin/seo/audit"
            />
            <HealthBarRow
              label="RAG Vektör Dizini Kapsamı"
              valueText={`%${ragCoveragePct} (${ragStats.chunks} parça)`}
              pct={ragCoveragePct}
              tone="blue"
              href="/admin/seo/schemas"
            />
            <HealthBarRow
              label="Answer-First TL;DR Doluluğu"
              valueText={`${withTldrCount}/${published.length}`}
              pct={published.length > 0 ? (withTldrCount / published.length) * 100 : 0}
              tone="violet"
              href="/admin/seo/audit"
            />
            <HealthBarRow
              label="404 / Yönlendirme Hijyeni"
              valueText={notFoundCount === 0 ? "Temiz (0)" : `${notFoundCount} kayıt`}
              pct={notFoundCount === 0 ? 100 : Math.max(20, 100 - Math.min(80, notFoundCount))}
              tone={notFoundCount === 0 ? "emerald" : notFoundCount < 15 ? "amber" : "rose"}
              href="/admin/redirects"
            />
          </div>
        </section>
      </div>

      {/* Filtrelenebilir İçerik Özet Tablosu */}
      <OverviewTableClient rows={tableRows} />

      {/* Open-Core Genişleme Yuvası */}
      <PluginSlot
        name="dashboard.overview.cards"
        siteId={siteId}
        fallback={
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-card px-4 py-3 text-[12px]">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-foreground">
                Open-Core Eklenti Merkezi
              </span>
              <span className="hidden text-muted-foreground md:inline">
                — {registeredHooks.length} aktif kanca ile eklentileri ve SEO/GEO modüllerini yönetin.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/seo/reports"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition"
              >
                <FileText className="h-3 w-3" />
                Raporlar
              </Link>
              <Link
                href="/admin/plugins"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground hover:bg-muted transition"
              >
                Eklentiler →
              </Link>
            </div>
          </div>
        }
      />
    </div>
  );
}
