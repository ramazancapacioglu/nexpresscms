"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Edit3, Search } from "lucide-react";

export interface SeoAuditRowItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  seoScore: number;
  words: number;
  issues: Array<{ id: string; level: "error" | "warning" | "info"; label: string }>;
}

const LEVEL_BADGE = {
  error: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
} as const;

type SeverityFilter = "all" | "error" | "warning" | "clean";
type AuditSort = "score_asc" | "score_desc" | "issues_desc" | "words_asc";

/** SEO Denetim tablosu — istemci tarafında arama, tür, önem düzeyi ve CSV dışa aktarma. */
export function SeoAuditTableClient({
  rows,
  locale,
}: {
  rows: SeoAuditRowItem[];
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [sort, setSort] = useState<AuditSort>("score_asc");

  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const list = rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      const hasError = r.issues.some((i) => i.level === "error");
      const hasWarn = r.issues.some((i) => i.level === "warning");
      if (severity === "error" && !hasError) return false;
      if (severity === "warning" && !hasWarn) return false;
      if (severity === "clean" && (hasError || hasWarn)) return false;
      if (q) {
        const hay = `${r.title} ${r.slug} ${r.issues.map((i) => i.label).join(" ")}`.toLocaleLowerCase("tr-TR");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "score_desc") return b.seoScore - a.seoScore;
      if (sort === "issues_desc") return b.issues.length - a.issues.length;
      if (sort === "words_asc") return a.words - b.words;
      return a.seoScore - b.seoScore;
    });
  }, [rows, query, typeFilter, severity, sort]);

  const exportCsv = () => {
    const lines = [
      "Baslik,Slug,Tur,SEO,Kelime,Sorunlar",
      ...filtered.map((r) =>
        [
          `"${r.title.replace(/"/g, '""')}"`,
          `"/${locale}/${r.slug}"`,
          r.type,
          r.seoScore,
          r.words,
          `"${r.issues.map((i) => i.label).join("; ").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexpress-seo-denetim.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sayfa, URL veya sorun ara..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="İçerik türü"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Türler</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Sorun seviyesi"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SeverityFilter)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="error">Hatalı</option>
            <option value="warning">Uyarılı</option>
            <option value="clean">Temiz</option>
          </select>

          <select
            aria-label="Sıralama"
            value={sort}
            onChange={(e) => setSort(e.target.value as AuditSort)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="score_asc">SEO Puanı (En Düşük)</option>
            <option value="score_desc">SEO Puanı (En Yüksek)</option>
            <option value="issues_desc">Sorun Sayısı (Çoktan Aza)</option>
            <option value="words_asc">Kelime Sayısı (Azdan Çoğa)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{filtered.length}</strong> / {rows.length} sayfa
          </span>
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

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-[13px] text-muted-foreground">
          Bu filtrede eşleşen sayfa bulunmuyor.
        </div>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="SEO denetim sonuçları">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-medium text-muted-foreground">
                <th className="px-4 py-2.5">Sayfa & URL</th>
                <th className="px-3 py-2.5">SEO Puanı</th>
                <th className="px-3 py-2.5 text-right">Kelime</th>
                <th className="px-3 py-2.5">Tespit Edilen Sorunlar</th>
                <th className="px-4 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[12px]">
              {filtered.map((r) => {
                const barTone =
                  r.seoScore >= 85
                    ? "bg-emerald-500"
                    : r.seoScore >= 70
                      ? "bg-blue-500"
                      : r.seoScore >= 55
                        ? "bg-amber-500"
                        : "bg-rose-500";
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 max-w-[280px]">
                      <Link
                        href={`/admin/contents?id=${encodeURIComponent(r.id)}&locale=${locale}`}
                        className="block truncate font-semibold text-foreground hover:text-blue-600"
                      >
                        {r.title}
                      </Link>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {r.type} · /{locale}/{r.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3 min-w-[125px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${barTone}`}
                            style={{ width: `${Math.max(4, Math.min(100, r.seoScore))}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[11px] font-semibold tabular-nums">
                          {r.seoScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                      {r.words.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.issues.length === 0 ? (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            Sorun yok
                          </span>
                        ) : (
                          r.issues.map((i) => (
                            <span
                              key={i.id}
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE[i.level]}`}
                            >
                              {i.label}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/contents?id=${encodeURIComponent(r.id)}&locale=${locale}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-blue-500 hover:text-blue-600 transition"
                      >
                        <Edit3 className="h-3 w-3" />
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
