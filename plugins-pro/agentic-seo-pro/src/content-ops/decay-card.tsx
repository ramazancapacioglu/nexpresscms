import React from "react";
import { getIntelRepository, getScopedRepository } from "@nexpress/database";
import { rankingDrops } from "./intel";

export interface DecayingContent {
  id: string;
  contentId: string;
  title: string;
  slug: string;
  daysSinceUpdate: number;
  decayLevel: "critical" | "warning" | "fresh";
  wordCount: number;
  hasTldr: boolean;
}

export async function DecayCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale });
  const published = contents.filter((c) => c.status === "published");

  const now = Date.now();
  const allScored: DecayingContent[] = published.map((c) => {
    const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : now;
    const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
    const wordCount = (c.markdownCache ?? "").split(/\s+/).filter(Boolean).length;
    const hasTldr = Boolean(c.tldr && c.tldr.trim().length >= 20);

    let decayLevel: "critical" | "warning" | "fresh" = "fresh";
    if (days >= 180 || !hasTldr) decayLevel = "critical";
    else if (days >= 90 || wordCount < 150) decayLevel = "warning";

    return {
      id: c.id,
      contentId: c.contentId,
      title: c.title,
      slug: c.slug,
      daysSinceUpdate: days,
      decayLevel,
      wordCount,
      hasTldr,
    };
  });

  const criticalCount = allScored.filter((d) => d.decayLevel === "critical").length;
  const warningCount = allScored.filter((d) => d.decayLevel === "warning").length;
  const freshCount = allScored.length - criticalCount - warningCount;
  const decaying = allScored
    .filter((c) => c.decayLevel !== "fresh")
    .sort((a, b) => (a.decayLevel === "critical" ? 0 : 1) - (b.decayLevel === "critical" ? 0 : 1) || b.daysSinceUpdate - a.daysSinceUpdate)
    .slice(0, 10);

  const drops = rankingDrops(await getIntelRepository(siteId).listSignals()).slice(0, 6);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-semibold text-foreground">
            İçerik Erimesi & Tazelik Risk Raporu
          </h4>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              criticalCount > 0
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {criticalCount > 0 ? `${criticalCount} Kritik Risk` : "Taze"}
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {published.length} yayındaki sayfa
        </span>
      </div>

      {/* 3'lü Mini KPI */}
      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 bg-muted/10 text-center">
        <div className="px-3 py-2.5">
          <div className="text-[10px] text-muted-foreground">Kritik Risk</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {criticalCount}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] text-muted-foreground">Uyarı (90g+ / İnce)</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {warningCount}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] text-muted-foreground">Güncel & Taze</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {freshCount}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {drops.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sırası Düşen Webmaster Sorguları ({drops.length})
            </p>
            <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-muted/20 text-[12px]">
              {drops.map((row) => (
                <div key={row.keyword} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate font-medium text-foreground">{row.keyword}</span>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {((row.prevPosition10 ?? 0) / 10).toFixed(1)} → {(row.position10 / 10).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {decaying.length === 0 ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-center text-[12px] text-emerald-700 dark:text-emerald-300">
            Tüm içerikler son 90 gün içinde güncellenmiş, TL;DR özetine ve yeterli kelime derinliğine sahip.
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border/70">
            {decaying.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[12px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{item.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-mono">/{item.slug}</span>
                    <span>·</span>
                    <span>{item.wordCount} kelime</span>
                    {!item.hasTldr && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                        TL;DR Eksik
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      item.decayLevel === "critical"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {item.daysSinceUpdate}g
                  </span>
                  <a
                    href={`/admin/seo/page-report?id=${encodeURIComponent(item.contentId)}`}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                  >
                    Rapor
                  </a>
                  <a
                    href={`/admin/contents?id=${encodeURIComponent(item.contentId)}`}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-muted dark:text-blue-400"
                  >
                    Yenile →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
