import React from "react";
import Link from "next/link";
import {
  auditSeo,
  countImagesMissingAlt,
  resolvePublishing,
  SEO_ISSUE_LABELS,
  suggestInternalLinks,
  type SeoIssueId,
} from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
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
  const contents = await repo.listContents({ locale, status: "published" });
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

      {linkSuggestions.length > 0 && (
        <section className="space-y-2.5 pt-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            İç Bağlantı Fırsatları (Topic Cluster)
          </h2>
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
            {linkSuggestions.map((item) => (
              <li key={`${item.fromId}:${item.toId}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
                <div>
                  <Link href={`/admin/contents?id=${encodeURIComponent(item.fromId)}&locale=${locale}`} className="font-semibold text-foreground hover:underline">
                    {item.fromTitle}
                  </Link>
                  <span className="text-muted-foreground"> içinde </span>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-700 dark:text-blue-300">
                    “{item.matchedPhrase}”
                  </span>
                  <span className="text-muted-foreground"> geçiyor ancak </span>
                  <Link href={`/admin/contents?id=${encodeURIComponent(item.toId)}&locale=${locale}`} className="font-semibold text-foreground hover:underline">
                    /{item.toSlug}
                  </Link>
                  <span className="text-muted-foreground"> sayfasına bağlantı verilmemiş.</span>
                </div>
                <Link
                  href={`/admin/contents?id=${encodeURIComponent(item.fromId)}&locale=${locale}`}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition"
                >
                  Stüdyoda Bağla →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <LinkAuditCard contents={contents} locales={locales} />
      <ExternalLinkAudit />
    </div>
  );
}
