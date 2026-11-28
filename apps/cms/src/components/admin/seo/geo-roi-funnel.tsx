import React from "react";
import type { BingAiPerformanceSnapshot, GeoRoiSummary } from "@nexpress/core";
import { ArrowUpRight, Bot, FileText, Sparkles, Target } from "lucide-react";
import { BingAiCsvImport } from "./bing-ai-csv-import";

interface GeoRoiFunnelProps {
  fromDay: string;
  toDay: string;
  summary: GeoRoiSummary;
  topSources: Array<{ source: string; hits: number }>;
  bingAiPerformance?: BingAiPerformanceSnapshot | null;
}

/**
 * GEO ROI Hunisi: sayfa bazında AI bot taraması → Bing AI atıf → AI yönlendirmesi → teklif/form dönüşümü.
 */
export function GeoRoiFunnel({
  fromDay,
  toDay,
  summary,
  topSources,
  bingAiPerformance = null,
}: GeoRoiFunnelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>AI Bot Taraması</span>
            <Bot className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary.totalBotHits.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary.totalMarkdownHits.toLocaleString("tr-TR")} Markdown/LLMs isteği ({fromDay} – {toDay})
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>AI Yönlendirme Trafiği</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary.totalAiVisits.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {topSources.length > 0
              ? topSources.slice(0, 3).map((s) => `${s.source} (${s.hits})`).join(" · ")
              : "Henüz AI kaynaklı ziyaret kaydı yok"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Form / Teklif Dönüşümü</span>
            <Target className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary.totalConversions.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Spam dışı form gönderimleri (dönem içi)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Aktif Huni Sayfası</span>
            <FileText className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary.activePages.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary.totalBingCitations > 0
              ? `${summary.totalBingCitations.toLocaleString("tr-TR")} Bing AI atıf · ${summary.activePages} aktif sayfa`
              : "Bot, AI trafik veya form etkileşimi alan sayfalar"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Sayfa Bazlı GEO ROI Hunisi</h2>
            <p className="text-xs text-muted-foreground">
              Hangi rehber ve ürün sayfasının AI botlarınca taranıp AI trafiği ve teklif formu dönüşümüne dönüştüğünü gösterir.
            </p>
          </div>
        </div>

        {summary.rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-xs text-muted-foreground">
            Seçili tarih aralığında ({fromDay} – {toDay}) bot, AI yönlendirmesi veya form dönüşümü kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Sayfa Adresi</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Bot Taraması</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Markdown / LLMs</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Bing AI Atıf</th>
                  <th className="px-3 py-2.5 text-right font-semibold">AI Ziyareti</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Teklif / Form</th>
                  <th className="px-4 py-2.5 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.rows.map((row) => (
                  <tr key={row.path} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-foreground">{row.path}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{row.botHits.toLocaleString("tr-TR")}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                      {row.markdownHits.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {row.bingCitations > 0 ? row.bingCitations.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {row.aiVisits.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.conversions.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={row.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                        >
                          Aç <ArrowUpRight className="h-3 w-3" />
                        </a>
                        <a
                          href={`${row.path}${row.path.includes("?") ? "&" : "?"}format=md`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                        >
                          .md
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BingAiCsvImport snapshot={bingAiPerformance} />
    </div>
  );
}
