import React from "react";
import { AI_REFERRERS } from "@nexpress/core";
import { getAiReferralRepository } from "@nexpress/database";

const DAYS = 30;
const nameOf = (id: string) => AI_REFERRERS.find((s) => s.id === id)?.name ?? id;

/** Panel kartı: yapay zeka ürünlerinden gelen insan ziyaretleri (son 30 gün). */
export async function AiReferralsCard({ siteId }: { siteId: string }) {
  const s = await getAiReferralRepository(siteId).summary(DAYS);
  const topSource = s.bySource[0];
  const topPath = s.topPaths[0];
  const maxSourceHits = Math.max(1, ...s.bySource.map((x) => x.hits));

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          <h3 className="text-[13px] font-semibold text-foreground">AI Yönlendirme Trafiği</h3>
        </div>
        <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          Son {DAYS} gün · {s.total.toLocaleString("tr-TR")} ziyaret
        </span>
      </div>

      {/* Mini KPI Özeti */}
      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 bg-muted/10 text-center">
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">Toplam AI Ziyareti</div>
          <div className="mt-0.5 font-mono text-[16px] font-semibold tabular-nums text-foreground">
            {s.total.toLocaleString("tr-TR")}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">Aktif Platform</div>
          <div className="mt-0.5 font-mono text-[16px] font-semibold tabular-nums text-foreground">
            {s.bySource.length}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground">Lider Kaynak</div>
          <div className="mt-0.5 truncate text-[13px] font-semibold text-violet-600 dark:text-violet-400">
            {topSource ? nameOf(topSource.source) : "—"}
          </div>
        </div>
      </div>

      {s.total === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
          Henüz AI yönlendirmesi kaydedilmedi. ChatGPT, Perplexity, Gemini, Copilot veya Claude üzerinden sitenize tıklayan ziyaretçiler (Referer / <code>utm_source</code> ile, JS gerekmeden) burada kaynak ve açılış sayfası kırılımıyla görünür.
        </div>
      ) : (
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {/* AI Platform Kırılımı */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Platform Dağılımı
            </div>
            <div className="space-y-2.5">
              {s.bySource.map((x) => {
                const share = Math.round((x.hits / s.total) * 100);
                const width = Math.max(8, Math.round((x.hits / maxSourceHits) * 100));
                return (
                  <div key={x.source} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-foreground">{nameOf(x.source)}</span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        <strong className="text-foreground">{x.hits.toLocaleString("tr-TR")}</strong> ({share}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* En Çok Trafik Çeken Sayfalar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Açılış Sayfaları
              </span>
              {topPath ? (
                <span className="font-mono text-[10px] text-muted-foreground">
                  En yüksek: {topPath.hits}
                </span>
              ) : null}
            </div>
            <ul className="divide-y divide-border/60 rounded-lg border border-border/70 bg-muted/20 text-[12px]">
              {s.topPaths.slice(0, 8).map((x) => {
                const share = Math.round((x.hits / s.total) * 100);
                return (
                  <li key={x.path} className="flex items-center justify-between gap-2 px-3 py-2">
                    <a
                      href={x.path}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-mono text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {x.path}
                    </a>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      <strong className="text-foreground">{x.hits}</strong> · %{share}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <p className="border-t border-border/60 bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
        Sayaçlar göstergedir: Referer başlığı tarayıcıdan gelir; bazı mobil uygulamalar Referer göndermez.
      </p>
    </div>
  );
}
