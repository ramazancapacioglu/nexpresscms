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
import { AlertCircle, AlertTriangle, CheckCircle2, Gauge } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SeoAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string; locale?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const locales = site?.supportedLocales ?? ["tr"];
  const locale = sp.locale && locales.includes(sp.locale) ? sp.locale : site?.defaultLocale ?? "tr";
  const [contents, users, ragStats, entityLinks, signals] = await Promise.all([
    repo.listContents({ locale, status: "published" }),
    getUserRepository(me.siteId).list(),
    getChunkRepository(me.siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
    repo.listEntityLinks().catch(() => []),
    getIntelRepository(me.siteId).listSignals(300).catch(() => []),
  ]);
  const quickWins = extractSeoQuickWins(
    signals.map((sig) => ({
      keyword: sig.keyword,
      source: sig.source,
      clicks: sig.clicks,
      impressions: sig.impressions,
      position: sig.position10 ? sig.position10 / 10 : null,
    })),
    contents.map((c) => c.title)
  );
  const existingPairs = entityLinks.map((l) => `${l.sourceContentId}:${l.targetContentId}`);
  const activeRagProvider = await resolveSiteEmbeddingProvider(me.siteId).catch(() => ({
    model: "local:hash:1536",
    semantic: false,
  }));
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const localized = resolveLocalizedSiteIdentity(site, locale);
  const org = organizationFor(localized.seo);
  const deepInputs = await Promise.all(
    contents.map(async (c) => {
      const pageUrl = c.slug === "ana-sayfa" ? `${baseUrl}/` : c.type === "campaign" ? `${baseUrl}/kampanya/${c.slug}` : `${baseUrl}/${c.slug}`;
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
  const deepReport = runDeepSiteAudit({
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

  const linkSuggestions = suggestInternalLinks(
    contents.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      locale,
      focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
      markdown: c.markdownCache ?? "",
    })),
    { maxSuggestions: 12 }
  );
  const s = report.summary;
  const q = (extra: string) => `/admin/seo/audit?locale=${locale}${extra}`;

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
                  href={`/admin/seo/audit?locale=${l}`}
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

      <DeepAuditPanel report={deepReport} />
      <SeoQuickWinsPanel wins={quickWins} />

      {/* Sorun Türü Hızlı Filtre Rozetleri */}
      <div className="flex flex-wrap gap-1.5 text-[12px]">
        <Link
          href={q("")}
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
              href={q(`&issue=${id}`)}
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

      <EntityLinkSuggestions suggestions={linkSuggestions} existingPairs={existingPairs} locale={locale} />
      <LinkAuditCard contents={contents} locales={locales} />
      <ExternalLinkAudit />
    </div>
  );
}
