import Link from "next/link";
import { FileText, FolderTree, Newspaper, Plus, Sparkles } from "lucide-react";
import type { ContentListState } from "./use-content-list";

/** Üst Başlık & Yeni Ekle Aksiyonu */
export function ContentListHeader({ s }: { s: ContentListState }) {
  const { mode, taxonomies, items, filteredItems, avgSeoScore, isPage, labelSingular, labelPlural } = s;
  return (
    <>
      {/* Üst Başlık & Yeni Ekle Aksiyonu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground">
              {isPage ? (
                <FileText className="h-4 w-4 text-blue-600" />
              ) : (
                <Newspaper className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              )}
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {labelPlural}
            </h1>
            <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-muted-foreground">
              {filteredItems.length} kayıt
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" />
              SEO Motoru Ort: {avgSeoScore}/100
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isPage
              ? "Kurumsal sayfalarınızı filtreleyin, satır içi hızlı düzenleyin, toplu işlem uygulayın veya Görsel Stüdyoda açın."
              : "Blog yazılarınızı, kategori/etiket kırılımlarını ve otomatik SEO Motoru skorlarını tek ekrandan yönetin."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/taxonomies"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition"
          >
            <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
            Kategori Ağacı
          </Link>
          <Link
            href={`/admin/contents?type=${mode}&new=1`}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni {labelSingular} Ekle
          </Link>
        </div>
      </div>
    </>
  );
}
