import { FolderTree, Tag } from "lucide-react";
import type { TaxonomyStudioState } from "./use-taxonomy-studio";

/** Üst Başlık */
export function TaxonomyStudioHeader({ s }: { s: TaxonomyStudioState }) {
  const { items, activeType, setActiveType, categories, tags, resetForm } = s;
  return (
    <>
      {/* Üst Başlık */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50">
              <FolderTree className="h-4 w-4 text-blue-600" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Hiyerarşik Kategori Ağacı & Etiket Stüdyosu
            </h1>
            <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              {categories.length} Kategori • {tags.length} Etiket
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sınırsız alt kırılımlı (Parent/Child) kategori ağacı kurun, kategorilere kapak görseli atayın, düzenleyin, silin ve CollectionPage SEO şemalarını yönetin.
          </p>
        </div>

        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveType("category");
              resetForm();
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeType === "category"
                ? "bg-background text-blue-600 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Kategori Ağacı ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveType("tag");
              resetForm();
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeType === "tag"
                ? "bg-background text-blue-600 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Etiketler ({tags.length})
          </button>
        </div>
      </div>
    </>
  );
}
