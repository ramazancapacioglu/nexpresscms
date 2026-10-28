import { CheckSquare, Trash2, CheckCircle2, Clock } from "lucide-react";
import type { ContentListState } from "./use-content-list";

/** TOPLU DÜZENLEME (BULK EDIT) AKILLI ÇUBUĞU */
export function ContentListBulkBar({ s }: { s: ContentListState }) {
  const { isPending, items, selectedIds, setSelectedIds, bulkCategorySlug, setBulkCategorySlug, bulkTagSlug, setBulkTagSlug, tags, flatCategoryTree, handleBulkAction } = s;
  return (
    <>
      {/* TOPLU DÜZENLEME (BULK EDIT) AKILLI ÇUBUĞU */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} içerik seçildi</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="ml-1 text-[11px] font-normal text-muted-foreground underline hover:text-foreground"
            >
              Seçimi Temizle
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toplu Durum Değiştir */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("publish")}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-3 w-3" />
              Yayına Al
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("draft")}
              className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
            >
              <Clock className="h-3 w-3" />
              Taslağa Çek
            </button>

            {/* Toplu Kategori Ata */}
            <div className="flex items-center gap-1">
              <select
                value={bulkCategorySlug}
                onChange={(e) => setBulkCategorySlug(e.target.value)}
                className="h-7 rounded-md border border-border bg-background px-2 text-[11px]"
              >
                <option value="">+ Kategori Seç...</option>
                {flatCategoryTree.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {"— ".repeat(c.depth)}
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isPending || !bulkCategorySlug}
                onClick={() => handleBulkAction("assign_category")}
                className="h-7 rounded-md border border-border bg-background px-2.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
              >
                Kategori Ata
              </button>
            </div>

            {/* Toplu Etiket Ata */}
            <div className="flex items-center gap-1">
              <select
                value={bulkTagSlug}
                onChange={(e) => setBulkTagSlug(e.target.value)}
                className="h-7 rounded-md border border-border bg-background px-2 text-[11px]"
              >
                <option value="">+ Etiket Seç...</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.slug}>
                    #{t.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isPending || !bulkTagSlug}
                onClick={() => handleBulkAction("assign_tag")}
                className="h-7 rounded-md border border-border bg-background px-2.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
              >
                Etiket Ata
              </button>
            </div>

            {/* Toplu Sil */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("delete")}
              className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3 w-3" />
              Seçilenleri Sil
            </button>
          </div>
        </div>
      )}
    </>
  );
}
