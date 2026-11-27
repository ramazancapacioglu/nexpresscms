"use client";

import React, { useState } from "react";
import type { QuickWinKind, SeoQuickWin } from "@nexpress/seo-core";
import { Sparkles, TrendingUp } from "lucide-react";

const LABELS: Record<QuickWinKind | "all", string> = {
  all: "Tüm Fırsatlar",
  page2: "2. Sayfa Hızlı Kazanım",
  low_ctr: "Düşük TO (Başlık Fırsatı)",
  missing_topic: "Eksik Konu Fırsatı",
};

export function SeoQuickWinsPanel({ wins }: { wins: SeoQuickWin[] }) {
  const [tab, setTab] = useState<QuickWinKind | "all">("all");
  if (wins.length === 0) return null;

  const visible = tab === "all" ? wins : wins.filter((w) => w.kind === tab);

  return (
    <section className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              GSC &amp; Bing Hızlı Kazanım Fırsatları ({wins.length})
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Canlı arama sinyallerinden otomatik çıkarılan 2. sayfa yükseltme, düşük TO ve eksik içerik önerileri.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {(["all", "page2", "low_ctr", "missing_topic"] as const).map((k) => {
            const cnt = k === "all" ? wins.length : wins.filter((w) => w.kind === k).length;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-full border px-2.5 py-0.5 font-medium transition ${
                  tab === k
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {LABELS[k]} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="w-full text-left text-[12px]">
          <thead className="border-b border-border/70 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Sorgu</th>
              <th className="px-3 py-2">Kaynak</th>
              <th className="px-3 py-2 text-right">Gösterim</th>
              <th className="px-3 py-2 text-right">Sıra</th>
              <th className="px-3 py-2 text-right">TO</th>
              <th className="px-3 py-2">Önerilen Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-background">
            {visible.slice(0, 15).map((w, idx) => (
              <tr key={`${w.kind}-${w.keyword}-${idx}`}>
                <td className="px-3 py-2 font-medium text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    {w.keyword}
                  </span>
                </td>
                <td className="px-3 py-2 uppercase text-[10px] font-semibold text-muted-foreground">{w.source}</td>
                <td className="px-3 py-2 text-right font-mono">{w.impressions.toLocaleString("tr-TR")}</td>
                <td className="px-3 py-2 text-right font-mono">{w.position ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono">%{w.ctrPct}</td>
                <td className="px-3 py-2 text-[11px] text-muted-foreground">{w.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
