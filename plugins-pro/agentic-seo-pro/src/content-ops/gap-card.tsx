import React from "react";
import { getScopedRepository } from "@nexpress/database";
import { resolvePublishing } from "@nexpress/core";
import { analyzeContentGaps, GAP_LABEL, GAP_LIMITS, type GapKind } from "./gaps";

/** Panel kartı: yayındaki içeriklerin açıkları (TL;DR, bayatlık, öksüz, ince, kopya). Yalnızca gerçek içerik verisi. */
export async function GapCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale, status: "published" });
  const visible = contents.filter(
    (c) => resolvePublishing(c.schemaAttributes).visibility === "public" && c.type !== "product"
  );
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const report = analyzeContentGaps(
    visible.map((c) => ({
      id: c.contentId,
      title: c.title,
      slug: c.slug,
      type: c.type,
      tldr: c.tldr,
      markdown: c.markdownCache ?? "",
      updatedAt: new Date(c.updatedAt),
      isHome: c.slug === "ana-sayfa",
    })),
    new Date(),
    base
  );
  const kinds = Object.keys(GAP_LABEL) as GapKind[];
  const maxGap = Math.max(1, ...kinds.map((k) => report.counts[k]));
  const healthyCount = Math.max(0, visible.length - report.items.length);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-semibold text-foreground">İçerik Açığı Analizi</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              report.items.length === 0
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
            }`}
          >
            {report.items.length} açık · {healthyCount} temiz
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {visible.length} yayındaki içerik
        </span>
      </div>

      {/* Açık Türü Görsel Çubukları */}
      <div className="grid grid-cols-1 gap-2.5 border-b border-border/60 p-4 sm:grid-cols-2">
        {kinds.map((k) => {
          const n = report.counts[k];
          const pct = n > 0 ? Math.max(8, Math.round((n / maxGap) * 100)) : 0;
          return (
            <div key={k} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground">{GAP_LABEL[k]}</span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    n > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {n}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${n > 0 ? "bg-amber-500" : "bg-emerald-500/40"}`}
                  style={{ width: `${n > 0 ? pct : 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {report.items.length === 0 ? (
        <p className="px-4 py-5 text-center text-[12px] text-emerald-700 dark:text-emerald-300">
          Ölçülen içerik açığı yok (TL;DR ≥ {GAP_LIMITS.tldrMin} karakter, {GAP_LIMITS.staleDays} günden yeni, iç bağlantı alıyor, ≥ {GAP_LIMITS.thinWords} sözcük).
        </p>
      ) : (
        <ul className="divide-y divide-border/60 text-[12px]">
          {report.items.slice(0, 10).map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/30 transition">
              <a
                href={`/admin/contents?id=${encodeURIComponent(g.id)}`}
                className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-blue-600 hover:underline"
              >
                {g.title}
              </a>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {g.kinds.map((k) => (
                  <span
                    key={k}
                    className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300"
                  >
                    {GAP_LABEL[k]}
                  </span>
                ))}
                <a
                  href={`/admin/seo/page-report?id=${encodeURIComponent(g.id)}`}
                  className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
                >
                  Rapor
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
