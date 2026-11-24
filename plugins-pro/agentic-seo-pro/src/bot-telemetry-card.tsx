import React from "react";
import { KNOWN_BOTS, type BotCategory } from "@nexpress/core";
import { getBotStatsRepository } from "@nexpress/database";

const DAYS = 30;
const CATEGORY_LABEL: Record<BotCategory, string> = {
  "ai-training": "AI Eğitim",
  "ai-search": "AI Arama",
  search: "Arama Motoru",
};
const CATEGORY_BADGE: Record<BotCategory, string> = {
  "ai-training": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "ai-search": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  search: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};
const KIND_LABEL: Record<string, string> = {
  page: "sayfa",
  markdown: "markdown",
  llms: "llms.txt",
  sitemap: "sitemap",
  "ai-sitemap": "ai-sitemap",
  robots: "robots",
  mcp: "mcp",
};

function ago(date: Date, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(date).getTime()) / 60000));
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  if (min < 1440) return `${Math.round(min / 60)} sa önce`;
  return `${Math.round(min / 1440)} gün önce`;
}

/** Gerçek tarama günlüğünden beslenen AI & Arama bot kartı (son 30 gün, `bot_daily_stats`). */
export async function BotTelemetryCard({ siteId }: { siteId: string }) {
  const summary = await getBotStatsRepository(siteId).summary(DAYS);
  const meta = new Map(KNOWN_BOTS.map((b) => [b.id, b]));
  const total = summary.reduce((n, s) => n + s.total, 0);
  const verifiedTotal = summary.reduce((n, s) => n + s.verified, 0);
  const maxBot = Math.max(1, ...summary.map((s) => s.total));

  let aiSearchHits = 0;
  let aiTrainHits = 0;
  let searchHits = 0;
  const surfaceTotals = new Map<string, number>();

  for (const s of summary) {
    const cat = meta.get(s.botId)?.category ?? "search";
    if (cat === "ai-search") aiSearchHits += s.total;
    else if (cat === "ai-training") aiTrainHits += s.total;
    else searchHits += s.total;
    for (const [k, v] of Object.entries(s.byKind)) {
      surfaceTotals.set(k, (surfaceTotals.get(k) ?? 0) + v);
    }
  }
  const topSurfaces = [...surfaceTotals.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <h3 className="text-[13px] font-semibold text-foreground">Bot Tarama Günlüğü</h3>
          <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            son {DAYS} gün · {total.toLocaleString("tr-TR")} istek
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {["/llms-full.txt", "/ai-sitemap.json", "/api/mcp"].map((href) => (
            <a
              key={href}
              href={href}
              target="_blank"
              className="rounded-md border border-border bg-background px-2 py-0.5 text-muted-foreground hover:text-foreground hover:underline"
            >
              {href}
            </a>
          ))}
        </div>
      </div>

      {/* Kategori KPI Özeti */}
      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 bg-muted/10 text-center">
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">AI Arama & Eğitim</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {(aiSearchHits + aiTrainHits).toLocaleString("tr-TR")}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">Arama Motorları</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-blue-700 dark:text-blue-400">
            {searchHits.toLocaleString("tr-TR")}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">Doğrulanmış rDNS</div>
          <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-foreground">
            {total > 0 ? `%${Math.round((verifiedTotal / total) * 100)}` : "—"}
          </div>
        </div>
      </div>

      {/* Yüzey Dağılım Rozetleri */}
      {topSurfaces.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-4 py-2 text-[10px]">
          <span className="font-semibold text-muted-foreground">Taranan yüzeyler:</span>
          {topSurfaces.map(([k, v]) => (
            <span
              key={k}
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-foreground"
            >
              {KIND_LABEL[k] ?? k}: <strong>{v.toLocaleString("tr-TR")}</strong>
            </span>
          ))}
        </div>
      )}

      {summary.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
          Henüz bilinen bir bot isteği kaydedilmedi. Kayıt, botlar sayfaları, <code>llms.txt</code>, site haritasını veya <code>/api/mcp</code> adresini çektikçe oluşur.
        </p>
      ) : (
        <div className="divide-y divide-border/60 text-[12px]">
          {summary.map((s) => {
            const sig = meta.get(s.botId);
            const kinds = Object.entries(s.byKind).sort((a, b) => b[1] - a[1]);
            const canVerify = (sig?.expectedDnsSuffixes.length ?? 0) > 0;
            const cat = sig?.category ?? "search";
            const pct = Math.max(6, Math.round((s.total / maxBot) * 100));
            return (
              <div key={s.botId} className="space-y-1.5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {sig?.name ?? s.botId}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE[cat]}`}>
                      {CATEGORY_LABEL[cat]}
                    </span>
                    {sig?.vendor ? (
                      <span className="hidden text-[10px] text-muted-foreground sm:inline">
                        {sig.vendor}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 text-[11px]">
                    <span className="font-mono font-semibold tabular-nums text-foreground">
                      {s.total.toLocaleString("tr-TR")}
                    </span>
                    <span
                      title={
                        canVerify
                          ? "Ters DNS (FCrDNS) ile doğrulanan istek oranı"
                          : "Bu sağlayıcı ters DNS sunmaz; yalnızca User-Agent iddiası"
                      }
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                        canVerify && s.verified > 0
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {canVerify ? `rDNS %${Math.round((s.verified / s.total) * 100)}` : "UA iddiası"}
                    </span>
                    <span className="w-16 text-right text-[10px] text-muted-foreground">
                      {ago(s.lastSeenAt)}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500/80" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {kinds.map(([k, n]) => (
                    <span
                      key={k}
                      className="rounded bg-muted/60 px-1.5 py-px font-mono text-[10px] text-muted-foreground"
                    >
                      {KIND_LABEL[k] ?? k} {n}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="border-t border-border/60 bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
        IP ve User-Agent saklanmaz; yalnızca günlük sayaç tutulur. CDN önbelleğinden dönen istekler uygulamaya ulaşmaz.
      </p>
    </div>
  );
}
