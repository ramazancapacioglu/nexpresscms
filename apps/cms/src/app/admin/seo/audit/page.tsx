import React from "react";
import Link from "next/link";
import { auditSeo, countImagesMissingAlt, resolvePublishing, SEO_ISSUE_LABELS, type SeoIssueId } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const LEVEL = { error: "bg-red-500/10 text-red-700 dark:text-red-300", warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300", info: "bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" } as const;

export default async function SeoAuditPage({ searchParams }: { searchParams: Promise<{ issue?: string; locale?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const locales = site?.supportedLocales ?? ["tr"];
  const locale = sp.locale && locales.includes(sp.locale) ? sp.locale : site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale, status: "published" });
  const report = auditSeo(
    contents.map((c) => ({
      id: c.id, locale, slug: c.slug, title: c.title, type: c.type, status: c.status, metaTitle: c.metaTitle ?? null, metaDescription: c.metaDescription ?? null, tldr: c.tldr ?? null, noIndex: c.noIndex,
      seoScore: c.seoScore, words: (c.markdownCache ?? "").split(/\s+/).filter(Boolean).length, focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "", imagesMissingAlt: countImagesMissingAlt(c.blocks as never),
    }))
  );
  const issue = sp.issue && sp.issue in SEO_ISSUE_LABELS ? (sp.issue as SeoIssueId) : null;
  const rows = report.rows.filter((r) => (issue ? r.issues.some((i) => i.id === issue) : r.issues.some((i) => i.level !== "info")));
  const s = report.summary;
  const q = (extra: string) => `/admin/seo/audit?locale=${locale}${extra}`;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <Link href="/admin/seo" className="text-[11px] text-[#5F6570] hover:underline dark:text-[#8C9099]">← SEO motoru</Link>
          <h1 className="text-[18px] font-semibold tracking-tight">SEO denetimi</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Yayındaki {s.pages} içeriğin başlık, açıklama, TL;DR, içerik derinliği, alt metin ve yinelenme kontrolü. Her satır düzenleyiciye gider.</p>
        </div>
        {locales.length > 1 && (
          <div role="tablist" aria-label="Dil" className="inline-flex rounded-md bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:bg-[#1C1E24]">
            {locales.map((l) => <Link key={l} role="tab" aria-selected={l === locale} href={`/admin/seo/audit?locale=${l}`} className={`rounded px-3 py-1 ${l === locale ? "bg-white shadow-sm dark:bg-[#2A2D35]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>{l.toUpperCase()}</Link>)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Ortalama puan", s.avgScore], ["Hatalı sayfa", s.withErrors], ["Uyarılı sayfa", s.withWarnings], ["Sorunsuz", s.clean]].map(([label, v]) => (
          <div key={label as string} className={`rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}><p className="text-[11px] font-medium text-[#5F6570] dark:text-[#8C9099]">{label}</p><p className="mt-1 text-[22px] font-semibold">{v}</p></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 text-[12px]">
        <Link href={q("")} aria-current={!issue} className={`rounded-full border px-3 py-1 ${!issue ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" : border}`}>Sorunlular</Link>
        {(Object.entries(s.byIssue) as Array<[SeoIssueId, number]>).sort((a, b) => b[1] - a[1]).map(([id, n]) => (
          <Link key={id} href={q(`&issue=${id}`)} aria-current={issue === id} className={`rounded-full border px-3 py-1 ${issue === id ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" : border}`}>{SEO_ISSUE_LABELS[id]} ({n})</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center text-[13px] dark:bg-[#15171C]`}>{s.pages === 0 ? "Bu dilde yayında içerik yok." : "Bu süzgeçte sorun yok. 🎯"}</div>
      ) : (
        <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-4 py-3 text-[12px]">
              <div className="min-w-0 flex-1 basis-64">
                <Link href={`/admin/contents?id=${encodeURIComponent(r.id)}&locale=${locale}`} className="block truncate text-[13px] font-medium hover:underline">{r.title}</Link>
                <p className="text-[#5F6570] dark:text-[#8C9099]">{r.type} · /{locale}/{r.slug} · {r.words} sözcük</p>
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[#5F6570] dark:text-[#8C9099]">{r.seoScore}/100</span>
              <div className="flex min-w-0 flex-[2] basis-72 flex-wrap gap-1">
                {r.issues.map((i) => <span key={i.id} className={`rounded px-1.5 py-0.5 text-[11px] ${LEVEL[i.level]}`}>{i.label}</span>)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
