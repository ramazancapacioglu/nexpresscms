import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import {
  auditSeo,
  contentPath,
  countImagesMissingAlt,
  localeBase,
  resolvePublishing,
  resolveSiteSettings,
  suggestInternalLinks,
} from "@nexpress/core";
import {
  getChunkRepository,
  getIntelRepository,
  getScopedRepository,
} from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import {
  HealthBarRow,
  KpiStatCard,
  SemiCircleGauge,
} from "@/components/admin/ui/saas-charts";
import { PageReportPicker } from "@/components/admin/seo/page-report-picker";
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Edit3,
  FileText,
  Link2,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ISSUE_BADGE = {
  error: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
} as const;

export default async function SinglePageSeoReport({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const me = await requireUser();
  const [reqHeaders, sp] = await Promise.all([headers(), searchParams]);
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? me.siteId;
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const base = localeBase(site, locale);
  const customTypes = resolveSiteSettings(site?.settings).general.contentTypes;

  const [contents, entityLinks, signals] = await Promise.all([
    repo.listContents({ locale }),
    repo.listEntityLinks(),
    getIntelRepository(siteId).listSignals(500).catch(() => []),
  ]);

  const sorted = [...contents].sort(
    (a, b) => (b.status === "published" ? 1 : 0) - (a.status === "published" ? 1 : 0) || b.importanceScore - a.importanceScore
  );
  const selected =
    sorted.find((c) => c.contentId === sp.id || c.id === sp.id || c.slug === sp.id) ??
    sorted[0];

  if (!selected) {
    return (
      <div className="space-y-4">
        <SeoTabs />
        <AdminPageHeader title="Tekil Sayfa SEO Raporu" description="Henüz raporlanacak içerik yok." />
      </div>
    );
  }

  const pub = resolvePublishing(selected.schemaAttributes);
  const words = (selected.markdownCache ?? "").split(/\s+/).filter(Boolean).length;
  const missingAlt = countImagesMissingAlt(selected.blocks as never);

  const audit = auditSeo([
    {
      id: selected.id,
      locale,
      slug: selected.slug,
      title: selected.title,
      type: selected.type,
      status: selected.status,
      metaTitle: selected.metaTitle ?? null,
      metaDescription: selected.metaDescription ?? null,
      tldr: selected.tldr ?? null,
      noIndex: selected.noIndex,
      seoScore: selected.seoScore,
      words,
      focusKeyword: pub.focusKeyword ?? "",
      imagesMissingAlt: missingAlt,
    },
  ]);
  const pageIssues = audit.rows[0]?.issues ?? [];

  const chunks = await getChunkRepository(siteId)
    .listForContent(selected.contentId, locale)
    .catch(() => []);

  const pageEntities = entityLinks.filter(
    (l) => l.sourceContentId === selected.contentId || l.targetContentId === selected.contentId
  );

  // Bu sayfayla eşleşen Webmaster sorguları (slug, başlık kelimeleri veya odak anahtar kelime)
  const slugTokens = selected.slug.split("-").filter((t) => t.length >= 3);
  const focusKw = (pub.focusKeyword ?? "").toLocaleLowerCase("tr-TR").trim();
  const matchedSignals = signals
    .filter((s) => {
      const kw = s.keyword.toLocaleLowerCase("tr-TR");
      const det = (s.detail ?? "").toLocaleLowerCase("tr-TR");
      if (det && det.includes(selected.slug.toLowerCase())) return true;
      if (focusKw && kw.includes(focusKw)) return true;
      const hits = slugTokens.filter((t) => kw.includes(t));
      return hits.length >= Math.min(2, slugTokens.length) && slugTokens.length > 0;
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  const totalImpressions = matchedSignals.reduce((acc, s) => acc + s.impressions, 0);
  const totalClicks = matchedSignals.reduce((acc, s) => acc + s.clicks, 0);
  const avgPos =
    matchedSignals.length > 0
      ? (matchedSignals.reduce((acc, s) => acc + s.position10 / 10, 0) / matchedSignals.length).toFixed(1)
      : null;

  const linkSuggestions = suggestInternalLinks(
    contents
      .filter((c) => c.status === "published")
      .map((c) => ({
        id: c.contentId,
        slug: c.slug,
        title: c.title,
        locale,
        focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
        markdown: c.markdownCache ?? "",
      })),
    { maxSuggestions: 40 }
  ).filter((s) => s.fromId === selected.contentId || s.toId === selected.contentId);

  const rawPath =
    selected.slug === "ana-sayfa" ? "/" : contentPath(customTypes, { type: selected.type, slug: selected.slug });
  const publicUrl = `${base}${rawPath}`.replace(/\/+/g, "/");

  const metaTitleLen = (selected.metaTitle ?? selected.title ?? "").trim().length;
  const metaDescLen = (selected.metaDescription ?? "").trim().length;
  const tldrLen = (selected.tldr ?? "").trim().length;

  const checks = [
    {
      label: "Meta Başlık Uzunluğu",
      ok: metaTitleLen >= 30 && metaTitleLen <= 65,
      detail: `${metaTitleLen} karakter (hedef 30–65)`,
    },
    {
      label: "Meta Açıklama",
      ok: metaDescLen >= 90 && metaDescLen <= 165,
      detail: `${metaDescLen} karakter (hedef 90–165)`,
    },
    {
      label: "Answer-First TL;DR Özeti",
      ok: tldrLen >= 40 && tldrLen <= 320,
      detail: tldrLen > 0 ? `${tldrLen} karakter` : "Eksik",
    },
    {
      label: "İçerik Derinliği",
      ok: words >= 250,
      detail: `${words.toLocaleString("tr-TR")} kelime · ${selected.blocks.length} blok`,
    },
    {
      label: "Görsel Alt Metinleri",
      ok: missingAlt === 0,
      detail: missingAlt === 0 ? "Tüm görsellerde alt metin var" : `${missingAlt} görselde alt metin eksik`,
    },
    {
      label: "İndeksleme & Şema",
      ok: !selected.noIndex,
      detail: `${selected.noIndex ? "NoIndex" : "Index"} · ${selected.schemaType}`,
    },
  ];

  const passedChecks = checks.filter((c) => c.ok).length;

  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="Tekil Sayfa SEO & GEO Raporu"
        description="Seçili sayfanın teknik SEO, yapılandırılmış şema, RAG dizini, varlık bağı ve Webmaster sorgu analizi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-muted"
            >
              <span>Canlı Sayfa</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`${publicUrl}?format=md`}
              target="_blank"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 font-mono text-[11px] font-medium hover:bg-muted"
            >
              ?format=md
            </Link>
            <Link
              href={`/admin/contents?id=${encodeURIComponent(selected.contentId)}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12px] font-medium text-background hover:opacity-90"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Editörde Aç</span>
            </Link>
          </div>
        }
      />

      <PageReportPicker
        selectedId={selected.contentId}
        options={sorted.map((c) => ({
          contentId: c.contentId,
          title: c.title,
          slug: c.slug,
          type: c.type,
          seoScore: c.seoScore,
        }))}
      />

      {/* 4'lü Sayfa KPI Şeridi */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="Sayfa SEO Puanı"
          value={selected.seoScore}
          suffix="/100"
          badge={`${passedChecks}/${checks.length} kontrol geçti`}
          badgeTone={selected.seoScore >= 85 ? "emerald" : selected.seoScore >= 70 ? "blue" : "amber"}
          hint={selected.schemaType}
          icon={<Sparkles className="h-4 w-4" />}
          iconTone="emerald"
          progressPct={selected.seoScore}
        />
        <KpiStatCard
          label="İçerik Derinliği"
          value={words.toLocaleString("tr-TR")}
          suffix="kelime"
          badge={`${selected.blocks.length} blok`}
          badgeTone="blue"
          hint={selected.status === "published" ? "Yayında" : selected.status}
          icon={<FileText className="h-4 w-4" />}
          iconTone="blue"
        />
        <KpiStatCard
          label="Eşleşen Webmaster Sorgusu"
          value={totalImpressions > 0 ? totalImpressions.toLocaleString("tr-TR") : "—"}
          suffix={totalImpressions > 0 ? "gösterim" : undefined}
          badge={totalClicks > 0 ? `${totalClicks} tıklama` : `${matchedSignals.length} sorgu`}
          badgeTone={totalImpressions > 0 ? "violet" : "slate"}
          hint={avgPos ? `Ort. pozisyon #${avgPos}` : "GSC & Bing"}
          icon={<Search className="h-4 w-4" />}
          iconTone="violet"
        />
        <KpiStatCard
          label="RAG & Varlık Grafı"
          value={chunks.length}
          suffix="RAG parça"
          badge={`${pageEntities.length} @id bağı`}
          badgeTone={chunks.length > 0 ? "emerald" : "amber"}
          hint={chunks.length > 0 ? "Vektör dizininde aktif" : "Dizinlenmemiş"}
          icon={<Database className="h-4 w-4" />}
          iconTone="amber"
        />
      </div>

      {/* 2 Sütun: Sağlık Göstergesi & Kontrol Listesi + Sorunlar & RAG Parçaları */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-5">
          <SemiCircleGauge
            score={selected.seoScore}
            label={selected.title}
            subtitle={publicUrl}
          />
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h2 className="text-[12px] font-semibold text-foreground">Sayfa İçi SEO Kontrol Listesi</h2>
            <ul className="space-y-2 text-[12px]">
              {checks.map((chk) => (
                <li key={chk.label} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {chk.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <span className="font-medium text-foreground">{chk.label}</span>
                  </div>
                  <span className="text-right font-mono text-[11px] text-muted-foreground">
                    {chk.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-7">
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              Tespit Edilen Sorunlar & İyileştirme Önerileri
            </h2>
            {pageIssues.length === 0 ? (
              <p className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-3 text-[12px] text-emerald-700 dark:text-emerald-300">
                Bu sayfada kritik veya uyarı düzeyinde açık SEO sorunu bulunmuyor.
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {pageIssues.map((i) => (
                  <span key={i.id} className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${ISSUE_BADGE[i.level]}`}>
                    {i.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Eşleşen Webmaster Sorguları */}
          <div className="border-t border-border/60 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-foreground">
                İlişkili Webmaster Sorguları (GSC & Bing)
              </h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                {matchedSignals.length} eşleşme
              </span>
            </div>
            {matchedSignals.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Bu sayfanın URL veya odak kelimesiyle eşleşen Webmaster sorgusu bulunamadı.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/70">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2">Sorgu</th>
                      <th className="px-2 py-2">Kaynak</th>
                      <th className="px-2 py-2 text-right">Sıra</th>
                      <th className="px-2 py-2 text-right">Gösterim</th>
                      <th className="px-3 py-2 text-right">Tıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {matchedSignals.map((sig) => (
                      <tr key={sig.id}>
                        <td className="px-3 py-2 font-medium text-foreground">{sig.keyword}</td>
                        <td className="px-2 py-2 font-mono text-[10px] uppercase text-muted-foreground">{sig.source}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {sig.position10 > 0 ? (sig.position10 / 10).toFixed(1) : "—"}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {sig.impressions.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                          {sig.clicks.toLocaleString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* İç Bağlantı Fırsatları & RAG Parçaları */}
          <div className="grid gap-4 border-t border-border/60 pt-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <Link2 className="h-3.5 w-3.5 text-blue-600" />
                <span>İç Bağlantı Fırsatları ({linkSuggestions.length})</span>
              </h3>
              {linkSuggestions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Önerilen yeni iç bağlantı yok.</p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {linkSuggestions.slice(0, 5).map((ls) => (
                    <li key={`${ls.fromId}:${ls.toId}`} className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                      <span className="font-medium text-foreground">{ls.fromTitle}</span> →{" "}
                      <span className="font-mono text-blue-600">/{ls.toSlug}</span>{" "}
                      <span className="text-muted-foreground">(“{ls.matchedPhrase}”)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <Database className="h-3.5 w-3.5 text-violet-600" />
                <span>RAG Vektör Parçaları ({chunks.length})</span>
              </h3>
              {chunks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Bu sayfa için RAG parçası yok.</p>
              ) : (
                <div className="space-y-2">
                  {chunks.slice(0, 5).map((ch) => (
                    <HealthBarRow
                      key={ch.chunkIndex}
                      label={ch.headingPath || `Parça #${ch.chunkIndex + 1}`}
                      valueText={`${ch.wordCount} kelime`}
                      pct={Math.min(100, (ch.wordCount / 220) * 100)}
                      tone="violet"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
