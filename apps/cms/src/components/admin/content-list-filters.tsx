import { Search } from "lucide-react";
import type { ContentListState } from "./use-content-list";

/** Filtreleme & Arama Çubuğu */
export function ContentListFilters({ s }: { s: ContentListState }) {
  const { items, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, tagFilter, setTagFilter, tags, flatCategoryTree, labelSingular } = s;
  return (
    <>
      {/* Filtreleme & Arama Çubuğu */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Durum Sekmeleri */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
          {(
            [
              { id: "all", label: "Tümü", count: items.length },
              {
                id: "published",
                label: "Yayında",
                count: items.filter((i) => i.status === "published").length,
              },
              {
                id: "draft",
                label: "Taslak",
                count: items.filter((i) => i.status === "draft").length,
              },
              {
                id: "scheduled",
                label: "Zamanlanmış",
                count: items.filter((i) => i.status === "scheduled").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === tab.id
                  ? "bg-background text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Arama + Kategori Ağacı Filtresi + Etiket Filtresi */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${labelSingular} başlığı, URL veya anahtar kelime...`}
              className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Kategoriler (Ağaç)</option>
            {flatCategoryTree.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {"— ".repeat(cat.depth)}
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Etiketler</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>
                #{t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
