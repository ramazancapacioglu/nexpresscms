"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Search, TrendingUp } from "lucide-react";

export interface SeoSignalRow {
  id: string;
  source: string;
  keyword: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  position: number;
  prevPosition: number;
  detail: string;
}

type SignalTab = "all" | "top10" | "opportunity" | "winners" | "losers";
type SignalSort = "impressions" | "clicks" | "position" | "ctr";

/** Webmaster (GSC / Bing / Yandex) sorgu ve fırsat tablosu. */
export function SeoSignalsTableClient({ signals }: { signals: SeoSignalRow[] }) {
  const [tab, setTab] = useState<SignalTab>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SignalSort>("impressions");
  const [showAll, setShowAll] = useState(false);

  const sources = useMemo(() => [...new Set(signals.map((s) => s.source))].sort(), [signals]);

  const counts = useMemo(
    () => ({
      all: signals.length,
      top10: signals.filter((s) => s.position > 0 && s.position <= 10).length,
      opportunity: signals.filter(
        (s) => s.position >= 4 && s.position <= 20 && s.impressions >= 20
      ).length,
      winners: signals.filter((s) => s.prevPosition > 0 && s.position > 0 && s.prevPosition - s.position >= 0.5).length,
      losers: signals.filter((s) => s.prevPosition > 0 && s.position > 0 && s.position - s.prevPosition >= 0.5).length,
    }),
    [signals]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const list = signals.filter((s) => {
      if (tab === "top10" && !(s.position > 0 && s.position <= 10)) return false;
      if (tab === "opportunity" && !(s.position >= 4 && s.position <= 20 && s.impressions >= 20))
        return false;
      if (tab === "winners" && !(s.prevPosition > 0 && s.position > 0 && s.prevPosition - s.position >= 0.5))
        return false;
      if (tab === "losers" && !(s.prevPosition > 0 && s.position > 0 && s.position - s.prevPosition >= 0.5))
        return false;
      if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
      if (q && !`${s.keyword} ${s.detail} ${s.source}`.toLocaleLowerCase("tr-TR").includes(q)) {
        return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "clicks") return b.clicks - a.clicks || b.impressions - a.impressions;
      if (sort === "position") return (a.position || 999) - (b.position || 999);
      if (sort === "ctr") return b.ctrPct - a.ctrPct;
      return b.impressions - a.impressions;
    });
  }, [signals, tab, sourceFilter, query, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 15);

  const exportCsv = () => {
    const lines = [
      "Sorgu,Kaynak,Pozisyon,OncekiPozisyon,Gosterim,Tiklama,TO_Yuzde",
      ...filtered.map((s) =>
        [
          `"${s.keyword.replace(/"/g, '""')}"`,
          s.source,
          s.position.toFixed(1),
          s.prevPosition > 0 ? s.prevPosition.toFixed(1) : "",
          s.impressions,
          s.clicks,
          s.ctrPct.toFixed(2),
        ].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexpress-webmaster-sorgular.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (signals.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
        <h3 className="text-[13px] font-semibold text-foreground">
          Webmaster Sorgu Verisi Henüz Çekilmedi
        </h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Google Search Console veya Bing Webmaster entegrasyonunu bağlayıp &quot;Şimdi Eşitle&quot; dediğinizde tüm sorgu, tıklama ve pozisyon verileri burada filtrelenebilir tablo olarak görünür.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 p-1">
          {(
            [
              { id: "all", label: "Tüm Sorgular", count: counts.all },
              { id: "top10", label: "İlk 10", count: counts.top10 },
              { id: "opportunity", label: "Fırsat (4–20)", count: counts.opportunity },
              { id: "winners", label: "Yükselenler", count: counts.winners },
              { id: "losers", label: "Düşenler", count: counts.losers },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setShowAll(false);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                tab === t.id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t.label}</span>
              <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px]">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[190px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Anahtar kelime ara..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Kaynak filtresi"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Kaynaklar</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            aria-label="Sıralama"
            value={sort}
            onChange={(e) => setSort(e.target.value as SignalSort)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="impressions">Gösterim (Yüksek)</option>
            <option value="clicks">Tıklama (Yüksek)</option>
            <option value="position">Pozisyon (En İyi)</option>
            <option value="ctr">TO % (Yüksek)</option>
          </select>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Webmaster anahtar kelime tablosu">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-medium text-muted-foreground">
              <th className="px-4 py-2.5">Anahtar Kelime</th>
              <th className="px-3 py-2.5">Kaynak</th>
              <th className="px-3 py-2.5 text-right">Pozisyon</th>
              <th className="px-3 py-2.5 text-right">Gösterim</th>
              <th className="px-3 py-2.5 text-right">Tıklama</th>
              <th className="px-4 py-2.5 text-right">TO %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-[12px]">
            {visible.map((s) => {
              const delta = s.prevPosition > 0 && s.position > 0 ? s.prevPosition - s.position : 0;
              const srcTone =
                s.source === "gsc"
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : s.source === "bing"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground";
              return (
                <tr key={s.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 max-w-[340px]">
                    <div className="truncate font-medium text-foreground">{s.keyword}</div>
                    {s.detail ? (
                      <div className="truncate font-mono text-[10px] text-muted-foreground">
                        {s.detail}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${srcTone}`}>
                      {s.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    <span className="font-semibold text-foreground">
                      {s.position > 0 ? s.position.toFixed(1) : "—"}
                    </span>
                    {Math.abs(delta) >= 0.1 ? (
                      <span
                        className={`ml-1.5 inline-flex items-center text-[10px] font-semibold ${
                          delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(delta).toFixed(1)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {s.impressions.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-foreground">
                    {s.clicks.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                    %{s.ctrPct.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>
          Gösterilen: <strong className="text-foreground">{visible.length}</strong> / {filtered.length} sorgu
        </span>
        {filtered.length > 15 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {showAll ? "İlk 15 sorguyu göster" : `Tüm ${filtered.length} sorguyu göster`}
          </button>
        ) : null}
      </div>
    </section>
  );
}
