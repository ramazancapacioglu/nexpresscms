import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { resolvePublishing, type ContentStatus } from "@nexpress/core";
import { CheckSquare, Copy, Edit3, ExternalLink, FolderTree, Plus, SlidersHorizontal, Square, Trash2, X, Lock, Eye } from "lucide-react";
import type { ContentListState } from "./use-content-list";
import { ContentListRow } from "./content-list-row";
import { ContentListQuickEdit } from "./content-list-quick-edit";

/** ATTIO-TARZI YÜKSEK YOĞUNLUKLU TABLO */
export function ContentListTable({ s }: { s: ContentListState }) {
  const { mode, isPending, items, selectedIds, quickEditId, setQuickEditId, qeTitle, setQeTitle, qeSlug, setQeSlug, qeStatus, setQeStatus, qeVisibility, setQeVisibility, qeImportance, setQeImportance, qeNoIndex, setQeNoIndex, qeTldr, setQeTldr, qeCategories, setQeCategories, qeTags, setQeTags, categories, tags, flatCategoryTree, filteredItems, allSelected, toggleSelectAll, toggleSelectRow, openQuickEdit, handleSaveQuickEdit, handleDuplicate, handleSingleDelete, labelSingular } = s;
  return (
    <>
      {/* ATTIO-TARZI YÜKSEK YOĞUNLUKLU TABLO */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-3.5 py-2.5">{labelSingular} Başlığı & URL</th>
                <th className="px-3.5 py-2.5">Durum & Görünürlük</th>
                <th className="px-3.5 py-2.5">Kategoriler & Etiketler</th>
                <th className="px-3.5 py-2.5">SEO Motoru</th>
                <th className="px-3.5 py-2.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto max-w-sm space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        Kayıtlı {labelSingular.toLowerCase()} bulunamadı
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Arama filtrenizi değiştirebilir veya hemen yeni bir{" "}
                        {labelSingular.toLowerCase()} oluşturabilirsiniz.
                      </p>
                      <div className="pt-2">
                        <Link
                          href={`/admin/contents?type=${mode}&new=1`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Yeni {labelSingular} Oluştur
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <React.Fragment key={item.contentId}>
                    <ContentListRow s={s} item={item} />
                    <ContentListQuickEdit s={s} item={item} />
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
