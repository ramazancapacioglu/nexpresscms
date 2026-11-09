"use client";

import React, { useState, useTransition } from "react";
import type {
  CommentReviewDto,
  ContentWithTranslationDto,
} from "@nexpress/database";
import { serializeCommentTags } from "@nexpress/core";
import {
  saveCommentReviewAction,
  deleteCommentReviewsAction,
  bulkCommentStatusAction,
} from "@/app/admin/actions";
import {
  MessageSquare,
  Star,
  Check,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { CommentModerationCard } from "./comment-moderation-card";

export function CommentsReviewsClient({
  initialReviews,
  contents,
}: {
  initialReviews: CommentReviewDto[];
  contents: ContentWithTranslationDto[];
}) {
  const [items, setItems] = useState<CommentReviewDto[]>(initialReviews);
  const [filterType, setFilterType] = useState<"all" | "review" | "comment">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "spam"
  >("all");
  const [filterContentId, setFilterContentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Yeni İnceleme / Yorum Ekleme Formu
  const [contentId, setContentId] = useState(
    contents[0]?.id ?? "cnt_product_cloud"
  );
  const [entryType, setEntryType] = useState<"review" | "comment">("review");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [prosText, setProsText] = useState("");
  const [consText, setConsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isPinnedNew, setIsPinnedNew] = useState(false);
  const [isOfficialNew, setIsOfficialNew] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const spamCount = items.filter((i) => i.status === "spam").length;

  const filtered = items.filter((item) => {
    if (filterType !== "all" && item.entryType !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterContentId !== "all" && item.contentId !== filterContentId)
      return false;
    if (
      tagFilter &&
      !(item.tags ?? []).some((tag) =>
        tag.toLocaleLowerCase("tr").includes(tagFilter.toLocaleLowerCase("tr"))
      )
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLocaleLowerCase("tr");
      const hay = `${item.authorName} ${item.authorEmail ?? ""} ${item.title ?? ""} ${item.body}`.toLocaleLowerCase(
        "tr"
      );
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const rated = items.filter(
    (item) =>
      item.entryType === "review" &&
      item.rating > 0 &&
      item.status === "approved"
  );
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((acc, item) => acc + item.rating, 0) / rated.length
        ).toFixed(2)
      : "–";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !body.trim()) return;
    startTransition(async () => {
      const visibleTags = tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const encodedTags = serializeCommentTags({
        pinned: isPinnedNew,
        official: isOfficialNew,
        upvotes: 0,
        visibleTags,
      });
      const res = await saveCommentReviewAction({
        contentId,
        authorName: authorName.trim(),
        entryType,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        pros: prosText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        cons: consText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        status: "approved",
        isVerified: true,
        parentId,
        tags: encodedTags,
      });
      if (res.ok) {
        setItems((prev) => [res.item, ...prev]);
        setAuthorName("");
        setTitle("");
        setBody("");
        setProsText("");
        setConsText("");
        setTagsText("");
        setIsPinnedNew(false);
        setIsOfficialNew(false);
        setParentId(null);
        setBanner(
          "Yeni değerlendirme / yorum kaydedildi ve Schema.org AggregateRating güncellendi."
        );
      }
    });
  };

  const handleUpdateItem = (
    item: CommentReviewDto,
    patch: { status?: string; isVerified?: boolean; tags?: string[] }
  ) => {
    startTransition(async () => {
      const nextStatus = patch.status ?? item.status;
      const nextVerified =
        patch.isVerified !== undefined ? patch.isVerified : item.isVerified;
      const nextTags = patch.tags ?? item.tags;

      const res = await saveCommentReviewAction({
        id: item.id,
        contentId: item.contentId,
        authorName: item.authorName,
        authorEmail: item.authorEmail ?? undefined,
        entryType: item.entryType as "review" | "comment",
        rating: item.rating,
        title: item.title ?? undefined,
        body: item.body,
        pros: item.pros,
        cons: item.cons,
        status: nextStatus,
        isVerified: nextVerified,
        parentId: item.parentId,
        tags: nextTags,
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: nextStatus,
                  isVerified: nextVerified,
                  tags: nextTags,
                }
              : p
          )
        );
      }
    });
  };

  const handleQuickReply = (
    parentItem: CommentReviewDto,
    replyAuthor: string,
    replyBody: string
  ) => {
    startTransition(async () => {
      const tags = serializeCommentTags({
        pinned: false,
        official: true,
        upvotes: 0,
        visibleTags: [],
      });
      const res = await saveCommentReviewAction({
        contentId: parentItem.contentId,
        parentId: parentItem.id,
        authorName: replyAuthor,
        entryType: "comment",
        body: replyBody,
        status: "approved",
        isVerified: true,
        tags,
      });
      if (res.ok) {
        setItems((prev) => [res.item, ...prev]);
        setBanner(`@${parentItem.authorName} yorumuna resmi yanıt yayınlandı.`);
      }
    });
  };

  const handleDeleteIds = (ids: string[]) => {
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await deleteCommentReviewsAction({ ids });
      if (res.ok) {
        const set = new Set(ids);
        setItems((prev) => prev.filter((item) => !set.has(item.id)));
        setSelectedIds((prev) => prev.filter((id) => !set.has(id)));
        setBanner(`${res.deleted} kayıt kalıcı olarak silindi.`);
      }
    });
  };

  const handleBulkStatus = (status: "approved" | "pending" | "spam") => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const res = await bulkCommentStatusAction({ ids: selectedIds, status });
      if (res.ok) {
        const set = new Set(selectedIds);
        setItems((prev) =>
          prev.map((item) => (set.has(item.id) ? { ...item, status } : item))
        );
        setSelectedIds([]);
        setBanner(`${res.updated} kaydın durumu '${status}' olarak güncellendi.`);
      }
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Üst Başlık ve Özet Rozetleri */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] pb-3">
        <div>
          <h1 className="text-[16px] font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#1D5ED8] dark:text-[#7AA7FF]" />
            <span>Topluluk Tartışması, Yorum & 5 Yıldızlı İnceleme Stüdyosu</span>
          </h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Çok seviyeli yanıt ağacı, sabitlenen yorumlar, ekip rozetleri ve otomatik Google Rich Snippets (<code>AggregateRating</code> & <code>Review</code>) yönetimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>
              AggregateRating: {avgRating} / 5.00 ({rated.length} onaylı inceleme)
            </span>
          </div>

          <div className="inline-flex rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-0.5 text-[11px]">
            {(
              [
                { id: "all", label: `Tümü (${items.length})` },
                {
                  id: "review",
                  label: `İncelemeler (${items.filter((i) => i.entryType === "review").length})`,
                },
                {
                  id: "comment",
                  label: `Yorumlar (${items.filter((i) => i.entryType === "comment").length})`,
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  filterType === t.id
                    ? "bg-[#14151A] dark:bg-white text-white dark:text-[#14151A]"
                    : "text-[#5C5F66]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Durum Sekmeleri, Arama ve İçerik Filtresi */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-2.5 text-[11px]">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: "all", label: `Tüm Durumlar (${items.length})` },
              {
                id: "pending",
                label: `Beklemede (${pendingCount})`,
                highlight: pendingCount > 0,
              },
              { id: "approved", label: `Onaylı (${approvedCount})` },
              { id: "spam", label: `Spam (${spamCount})` },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                filterStatus === st.id
                  ? "bg-[#1D5ED8] text-white"
                  : "highlight" in st && st.highlight
                    ? "border border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold"
                    : "text-[#5F6570] hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter("")}
              className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-blue-700 font-mono"
            >
              <span>#{tagFilter}</span>
              <X className="h-3 w-3" />
            </button>
          )}
          <select
            aria-label="İçeriğe Göre Filtrele"
            value={filterContentId}
            onChange={(e) => setFilterContentId(e.target.value)}
            className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 py-1 outline-none max-w-[210px]"
          >
            <option value="all">Tüm İçerikler</option>
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.type.toUpperCase()}] {c.title}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#5F6570] absolute left-2 top-1.5" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Yazar veya metin ara..."
              className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] pl-7 pr-2.5 py-1 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px]">
          <span className="font-semibold text-blue-900 dark:text-blue-200">
            {selectedIds.length} kayıt seçildi
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("approved")}
              className="rounded bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Seçilenleri Onayla
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("pending")}
              className="rounded bg-amber-600 px-2.5 py-1 font-semibold text-white hover:bg-amber-700 cursor-pointer"
            >
              Beklemeye Al
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("spam")}
              className="rounded bg-slate-700 px-2.5 py-1 font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Spam İşaretle
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDeleteIds(selectedIds)}
              className="inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              Kalıcı Sil
            </button>
          </div>
        </div>
      )}

      {banner && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{banner}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline"
          >
            Kapat
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Sol: Yeni İnceleme / Yorum Ekleme Formu */}
        <form
          onSubmit={handleCreate}
          className="lg:col-span-4 rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-3 text-[12px]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1D5ED8] dark:text-[#7AA7FF] flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Yeni İnceleme veya Yorum Ekle</span>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099] mb-1">
              İlgili Sayfa / Ürün / Makale
            </label>
            <select
              aria-label="İlgili Sayfa / Ürün / Makale"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[11px] outline-none"
            >
              {contents.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.type.toUpperCase()}] {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099] mb-1">
                Kayıt Türü
              </label>
              <select
                aria-label="Kayıt Türü"
                value={entryType}
                onChange={(e) =>
                  setEntryType(e.target.value as "review" | "comment")
                }
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[11px] outline-none"
              >
                <option value="review">5 Yıldızlı İnceleme</option>
                <option value="comment">Standart Yorum</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099] mb-1">
                Yıldız Puanı (1-5)
              </label>
              <select
                aria-label="Yıldız Puanı (1-5)"
                value={rating}
                disabled={entryType === "comment"}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[11px] font-bold text-amber-800 outline-none disabled:opacity-50"
              >
                <option value={5}>★★★★★ (5 / 5)</option>
                <option value={4}>★★★★☆ (4 / 5)</option>
                <option value={3}>★★★☆☆ (3 / 5)</option>
                <option value={2}>★★☆☆☆ (2 / 5)</option>
                <option value={1}>★☆☆☆☆ (1 / 5)</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Yazar / Müşteri Adı ve Unvanı..."
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
          />

          {entryType === "review" && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Değerlendirme Başlığı..."
              className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
            />
          )}

          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Etiketler, virgülle (müşteri, kurulum)"
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
          />

          <div className="flex items-center gap-4 text-[11px]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinnedNew}
                onChange={(e) => setIsPinnedNew(e.target.checked)}
              />
              <span>📌 En Üste Sabitle</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isOfficialNew}
                onChange={(e) => setIsOfficialNew(e.target.checked)}
              />
              <span>★ Ekip / Yazar Rozeti</span>
            </label>
          </div>

          {parentId ? (
            <p className="text-[11px] text-[#1D5ED8]">
              Bu kayıt bir yoruma yanıttır.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setParentId(null)}
              >
                Kök yorum yap
              </button>
            </p>
          ) : null}

          <textarea
            rows={3}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Yorum veya detaylı inceleme metni..."
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] p-2 outline-none resize-none"
          />

          {entryType === "review" && (
            <div className="grid grid-cols-2 gap-2">
              <textarea
                rows={2}
                value={prosText}
                onChange={(e) => setProsText(e.target.value)}
                placeholder="Artılar (Her satıra 1 madde)..."
                className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] outline-none resize-none"
              />
              <textarea
                rows={2}
                value={consText}
                onChange={(e) => setConsText(e.target.value)}
                placeholder="Eksiler (Her satıra 1 madde)..."
                className="rounded border border-rose-500/30 bg-rose-500/5 p-2 text-[11px] outline-none resize-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-8 rounded-md bg-[#14151A] dark:bg-white text-white dark:text-[#14151A] font-semibold hover:opacity-90 cursor-pointer"
          >
            {isPending ? "Kaydediliyor..." : "+ Değerlendirmeyi Yayınla"}
          </button>
        </form>

        {/* Sağ: Yorum ve İnceleme Moderasyon Listesi */}
        <div className="lg:col-span-8 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E6E7EA] dark:border-[#23262E] p-8 text-center text-[12px] text-[#5F6570]">
              Seçilen filtrelere uygun yorum veya değerlendirme bulunamadı.
            </div>
          ) : (
            filtered.map((item) => {
              const targetContent = contents.find(
                (c) => c.id === item.contentId
              );
              const parentItem = item.parentId
                ? items.find((p) => p.id === item.parentId)
                : undefined;
              return (
                <CommentModerationCard
                  key={item.id}
                  item={item}
                  parentAuthor={parentItem?.authorName ?? null}
                  targetContent={targetContent}
                  selected={selectedIds.includes(item.id)}
                  isPending={isPending}
                  onToggleSelect={toggleSelect}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={(id) => handleDeleteIds([id])}
                  onQuickReply={handleQuickReply}
                  onTagClick={(tag) => setTagFilter(tag)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
