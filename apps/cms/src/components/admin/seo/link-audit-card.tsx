import React from "react";
import { auditLinks, resolvePublishing } from "@nexpress/core";
import type { ContentDto } from "@nexpress/database";

/** Yayındaki içeriklerdeki kırık / taşınmış iç bağlantılar (sunucuda hesaplanır, istemci JS'i yok). */
export function LinkAuditCard({ contents, locales }: { contents: ContentDto[]; locales: string[] }) {
  const published = contents.filter((c) => c.status === "published");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = auditLinks(
    published.map((c) => ({
      id: c.contentId,
      title: c.title,
      slug: c.slug,
      locale: c.locale,
      markdown: c.markdownCache,
      slugHistory: resolvePublishing(c.schemaAttributes).slugHistory,
    })),
    { baseUrl, locales }
  );
  const broken = result.issues.filter((i) => i.kind === "broken");
  const moved = result.issues.filter((i) => i.kind === "redirect");
  return (
    <section className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#111317] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">İç bağlantı denetimi</h2>
        <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          {result.internalChecked} iç, {result.externalCount} dış bağlantı · dış bağlantılar denetlenmez
        </span>
      </div>
      {result.issues.length === 0 ? (
        <p className="text-xs text-emerald-800 dark:text-emerald-300">Kırık veya taşınmış iç bağlantı bulunamadı.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {[...broken, ...moved].map((i, n) => (
            <li key={n} className="flex flex-wrap gap-x-2">
              <a href={`/admin/contents?id=${encodeURIComponent(i.fromId)}`} className="font-medium underline-offset-2 hover:underline">
                {i.fromTitle}
              </a>
              <code className="text-[11px]">{i.url}</code>
              <span className={i.kind === "broken" ? "text-red-600" : "text-amber-800 dark:text-amber-300"}>
                {i.kind === "broken" ? "kırık" : `301 → ${i.target}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
