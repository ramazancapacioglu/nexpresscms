import React from "react";
import Link from "next/link";
import {
  auditSeo,
  authorProfileFromRow,
  countImagesMissingAlt,
  resolveLocalizedSiteIdentity,
  resolvePublishing,
  SEO_ISSUE_LABELS,
  suggestInternalLinks,
  type SeoIssueId,
} from "@nexpress/core";
import { getChunkRepository, getIntelRepository, getScopedRepository, getUserRepository } from "@nexpress/database";
import { buildPageSchemaGraph, extractSeoQuickWins, runDeepSiteAudit } from "@nexpress/seo-core";
import { requireUser } from "@/lib/auth/session";
import { resolveSiteEmbeddingProvider } from "@/lib/ai-config";
import { authorSlug } from "@/lib/author-slug";
import { organizationFor } from "@/lib/organization-schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { DeepAuditPanel } from "@/components/admin/seo/deep-audit-panel";
import { SeoQuickWinsPanel } from "@/components/admin/seo/seo-quick-wins-panel";
import { EntityLinkSuggestions } from "@/components/admin/seo/entity-link-suggestions";
import { LinkAuditCard } from "@/components/admin/seo/link-audit-card";
import { ExternalLinkAudit } from "@/components/admin/seo/external-link-audit";
import { KpiStatCard } from "@/components/admin/ui/saas-charts";
import { SeoAuditTableClient } from "@/components/admin/seo/seo-audit-table-client";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, FileSearch, Gauge, Link2, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type AuditTabId = "pages" | "deep" | "quickwins" | "links" | "external";

export default async function SeoAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string; locale?: string; tab?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const activeTab: AuditTabId =
    sp.tab === "deep" || sp.tab === "quickwins" || sp.tab === "links" || sp.tab === "external"
      ? sp.tab
      : "pages";
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const locales = site?.supportedLocales ?? ["tr"];
  const locale = sp.locale && locales.includes(sp.locale) ? sp.locale : site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale, status: "published" });

  // Ağır hesaplamalar yalnızca ilgili sekme açıkken çalışır (diğer sekmelerde 0 ms yük)
  const deepReport =
    activeTab === "deep"
      ? await (async () => {
          const [users, ragStats, activeRagProvider] = await Promise.all([
            getUserRepository(me.siteId).list(),
            getChunkRepository(me.siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
            resolveSiteEmbeddingProvider(me.siteId).catch(() => ({ model: "local:hash:1536", semantic: false })),
          ]);
          const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
          const localized = resolveLocalizedSiteIdentity(site, locale);
          const org = organizationFor(localized.seo);
          const deepInputs = await Promise.all(
            contents.map(async (c) => {
              const pageUrl =
                c.slug === "ana-sayfa"
                  ? `${baseUrl}/`
                  : c.type === "campaign"
                    ? `${baseUrl}/kampanya/${c.slug}`
                    : `${baseUrl}/${c.slug}`;
              const graph = await buildPageSchemaGraph({
                siteId: me.siteId,
                siteName: localized.name,
                siteUrl: baseUrl,
                locale,
                pageUrl,
                organization: org,
                content: {
                  id: c.id,
                  title: c.title,
                  tldr: c.tldr,
                  schemaType: c.schemaType,
                  schemaAttributes: c.schemaAttributes,
                  authorName: resolvePublishing(c.schemaAttributes).authorName || c.authorName,
                  updatedAt: c.updatedAt,
                  publishedAt: c.publishedAt ?? c.createdAt ?? null,
                  blocks: c.blocks as never,
                },
              }).catch(() => null);
              return {
                id: c.id,
                contentId: c.contentId,
                slug: c.slug,
                type: c.type,
                title: c.title,
                tldr: c.tldr,
                noIndex: c.noIndex,
                schemaType: c.schemaType,
                schemaAttributes: c.schemaAttributes,
                blocks: c.blocks as never,
                markdownCache: c.markdownCache ?? "",
                authorName: c.authorName,
                schemaNodes: graph?.["@graph"],
              };
            })
          );
          return runDeepSiteAudit({
            contents: deepInputs,
            authors: users
              .filter((u) => u.name.trim())
              .map((u) => ({ slug: authorSlug(u.name), name: u.name.trim(), profile: authorProfileFromRow(u) })),
            ragHealth: {
              activeModel: activeRagProvider.model,
              activeSemantic: activeRagProvider.semantic,
              chunkModels: ragStats.models.map((m) => ({ model: m.model, count: m.chunks })),
              indexedContents: ragStats.contents,
              totalPublished: contents.length,
            },
          });
        })()
      : null;

  const quickWins =
    activeTab === "quickwins"
      ? extractSeoQuickWins(
          (await getIntelRepository(me.siteId).listSignals(300).catch(() => [])).map((sig) => ({
            keyword: sig.keyword,
            source: sig.source,
            clicks: sig.clicks,
            impressions: sig.impressions,
            position: sig.position10 ? sig.position10 / 10 : null,
          })),
          contents.map((c) => c.title)
        )
      : [];

  const [existingPairs, linkSuggestions] =
    activeTab === "links"
      ? [
          (await repo.listEntityLinks().catch(() => [])).map((l) => `${l.sourceContentId}:${l.targetContentId}`),
          suggestInternalLinks(
            contents.map((c) => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
              locale,
              focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
              markdown: c.markdownCache ?? "",
            })),
            { maxSuggestions: 12 }
          ),
        ]
      : [[], []];

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
  const issue = sp.issue && sp.issue in SEO_ISSUE_LABELS ? (sp.issue as SeoIssueId) : null;
  const rows = issue
    ? report.rows.filter((r) => r.issues.some((i) => i.id === issue))
    : report.rows;

  const s = report.summary;
  const q = (extra: string) => `/admin/seo/audit?locale=${locale}${extra}`;
  const tabs: Array<{ id: AuditTabId; label: string; count?: string | number; tone?: "rose" | "amber" | "emerald" | "blue"; icon: React.ReactNode }> = [
    { id: "pages", label: "Sayfa Denetimi", count: s.pages, icon: <FileSearch className="h-3.5 w-3.5" /> },
    {
      id: "deep",
      label: "Derin Şema & GEO",
      count: deepReport ? `${deepReport.summary.score}/100` : undefined,
      tone: deepReport ? (deepReport.summary.errors > 0 ? "rose" : deepReport.summary.warnings > 0 ? "amber" : "emerald") : undefined,
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
    { id: "quickwins", label: "Hızlı Kazanımlar", count: activeTab === "quickwins" ? quickWins.length : undefined, tone: quickWins.length > 0 ? "blue" : undefined, icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "links", label: "İç Bağlantı & Bilgi Ağı", count: activeTab === "links" ? linkSuggestions.length : undefined, icon: <Link2 className="h-3.5 w-3.5" /> },
    { id: "external", label: "Dış Bağlantı Tarayıcı", icon: <ExternalLink className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="SEO Denetimi & Bağlantılar"
        description={`Yayındaki ${s.pages} içeriğin başlık, açıklama, TL;DR, içerik derinliği, alt metin, iç bağlantı fırsatı ve kırık bağlantı kontrolü.`}
        actions={
          locales.length > 1 ? (
            <div role="tablist" aria-label="Dil" className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-[12px] font-medium">
              {locales.map((l) => (
                <Link
                  key={l}
                  role="tab"
                  aria-selected={l === locale}
                  href={`/admin/seo/audit?locale=${l}&tab=${activeTab}`}
                  prefetch={false}
                  className={`rounded-md px-3 py-1 ${l === locale ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiStatCard
          label="Ortalama Puan"
          value={s.avgScore}
          suffix="/100"
          badgeTone={s.avgScore >= 85 ? "emerald" : "blue"}
          progressPct={s.avgScore}
          icon={<Gauge className="h-4 w-4" />}
          iconTone="blue"
        />
        <KpiStatCard
          label="Hatalı Sayfa"
          value={s.withErrors}
          badge={s.withErrors === 0 ? "Temiz" : "Öncelikli"}
          badgeTone={s.withErrors === 0 ? "emerald" : "rose"}
          icon={<AlertCircle className="h-4 w-4" />}
          iconTone="rose"
        />
        <KpiStatCard
          label="Uyarılı Sayfa"
          value={s.withWarnings}
          badge="İyileştirilebilir"
          badgeTone="amber"
          icon={<AlertTriangle className="h-4 w-4" />}
          iconTone="amber"
        />
        <KpiStatCard
          label="Sorunsuz Sayfa"
          value={s.clean}
          suffix={`/ ${s.pages}`}
          badgeTone="emerald"
          progressPct={s.pages > 0 ? (s.clean / s.pages) * 100 : 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconTone="emerald"
        />
      </div>

      {/* Alt Denetim Sekmeleri (Raporlar sayfası düzeni) */}
      <nav aria-label="SEO Denetim Sekmeleri" className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeClass =
            tab.tone === "rose"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              : tab.tone === "amber"
                ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                : tab.tone === "emerald"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : tab.tone === "blue"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                    : "bg-muted text-muted-foreground";
          return (
            <Link
              key={tab.id}
              href={q(`&tab=${tab.id}`)}
              prefetch={false}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                isActive
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-2xs"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${badgeClass}`}>
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {activeTab === "pages" && (
        <div className="space-y-4">
          {/* Sorun Türü Hızlı Filtre Rozetleri */}
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            <Link
              href={q("&tab=pages")}
              prefetch={false}
              aria-current={!issue ? "page" : undefined}
              className={`rounded-full border px-3 py-1 font-medium transition ${
                !issue
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Tümü ({s.pages})
            </Link>
            {(Object.entries(s.byIssue) as Array<[SeoIssueId, number]>)
              .sort((a, b) => b[1] - a[1])
              .map(([id, n]) => (
                <Link
                  key={id}
                  href={q(`&tab=pages&issue=${id}`)}
                  prefetch={false}
                  aria-current={issue === id ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 font-medium transition ${
                    issue === id
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {SEO_ISSUE_LABELS[id]} ({n})
                </Link>
              ))}
          </div>

          <SeoAuditTableClient rows={rows} locale={locale} />
        </div>
      )}

      {activeTab === "deep" && deepReport && <DeepAuditPanel report={deepReport} />}

      {activeTab === "quickwins" && <SeoQuickWinsPanel wins={quickWins} />}

      {activeTab === "links" && (
        <div className="space-y-5">
          <EntityLinkSuggestions suggestions={linkSuggestions} existingPairs={existingPairs} locale={locale} />
          <LinkAuditCard contents={contents} locales={locales} />
        </div>
      )}

      {activeTab === "external" && <ExternalLinkAudit />}
    </div>
  );
}
