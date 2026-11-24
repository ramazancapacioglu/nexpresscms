import { Download, RotateCcw, Search } from "lucide-react";
import type { ContentListState } from "./use-content-list";

/** Gelişmiş Filtreleme, Sıralama & CSV Dışa Aktarma Çubuğu */
export function ContentListFilters({ s }: { s: ContentListState }) {
  const {
    items,
    filteredItems,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    tagFilter,
    setTagFilter,
    seoFilter,
    setSeoFilter,
    sortBy,
    setSortBy,
    hasActiveFilters,
    resetFilters,
    exportCsv,
    tags,
    flatCategoryTree,
    labelSingular,
  } = s;

  return (
    <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Durum Sekmeleri */}
        <div className="inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted/50 p-1 text-xs">
          {(
            [
              { id: "all", label: "Tümü", count: items.length },
              { id: "published", label: "Yayında", count: items.filter((i) => i.status === "published").length },
              { id: "draft", label: "Taslak", count: items.filter((i) => i.status === "draft").length },
              { id: "scheduled", label: "Zamanlanmış", count: items.filter((i) => i.status === "scheduled").length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === tab.id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Arama + CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${labelSingular} başlığı, URL veya anahtar kelime...`}
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV ({filteredItems.length})</span>
          </button>
        </div>
      </div>

      {/* İkinci Satır: Kategori, Etiket, SEO Puanı, Sıralama ve Sıfırla */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
        <select
          aria-label="Kategoriye göre süz"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Tüm Kategoriler</option>
          {flatCategoryTree.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {"— ".repeat(cat.depth)}
              {cat.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Etikete göre süz"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Tüm Etiketler</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              #{t.name}
            </option>
          ))}
        </select>

        <select
          aria-label="SEO puanına göre süz"
          value={seoFilter}
          onChange={(e) => setSeoFilter(e.target.value as "all" | "low" | "mid" | "high")}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Tüm SEO Puanları</option>
          <option value="low">Kritik (&lt; 70)</option>
          <option value="mid">İyileştir (70–84)</option>
          <option value="high">İyi (85+)</option>
        </select>

        <select
          aria-label="Sıralama"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "default" | "seo_asc" | "seo_desc" | "title" | "blocks")
          }
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
        >
          <option value="default">Sırala: Varsayılan</option>
          <option value="seo_asc">SEO Puanı (Düşükten Yükseğe)</option>
          <option value="seo_desc">SEO Puanı (Yüksekten Düşüğe)</option>
          <option value="title">Başlık (A–Z)</option>
          <option value="blocks">Blok Sayısı (Çoktan Aza)</option>
        </select>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Sıfırla</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
