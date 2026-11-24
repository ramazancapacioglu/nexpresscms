"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, Edit3, Search, SlidersHorizontal } from "lucide-react";

export interface OverviewContentRow {
  id: string;
  contentId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  schemaType: string;
  seoScore: number;
  importanceScore: number;
  words: number;
  publicPath: string;
}

type ViewTab = "all" | "published" | "draft" | "low_seo" | "page" | "post";
type SortKey = "seo_asc" | "seo_desc" | "importance" | "words";

export function OverviewTableClient({ rows }: { rows: OverviewContentRow[] }) {
  const [tab, setTab] = useState<ViewTab>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("importance");
  const [showAll, setShowAll] = useState(false);

  const types = useMemo(() => {
    const s = new Set(rows.map((r) => r.type));
    return [...s].sort();
  }, [rows]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      draft: rows.filter((r) => r.status === "draft").length,
      low_seo: rows.filter((r) => r.seoScore < 80).length,
      page: rows.filter((r) => r.type === "page").length,
      post: rows.filter((r) => r.type === "post").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const list = rows.filter((r) => {
      if (tab === "published" && r.status !== "published") return false;
      if (tab === "draft" && r.status !== "draft") return false;
      if (tab === "low_seo" && r.seoScore >= 80) return false;
      if (tab === "page" && r.type !== "page") return false;
      if (tab === "post" && r.type !== "post") return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (q) {
        const hay = `${r.title} ${r.slug} ${r.schemaType} ${r.type}`.toLocaleLowerCase("tr-TR");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "seo_asc") return a.seoScore - b.seoScore;
      if (sort === "seo_desc") return b.seoScore - a.seoScore;
      if (sort === "words") return b.words - a.words;
      return b.importanceScore - a.importanceScore || b.seoScore - a.seoScore;
    });
  }, [rows, tab, query, typeFilter, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  const exportCsv = () => {
    const header = ["Baslik", "URL", "Tur", "Durum", "Sema", "SEO", "Kelime"];
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          `"${r.title.replace(/"/g, '""')}"`,
          `"${r.publicPath}"`,
          r.type,
          r.status,
          r.schemaType,
          r.seoScore,
          r.words,
        ].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexpress-icerik-ozeti.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      {/* Üst Sekmeler + Filtreler */}
      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 p-1">
          {(
            [
              { id: "all", label: "Tümü", count: counts.all },
              { id: "published", label: "Yayında", count: counts.published },
              { id: "draft", label: "Taslak", count: counts.draft },
              { id: "low_seo", label: "SEO < 80", count: counts.low_seo },
              { id: "page", label: "Sayfalar", count: counts.page },
              { id: "post", label: "Blog", count: counts.post },
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
              placeholder="Başlık, URL veya şema ara..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="İçerik türüne göre süz"
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
            aria-label="Sıralama"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="importance">Önem Skoru</option>
            <option value="seo_asc">SEO (Düşükten Yükseğe)</option>
            <option value="seo_desc">SEO (Yüksekten Düşüğe)</option>
            <option value="words">Kelime Sayısı</option>
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

      {/* Tablo */}
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="İçerik özet tablosu">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-medium text-muted-foreground">
              <th className="px-4 py-2.5">İçerik & URL</th>
              <th className="px-3 py-2.5">Tür</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5">Şema</th>
              <th className="px-3 py-2.5">SEO Sağlığı</th>
              <th className="px-3 py-2.5 text-right">Kelime</th>
              <th className="px-4 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-[12px]">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <SlidersHorizontal className="mx-auto mb-2 h-5 w-5 opacity-50" />
                  Seçili filtrelerle eşleşen kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              visible.map((item) => {
                const barTone =
                  item.seoScore >= 85
                    ? "bg-emerald-500"
                    : item.seoScore >= 70
                      ? "bg-blue-500"
                      : item.seoScore >= 55
                        ? "bg-amber-500"
                        : "bg-rose-500";
                const statusBadge =
                  item.status === "published"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : item.status === "scheduled"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300";
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-2.5 max-w-[300px]">
                      <Link
                        href={`/admin/contents?id=${encodeURIComponent(item.contentId)}`}
                        className="block truncate font-semibold text-foreground hover:text-blue-600"
                      >
                        {item.title}
                      </Link>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {item.publicPath}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status === "published"
                          ? "Yayında"
                          : item.status === "scheduled"
                            ? "Zamanlı"
                            : "Taslak"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {item.schemaType}
                    </td>
                    <td className="px-3 py-2.5 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${barTone}`}
                            style={{ width: `${Math.max(4, Math.min(100, item.seoScore))}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-[11px] font-semibold tabular-nums">
                          {item.seoScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                      {item.words.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/contents?id=${encodeURIComponent(item.contentId)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:border-blue-500 hover:text-blue-600 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                          Düzenle
                        </Link>
                        <Link
                          href={item.publicPath}
                          target="_blank"
                          className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                          title="Canlı sayfayı aç"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`${item.publicPath}?format=md`}
                          target="_blank"
                          className="inline-flex items-center rounded-md border border-border bg-muted/40 px-1.5 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition"
                          title="AI Markdown görünümü"
                        >
                          .md
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Alt Çubuk */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>
          Gösterilen: <strong className="text-foreground">{visible.length}</strong> / {filtered.length} kayıt
        </span>
        <div className="flex items-center gap-3">
          {filtered.length > 12 ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {showAll ? "İlk 12 kaydı göster" : `Tüm ${filtered.length} kaydı göster`}
            </button>
          ) : null}
          <Link href="/admin/pages" className="font-medium text-foreground hover:underline">
            Sayfalar →
          </Link>
          <Link href="/admin/posts" className="font-medium text-foreground hover:underline">
            Blog →
          </Link>
        </div>
      </div>
    </section>
  );
}
