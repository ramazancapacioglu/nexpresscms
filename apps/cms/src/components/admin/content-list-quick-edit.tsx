import type { ContentStatus } from "@nexpress/core";
import { SlidersHorizontal, X } from "lucide-react";
import type { ContentDto } from "@nexpress/database";
import type { ContentListState } from "./use-content-list";

/** Satır içi hızlı düzenleme paneli */
export function ContentListQuickEdit({ s, item }: { s: ContentListState; item: ContentDto }) {
  const { isPending, items, quickEditId, setQuickEditId, qeTitle, setQeTitle, qeSlug, setQeSlug, qeStatus, setQeStatus, qeVisibility, setQeVisibility, qeImportance, setQeImportance, qeNoIndex, setQeNoIndex, qeTldr, setQeTldr, qeCategories, setQeCategories, qeTags, setQeTags, tags, flatCategoryTree, handleSaveQuickEdit } = s;
  const isQuickEditing = quickEditId === item.contentId;


  return (
    <>
      {/* SATIR İÇİ HIZLI DÜZENLEME (INLINE QUICK EDIT PANELİ) */}
      {isQuickEditing && (
        <tr className="bg-muted/30 border-b border-blue-500/30">
          <td colSpan={6} className="p-4">
            <div className="rounded-xl border border-blue-500/30 bg-background p-4 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-foreground">
                    Hızlı Düzenleme — {item.title}
                  </span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                    Slug değiştiğinde 301 yönlendirmesi SEO Motoru tarafından otomatik kaydedilir
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickEditId(null)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Sütun 1: Temel Bilgiler */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={qeTitle}
                      onChange={(e) => setQeTitle(e.target.value)}
                      className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Kalıcı Bağlantı (Slug)
                    </label>
                    <input
                      type="text"
                      value={qeSlug}
                      onChange={(e) => setQeSlug(e.target.value)}
                      className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Durum
                      </label>
                      <select
                        value={qeStatus}
                        onChange={(e) =>
                          setQeStatus(e.target.value as ContentStatus)
                        }
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="published">Yayında</option>
                        <option value="draft">Taslak</option>
                        <option value="scheduled">Zamanlanmış</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Görünürlük
                      </label>
                      <select
                        value={qeVisibility}
                        onChange={(e) =>
                          setQeVisibility(e.target.value as any)
                        }
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="public">Herkese Açık</option>
                        <option value="password">Parola Korumalı</option>
                        <option value="members_only">Üyelere Özel</option>
                        <option value="private">Özel (Private)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sütun 2: Hiyerarşik Kategori & Etiket Seçimi */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Kategoriler (Ağaç Yapısı)
                    </label>
                    <div className="max-h-28 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 space-y-1">
                      {flatCategoryTree.map((cat) => {
                        const checked = qeCategories.includes(cat.slug);
                        return (
                          <label
                            key={cat.id}
                            style={{ paddingLeft: `${cat.depth * 14}px` }}
                            className="flex items-center gap-2 text-xs cursor-pointer hover:text-blue-600"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setQeCategories((prev) =>
                                  checked
                                    ? prev.filter((x) => x !== cat.slug)
                                    : [...prev, cat.slug]
                                )
                              }
                              className="rounded border-border"
                            />
                            <span>{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Etiketler
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tg) => {
                        const active = qeTags.includes(tg.slug);
                        return (
                          <button
                            key={tg.id}
                            type="button"
                            onClick={() =>
                              setQeTags((prev) =>
                                active
                                  ? prev.filter((x) => x !== tg.slug)
                                  : [...prev, tg.slug]
                              )
                            }
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition ${
                              active
                                ? "border-blue-500 bg-blue-500/15 text-blue-600"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            #{tg.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sütun 3: SEO & Answer-First Özeti */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Answer-First Özeti (TL;DR & Otomatik Meta Açıklama)
                    </label>
                    <textarea
                      rows={3}
                      value={qeTldr}
                      onChange={(e) => setQeTldr(e.target.value)}
                      className="w-full rounded-md border border-border bg-background p-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qeNoIndex}
                        onChange={(e) =>
                          setQeNoIndex(e.target.checked)
                        }
                        className="rounded border-border"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Arama motorlarında gizle (NoIndex)
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Önem:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={qeImportance}
                        onChange={(e) =>
                          setQeImportance(Number(e.target.value))
                        }
                        className="h-7 w-14 rounded border border-border bg-background px-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setQuickEditId(null)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSaveQuickEdit(item.contentId)}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending
                    ? "Kaydediliyor..."
                    : "Hızlı Düzenlemeyi Kaydet"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
