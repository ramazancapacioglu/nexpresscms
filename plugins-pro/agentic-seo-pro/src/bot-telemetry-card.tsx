import React from "react";
import { KNOWN_BOTS, type BotCategory } from "@nexpress/core";
import { getBotStatsRepository } from "@nexpress/database";

const DAYS = 30;
const CATEGORY_LABEL: Record<BotCategory, string> = {
  "ai-training": "AI eğitim",
  "ai-search": "AI arama",
  search: "Arama motoru",
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

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Gerçek tarama günlüğünden beslenen AI bot kartı (son 30 gün, `bot_daily_stats`). */
export async function BotTelemetryCard({ siteId }: { siteId: string }) {
  const summary = await getBotStatsRepository(siteId).summary(DAYS);
  const meta = new Map(KNOWN_BOTS.map((b) => [b.id, b]));
  const total = summary.reduce((n, s) => n + s.total, 0);

  return (
    <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] overflow-hidden`}>
      <div className={`px-4 py-2.5 border-b ${border} bg-[#FBFBFB] dark:bg-[#121317] flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">Bot Tarama Günlüğü</span>
          <span className={`rounded border ${border} px-1.5 py-0.5 font-mono text-[10px] text-[#5C5F66] dark:text-[#9CA3AF]`}>
            son {DAYS} gün • {total.toLocaleString("tr-TR")} istek
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {["/llms-full.txt", "/ai-sitemap.json", "/api/mcp"].map((href) => (
            <a key={href} href={href} target="_blank" className={`rounded border ${border} px-2 py-0.5 text-[#5C5F66] dark:text-[#9CA3AF] hover:underline`}>
              {href}
            </a>
          ))}
        </div>
      </div>

      {summary.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-[#8C9099]">
          Henüz bilinen bir bot isteği kaydedilmedi. Kayıt, botlar sayfaları, <code>llms.txt</code>, site haritasını veya <code>/api/mcp</code>
          adresini çektikçe oluşur.
        </p>
      ) : (
        <div className={`divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]`}>
          {summary.map((s) => {
            const sig = meta.get(s.botId);
            const kinds = Object.entries(s.byKind).sort((a, b) => b[1] - a[1]);
            const canVerify = (sig?.expectedDnsSuffixes.length ?? 0) > 0;
            return (
              <div key={s.botId} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-[#14151A] dark:text-[#F3F4F6] truncate">
                    {sig?.name ?? s.botId}
                    <span className="ml-2 text-[10px] font-normal text-[#8C9099]">
                      {sig ? `${sig.vendor} • ${CATEGORY_LABEL[sig.category]}` : ""}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#8C9099] truncate">
                    {kinds.map(([k, n]) => `${KIND_LABEL[k] ?? k} ${n}`).join(" • ")}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-[11px]">
                  <span className="font-mono tabular-nums text-[#14151A] dark:text-white">{s.total.toLocaleString("tr-TR")}</span>
                  <span
                    title={canVerify ? "Ters DNS (FCrDNS) ile doğrulanan istek oranı" : "Bu sağlayıcı ters DNS sunmaz; yalnızca User-Agent iddiası"}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      canVerify && s.verified > 0
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-400"
                    }`}
                  >
                    {canVerify ? `rDNS %${Math.round((s.verified / s.total) * 100)}` : "UA iddiası"}
                  </span>
                  <span className="text-[#8C9099] w-20 text-right">{ago(s.lastSeenAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className={`px-4 py-2 border-t ${border} text-[10px] text-[#8C9099]`}>
        IP ve User-Agent saklanmaz; yalnızca günlük sayaç tutulur. CDN önbelleğinden dönen istekler uygulamaya ulaşmaz ve sayılmaz.
      </p>
    </div>
  );
}
