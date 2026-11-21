import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auditSeo, countImagesMissingAlt, resolvePublishing, resolveSiteSettings, SEO_ISSUE_LABELS, sitemapArchiveTypes, type SeoIssueId } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SyncNowButton } from "@/components/admin/seo/sync-now-button";
import { buildSeoSummary } from "@/components/admin/seo/seo-summary";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin/seo/audit", label: "Denetim & Bağlantılar", detail: "Sayfa sayfa sorun listesi, konu kümesi ve kırık bağlantı kontrolü" },
  { href: "/admin/seo/sitemap", label: "Site Haritası", detail: "İçerik türü, kategori ve etiket haritası seçimi" },
  { href: "/admin/seo/schemas", label: "Şemalar & Arama Dizini", detail: "JSON-LD şema kuralları ve RAG vektör arama dizini" },
  { href: "/admin/redirects", label: "Yönlendirmeler & 404", detail: "301/302 kuralları ve bulunamayan adres günlüğü" },
  { href: "/admin/seo/integrations", label: "Webmaster", detail: "Google Search Console, GA4, Bing ve Yandex bağlantıları" },
  { href: "/admin/seo/settings", label: "SEO Ayarları", detail: "Yayın, başlık, yerel işletme, marka DNA ve anahtarlar" },
];

/** Site sağlığı. Ayar ve rapor bu sayfada yok. */
export default async function AdminSeoPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale, status: "published" });
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
  const issues = (Object.entries(s.byIssue) as Array<[SeoIssueId, number]>).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...issues.map(([, n]) => n));
  const grades = [
    ["A", summary.grades.a, "90+"],
    ["B", summary.grades.b, "75–89"],
    ["C", summary.grades.c, "60–74"],
    ["D", summary.grades.d, "60 altı"],
  ] as const;
  const gradeMax = Math.max(1, ...grades.map(([, n]) => n));
  const archives = sitemapArchiveTypes(seo);
  const indexed = seo.searchIndexing !== false;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <AdminPageHeader
        title="SEO Genel Bakış"
        description={`${site?.name ?? "Site"} · Harita: ${archives.includes("etiket") ? "etiketler dahil" : "etiketler hariç"}`}
        badge={
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              indexed
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            {indexed ? "İndeks açık" : "İndeks kapalı"}
          </span>
        }
        actions={<SyncNowButton />}
      />
      {!indexed ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          Site arama motorlarına kapalı. Açmak için Ayarlar.
        </p>
      ) : null}
      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C] lg:grid-cols-4">
        {[
          ["Ortalama skor", `${s.avgScore}`, "/100"],
          ["Hatalı sayfa", String(s.withErrors), "açıklama veya düşük puan"],
          ["Uyarılı sayfa", String(s.withWarnings), "başlık, özet veya görsel"],
          ["Temiz sayfa", String(s.clean), `${s.pages} yayında`],
        ].map(([label, value, hint]) => (
          <div key={label} className="border-[#E6E7EA] p-4 dark:border-[#23262E] lg:border-l first:lg:border-l-0">
            <dt className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {value}
              <span className="ml-2 text-[11px] font-normal text-[#5F6570] dark:text-[#8C9099]">{hint}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Sorun dağılımı</h2>
            <Link href="/admin/seo/audit" className="text-[12px] underline">
              Denetimi aç
            </Link>
          </div>
          {issues.length === 0 ? (
            <p className="mt-4 text-[12px] text-[#5F6570] dark:text-[#8C9099]">Yayında açık sorun yok.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {issues.map(([id, count]) => (
                <li key={id}>
                  <div className="flex justify-between text-[12px]">
                    <Link href={`/admin/seo/audit?issue=${id}`} className="hover:underline">
                      {SEO_ISSUE_LABELS[id]}
                    </Link>
                    <span className="tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-[#E6E7EA] dark:bg-[#23262E]">
                    <div className="h-full bg-[#266DF0]" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
          <h2 className="text-[13px] font-semibold">Skor dağılımı</h2>
          <ul className="mt-3 space-y-2">
            {grades.map(([letter, count, range]) => (
              <li key={letter}>
                <div className="flex justify-between text-[12px]">
                  <span>
                    {letter} <span className="text-[#5F6570] dark:text-[#8C9099]">{range}</span>
                  </span>
                  <span className="tabular-nums">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-[#E6E7EA] dark:bg-[#23262E]">
                  <div className="h-full bg-[#14151A] dark:bg-[#F3F4F6]" style={{ width: `${Math.round((count / gradeMax) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-[#E6E7EA] bg-white px-4 py-3 hover:border-[#266DF0] dark:border-[#23262E] dark:bg-[#15171C]">
            <div className="text-[13px] font-medium">{item.label}</div>
            <div className="mt-0.5 text-[12px] text-[#5F6570] dark:text-[#8C9099]">{item.detail}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
