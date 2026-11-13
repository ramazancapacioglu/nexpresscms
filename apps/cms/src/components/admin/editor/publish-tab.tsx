"use client";

import Link from "next/link";
import { type ContentStatus } from "@nexpress/core";

import { TemplatePicker } from "./template-picker";
import { LanguageStrip } from "./language-strip";
import { RevisionsPanel } from "./revisions-panel";
import { useStudioInspector } from "./studio-inspector-context";

export function PublishTab() {
  const {
    status,
    setStatus,
    visibility,
    setVisibility,
    scheduledAt,
    setScheduledAt,
    accessPassword,
    setAccessPassword,
    flatCategoryTree,
    selectedCategories,
    setSelectedCategories,
    quickCatName,
    setQuickCatName,
    quickCatParentId,
    setQuickCatParentId,
    handleQuickAddCategory,
    tags,
    selectedTags,
    setSelectedTags,
    quickTagName,
    setQuickTagName,
    handleQuickAddTag,
    slug,
    templateId,
    setTemplateId,
    contentType,
  } = useStudioInspector();
  const tplKind = contentType === "product" ? "product" : contentType === "page" || contentType === "campaign" ? "page" : "post";

  return (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Görünüm şablonu</div>
                    <TemplatePicker id="publish-template" kind={tplKind} value={templateId} onChange={setTemplateId} />
                    <p className="text-[10px] text-muted-foreground">Tam genişlik tuval tasarımlı sayfalarda şablon uygulanmaz.</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Yayın & Erişim Kısıtlama
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">
                          Durum
                        </label>
                        <select aria-label="Durum"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as ContentStatus)
                          }
                          className="h-8 w-full rounded border border-border bg-background px-2"
                        >
                          <option value="published">Yayında</option>
                          <option value="draft">Taslak</option>
                          <option value="scheduled">Zamanlanmış</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">
                          Görünürlük
                        </label>
                        <select aria-label="Görünürlük"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as any)}
                          className="h-8 w-full rounded border border-border bg-background px-2"
                        >
                          <option value="public">Herkese Açık</option>
                          <option value="password">Parola Korumalı</option>
                          <option value="members_only">Üyelere Özel</option>
                          <option value="private">Özel (Private)</option>
                        </select>
                      </div>
                    </div>

                    {status === "scheduled" && (
                      <div className="rounded-md border border-border p-2 space-y-1">
                        <label className="block text-[10px] text-muted-foreground" htmlFor="nx-scheduled-at">
                          Yayın tarihi ve saati (site saat dilimi)
                        </label>
                        <input
                          id="nx-scheduled-at"
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="h-8 w-full rounded border border-border bg-background px-2"
                        />
                        <p className="text-[10px] text-muted-foreground">Zamanı gelince kendiliğinden yayınlanır. Tarih gelecekte olmalı; kaydedince Zamanlanmış Yayınlar sayfasında görünür.</p>
                      </div>
                    )}

                    {visibility === "password" && (
                      <input
                        type="text"
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        placeholder="Sayfa erişim parolası..."
                        className="h-8 w-full rounded border border-amber-500/40 bg-background px-2"
                      />
                    )}
                  </div>

                  {/* AĞAÇ YAPISINDA KATEGORİ SEÇİMİ VE HIZLI ALT KATEGORİ EKLEME */}
                  <div className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Kategoriler (Ağaç Yapısı)
                      </span>
                      <Link
                        href="/admin/taxonomies"
                        className="text-[10px] font-medium text-blue-600 hover:underline"
                      >
                        Ağacı Yönet →
                      </Link>
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded border border-border bg-muted/20 p-2 space-y-1.5" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
                      {flatCategoryTree.map((cat) => {
                        const checked = selectedCategories.includes(cat.slug);
                        return (
                          <label
                            key={cat.id}
                            style={{ paddingLeft: `${cat.depth * 14}px` }}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedCategories((prev) =>
                                  checked
                                    ? prev.filter((x) => x !== cat.slug)
                                    : [...prev, cat.slug]
                                )
                              }
                              className="rounded border-border"
                            />
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color ?? "#2563eb" }}
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Hızlı Alt/Üst Kategori Ekle */}
                    <div className="space-y-1.5 pt-1 border-t border-border">
                      <input
                        type="text"
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value)}
                        placeholder="Yeni kategori adı..."
                        className="h-7 w-full rounded border border-border bg-background px-2 text-[11px]"
                      />
                      <div className="flex items-center gap-1.5">
                        <select
                          value={quickCatParentId}
                          onChange={(e) => setQuickCatParentId(e.target.value)}
                          className="h-7 flex-1 rounded border border-border bg-background px-1.5 text-[11px]"
                        >
                          <option value="">— Ana Kategori (Üst Yok) —</option>
                          {flatCategoryTree.map((c) => (
                            <option key={c.id} value={c.id}>
                              {"— ".repeat(c.depth)}
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleQuickAddCategory}
                          className="h-7 rounded bg-blue-600 px-2.5 text-[11px] font-semibold text-white"
                        >
                          + Ekle
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ETİKETLER */}
                  <div className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Etiketler (Tags)
                    </div>
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTags.map((slug) => {
                          const known = tags.find((t) => t.slug === slug);
                          return (
                            <span key={slug} className="inline-flex items-center gap-1 rounded-md border border-blue-600 bg-blue-600 pl-2 pr-1 py-0.5 text-[11px] font-medium text-white">
                              #{known?.name ?? slug}
                              <button
                                type="button"
                                aria-label={`${known?.name ?? slug} etiketini kaldır`}
                                onClick={() => setSelectedTags((prev) => prev.filter((x) => x !== slug))}
                                className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-white/20"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Henüz etiket seçilmedi.</p>
                    )}
                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                      {tags.filter((t) => !selectedTags.includes(t.slug)).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTags((prev) => (prev.includes(t.slug) ? prev : [...prev, t.slug]))}
                          className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          + #{t.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={quickTagName}
                        onChange={(e) => setQuickTagName(e.target.value)}
                        placeholder="Yeni etiket..."
                        className="h-7 flex-1 rounded border border-border bg-background px-2 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddTag}
                        className="h-7 rounded bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-2.5 text-[11px] font-semibold text-white"
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                  <LanguageStrip />
                  <RevisionsPanel />
                </div>
  );
}
