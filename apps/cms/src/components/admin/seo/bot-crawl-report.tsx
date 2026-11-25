import React from "react";
import Link from "next/link";
import { KNOWN_BOTS, type BotCategory } from "@nexpress/core";
import type { BotDailyPoint, BotPageSummaryDto, BotSummaryDto } from "@nexpress/database";
import { ExternalLink, FileText, Filter } from "lucide-react";

const CATEGORY_LABEL: Record<BotCategory, string> = {
  "ai-search": "AI Arama",
  "ai-training": "AI Eğitim",
  search: "Arama Motoru",
};

const CATEGORY_BADGE: Record<BotCategory, string> = {
  "ai-search": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "ai-training": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  search: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
};

const KIND_LABELS: Record<string, string> = {
  page: "HTML Sayfa",
  markdown: "Markdown",
  llms: "llms.txt",
  sitemap: "Sitemap",
  "ai-sitemap": "AI Sitemap",
  mcp: "WebMCP",
  robots: "robots.txt",
};

function ago(date: Date, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(date).getTime()) / 60000));
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  if (min < 1440) return `${Math.round(min / 60)} sa önce`;
  return `${Math.round(min / 1440)} gün önce`;
}

export function BotCrawlReport({
  fromDay,
  toDay,
  queryBase,
  activeBot,
  activeKind,
  summary,
  dailySeries,
  pages,
}: {
  fromDay: string;
  toDay: string;
  /** Mevcut tarih aralığını koruyan temel sorgu dizesi (örn. `group=bots&range=30d`) */
  queryBase: string;
  activeBot: string;
  activeKind: string;
  summary: BotSummaryDto[];
  dailySeries: BotDailyPoint[];
  pages: BotPageSummaryDto[];
}) {
  const meta = new Map(KNOWN_BOTS.map((b) => [b.id, b]));
  const totalHits = summary.reduce((n, b) => n + b.total, 0);
  const aiHits = summary
    .filter((b) => {
      const cat = meta.get(b.botId)?.category;
      return cat === "ai-search" || cat === "ai-training";
    })
    .reduce((n, b) => n + b.total, 0);
  const mdAndLlmHits = summary.reduce(
    (n, b) => n + (b.byKind.markdown ?? 0) + (b.byKind.llms ?? 0) + (b.byKind.mcp ?? 0) + (b.byKind["ai-sitemap"] ?? 0),
    0
  );
  const maxDay = Math.max(1, ...dailySeries.map((d) => d.total));
  const maxPage = Math.max(1, ...pages.map((p) => p.total));

  const hrefWith = (nextBot: string, nextKind: string) => {
    const p = new URLSearchParams(queryBase);
    if (nextBot) p.set("bot", nextBot);
    else p.delete("bot");
    if (nextKind) p.set("kind", nextKind);
    else p.delete("kind");
    return `/admin/seo/reports?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Özet & Günlük Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs lg:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">Günlük Bot Tarama Trendi</h2>
              <p className="text-[11px] text-muted-foreground">
                {fromDay} – {toDay} arası toplam {totalHits.toLocaleString("tr-TR")} istek ({aiHits.toLocaleString("tr-TR")} AI botu · {mdAndLlmHits.toLocaleString("tr-TR")} Markdown/LLMs/MCP)
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{pages.length} benzersiz sayfa</span>
            </div>
          </div>

          {dailySeries.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
              Seçili aralıkta günlük tarama kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex h-36 items-end gap-1 rounded-lg border border-border/50 bg-muted/20 px-2.5 pb-2 pt-4">
                {dailySeries.map((pt) => {
                  const h = pt.total > 0 ? Math.max(6, Math.round((pt.total / maxDay) * 100)) : 2;
                  return (
                    <div
                      key={pt.day}
                      title={`${pt.day}: ${pt.total.toLocaleString("tr-TR")} istek`}
                      className="group relative flex h-full flex-1 flex-col justify-end"
                    >
                      <div
                        style={{ height: `${h}%` }}
                        className={`w-full rounded-t transition-colors ${
                          pt.total > 0
                            ? "bg-emerald-500/80 group-hover:bg-emerald-500"
                            : "bg-border/40"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>{dailySeries[0]?.day}</span>
                <span>En yüksek gün: {maxDay.toLocaleString("tr-TR")} hit</span>
                <span>{dailySeries[dailySeries.length - 1]?.day}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bot Dağılımı Özeti */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs lg:col-span-4">
          <h2 className="text-[13px] font-semibold text-foreground">Aktif Botlar ({summary.length})</h2>
          <p className="mb-3 text-[11px] text-muted-foreground">Sayfa tablosunu filtrelemek için bota tıklayın.</p>
          {summary.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Bu aralıkta bot kaydı yok.</p>
          ) : (
            <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {summary.map((b) => {
                const sig = meta.get(b.botId);
                const cat = sig?.category ?? "search";
                const isSelected = activeBot === b.botId;
                return (
                  <Link
                    key={b.botId}
                    href={hrefWith(isSelected ? "" : b.botId, activeKind)}
                    prefetch={false}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      isSelected
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "border-border/60 bg-muted/20 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{sig?.name ?? b.botId}</span>
                      <span className={`shrink-0 rounded border px-1 py-px text-[9px] font-semibold ${CATEGORY_BADGE[cat]}`}>
                        {CATEGORY_LABEL[cat]}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums">
                      {b.total.toLocaleString("tr-TR")}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filtre Şeridi + Sayfa Bazlı AI Bot Taramaları Tablosu */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold text-foreground">
              Botların Taradığı Sayfalar
            </h3>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {pages.length} sayfa
            </span>
            {activeBot ? (
              <Link
                href={hrefWith("", activeKind)}
                prefetch={false}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
              >
                Bot: {meta.get(activeBot)?.name ?? activeBot} ×
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {["", "page", "markdown", "llms", "mcp", "sitemap"].map((k) => {
              const active = activeKind === k;
              return (
                <Link
                  key={k || "all"}
                  href={hrefWith(activeBot, k)}
                  prefetch={false}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k ? (KIND_LABELS[k] ?? k) : "Tümü"}
                </Link>
              );
            })}
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Seçili tarih aralığı ve filtre için sayfa bazlı tarama kaydı henüz oluşmadı.</p>
            <p>
              Sayfa bazlı bot günlüğü (<code>bot_page_daily</code>) aktif çalışıyor; AI ve arama motoru botları sayfalarınızı, <code>?format=md</code> veya <code>/llms.txt</code> adreslerini taradıkça burada URL bazında anlık birikecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/70 bg-muted/20 text-[11px] font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Taranan Sayfa / Uç Nokta</th>
                  <th className="px-3 py-2.5 text-right">Hit</th>
                  <th className="px-3 py-2.5">Tarayan Botlar</th>
                  <th className="px-3 py-2.5">Yüzey / Format</th>
                  <th className="px-4 py-2.5 text-right">Son Tarama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pages.map((row) => {
                  const bots = Object.entries(row.byBot).sort((a, b) => b[1] - a[1]);
                  const kinds = Object.entries(row.byKind).sort((a, b) => b[1] - a[1]);
                  const barPct = Math.max(4, Math.round((row.total / maxPage) * 100));
                  const isPageUrl = row.path.startsWith("/") && !row.path.startsWith("/api/") && !row.path.endsWith(".xml") && !row.path.endsWith(".txt");
                  return (
                    <tr key={row.path} className="hover:bg-muted/20">
                      <td className="max-w-md px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={row.path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-w-0 items-center gap-1 font-mono text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <span className="truncate">{row.path}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                          </a>
                          {isPageUrl ? (
                            <a
                              href={`${row.path}${row.path.includes("?") ? "&" : "?"}format=md`}
                              target="_blank"
                              rel="noreferrer"
                              title="Markdown çıktısını gör"
                              className="inline-flex shrink-0 items-center gap-0.5 rounded border border-border bg-muted/40 px-1.5 py-px font-mono text-[9px] text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="h-2.5 w-2.5" /> md
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-1 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-500/75" style={{ width: `${barPct}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                        {row.total.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {bots.map(([bid, count]) => {
                            const sig = meta.get(bid);
                            const cat = sig?.category ?? "search";
                            return (
                              <Link
                                key={bid}
                                href={hrefWith(bid, activeKind)}
                                prefetch={false}
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium hover:opacity-80 ${CATEGORY_BADGE[cat]}`}
                              >
                                <span>{sig?.name ?? bid}</span>
                                <span className="font-mono font-bold">{count}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {kinds.map(([k, n]) => (
                            <span
                              key={k}
                              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {KIND_LABELS[k] ?? k}: {n}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                        {ago(row.lastSeenAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
