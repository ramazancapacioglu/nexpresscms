import { resolvePublishing } from "@nexpress/core";
import { CheckSquare, Copy, Edit3, ExternalLink, FolderTree, SlidersHorizontal, Square, Trash2, Lock, Eye } from "lucide-react";
import Link from "next/link";
import type { ContentDto } from "@nexpress/database";
import type { ContentListState } from "./use-content-list";

/** Tablo satırı */
export function ContentListRow({ s, item }: { s: ContentListState; item: ContentDto }) {
  const { mode, items, selectedIds, quickEditId, categories, tags, toggleSelectRow, openQuickEdit, handleDuplicate, handleSingleDelete } = s;
  const isSelected = selectedIds.includes(item.contentId);
  const isQuickEditing = quickEditId === item.contentId;
  const pub = resolvePublishing(item.schemaAttributes);
  const score = item.seoScore ?? 92;
  const grade =
    score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";


  return (
    <>
      <tr
        className={`group transition ${
          isSelected
            ? "bg-blue-500/5"
            : "hover:bg-muted/40"
        }`}
      >
        <td className="px-3.5 py-3 align-top">
          <button
            type="button"
            aria-label={`${item.title} seç`}
            aria-pressed={isSelected}
            onClick={() => toggleSelectRow(item.contentId)}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </td>

        {/* Başlık & Slug */}
        <td className="px-3.5 py-3 align-top">
          <div className="flex items-start gap-2.5">
            {pub.featuredImageUrl ? (
              <img
                src={pub.featuredImageUrl}
                alt={pub.featuredImageAlt ?? item.title}
                className="h-9 w-14 shrink-0 rounded border border-border object-cover bg-muted"
              />
            ) : null}
            <div className="space-y-1 min-w-0">
              <Link
                href={`/admin/contents?id=${item.contentId}&type=${mode}`}
                className="font-semibold text-foreground hover:text-blue-600 transition line-clamp-1"
              >
                {item.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">/tr/{item.slug}</span>
                <span className="text-border">•</span>
                <span>{item.blocks.length} blok</span>
                {pub.focusKeyword ? (
                  <>
                    <span className="text-border">•</span>
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                      🎯 {pub.focusKeyword}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </td>

        {/* Durum & Görünürlük */}
        <td className="px-3.5 py-3 align-top">
          <div className="flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                item.status === "published"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                  : item.status === "scheduled"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.status === "published"
                ? "Yayında"
                : item.status === "scheduled"
                  ? "Zamanlanmış"
                  : "Taslak"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              {pub.visibility === "public" ? (
                <>
                  <Eye className="h-3 w-3" /> Herkese Açık
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-amber-500" />{" "}
                  {pub.visibility === "password"
                    ? "Parola Korumalı"
                    : pub.visibility === "members_only"
                      ? "Üyelere Özel"
                      : "Özel (Private)"}
                </>
              )}
            </span>
          </div>
        </td>

        {/* Kategoriler & Etiketler */}
        <td className="px-3.5 py-3 align-top">
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {pub.categories.length === 0 && pub.tags.length === 0 ? (
              <span className="text-[11px] text-muted-foreground italic">
                Atanmamış
              </span>
            ) : (
              <>
                {pub.categories.map((catSlug) => {
                  const found = categories.find(
                    (c) => c.slug === catSlug
                  );
                  return (
                    <span
                      key={catSlug}
                      className="inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                    >
                      <FolderTree className="h-2.5 w-2.5 text-blue-500" />
                      {found ? found.name : catSlug}
                    </span>
                  );
                })}
                {pub.tags.map((tSlug) => (
                  <span
                    key={tSlug}
                    className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 dark:text-blue-300"
                  >
                    #{tSlug}
                  </span>
                ))}
              </>
            )}
          </div>
        </td>

        {/* SEO Motoru Skoru */}
        <td className="px-3.5 py-3 align-top">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
                score >= 85
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                  : score >= 70
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
              }`}
            >
              {grade}
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-foreground">
                {score}/100
              </div>
              <div className="text-[10px] text-muted-foreground">
                {item.noIndex ? "NoIndex" : `${item.schemaType}`}
              </div>
            </div>
          </div>
        </td>

        {/* Aksiyonlar */}
        <td className="px-3.5 py-3 align-top text-right">
          <div className="inline-flex items-center justify-end gap-1">
            <Link
              href={`/admin/contents?id=${item.contentId}&type=${mode}`}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-blue-500 hover:text-blue-600 transition"
            >
              <Edit3 className="h-3 w-3" />
              Düzenle
            </Link>
            <button
              type="button"
              onClick={() => openQuickEdit(item)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                isQuickEditing
                  ? "border-blue-500 bg-blue-500/10 text-blue-600"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Hızlı Düzenle
            </button>
            <button
              type="button"
              onClick={() => handleDuplicate(item.contentId)}
              title="Çoğalt (Duplicate)"
              className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </button>
            <Link
              href={`/tr/${item.slug}`}
              target="_blank"
              title="Ön Yüzde Gör"
              className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => handleSingleDelete(item.contentId)}
              title="Sil"
              className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:border-rose-500/40 hover:text-rose-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
