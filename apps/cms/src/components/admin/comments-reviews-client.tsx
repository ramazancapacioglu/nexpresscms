"use client";

import React, { useState, useTransition } from "react";
import type {
  CommentReviewDto,
  ContentWithTranslationDto,
} from "@nexpress/database";
import { saveCommentReviewAction } from "@/app/admin/actions";
import { MessageSquare, Star, Check, Plus, ShieldCheck } from "lucide-react";

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
  const [parentId, setParentId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = (filterType === "all" ? items : items.filter((r) => r.entryType === filterType)).filter((item) =>
    tagFilter ? (item.tags ?? []).some((tag) => tag.toLocaleLowerCase("tr").includes(tagFilter.toLocaleLowerCase("tr"))) : true
  );
  const rated = items.filter((item) => item.entryType === "review" && item.rating > 0);
  const avgRating = rated.length > 0 ? (rated.reduce((acc, item) => acc + item.rating, 0) / rated.length).toFixed(2) : "–";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !body.trim()) return;
    startTransition(async () => {
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
        parentId,
        tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8),
      });
      if (res.ok) {
        setItems((prev) => [res.item, ...prev]);
        setAuthorName("");
        setTitle("");
        setBody("");
        setProsText("");
        setConsText("");
        setTagsText("");
        setParentId(null);
        setBanner("Yeni değerlendirme / yorum kaydedildi ve Schema.org AggregateRating güncellendi.");
      }
    });
  };

  const handleToggleStatus = (item: CommentReviewDto, nextStatus: string) => {
    startTransition(async () => {
      const res = await saveCommentReviewAction({
        id: item.id,
        contentId: item.contentId,
        authorName: item.authorName,
        entryType: item.entryType as "review" | "comment",
        rating: item.rating,
        title: item.title ?? undefined,
        body: item.body,
        pros: item.pros,
        cons: item.cons,
        status: nextStatus,
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p))
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] pb-3">
        <div>
          <h1 className="text-[16px] font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#1D5ED8] dark:text-[#7AA7FF]" />
            <span>Yorum, İnceleme & 5 Yıldızlı Değerlendirme Merkezi</span>
          </h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Onaylanan ürün/makale değerlendirmeleri otomatik olarak Google Rich Snippets (<code>AggregateRating</code> & <code>Review</code>) şemasına işlenir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono text-amber-800 font-bold flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>AggregateRating: {avgRating} / 5.00 ({rated.length} inceleme)</span>
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

      {banner && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{banner}</span>
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
            <select aria-label="İlgili Sayfa / Ürün / Makale"
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
              <select aria-label="Kayıt Türü"
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
              <select aria-label="Yıldız Puanı (1-5)"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[11px] font-bold text-amber-800 outline-none"
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

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Değerlendirme Başlığı..."
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
          />

          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Etiketler, virgülle (müşteri, kurulum)"
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
          />
          {parentId ? <p className="text-[11px] text-[#1D5ED8]">Bu kayıt bir yoruma yanıttır. <button type="button" className="underline" onClick={() => setParentId(null)}>Kök yorum yap</button></p> : null}

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
          {filtered.map((item) => {
            const targetContent = contents.find((c) => c.id === item.contentId);
            return (
              <div
                key={item.id}
                className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-2.5 text-[12px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px]">
                      {item.authorName}
                    </span>
                    {item.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 font-mono text-[10px]">
                        <ShieldCheck className="h-3 w-3" />
                        Doğrulanmış
                      </span>
                    )}
                    {item.entryType === "review" && item.rating > 0 ? (
                      <span className="text-amber-800 font-mono text-[11px] font-bold">
                        {"★".repeat(item.rating)} ({item.rating}/5)
                      </span>
                    ) : null}
                    {(item.tags ?? []).map((tag) => (
                      <button key={tag} type="button" onClick={() => setTagFilter(tag)} className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] dark:bg-[#23262E]">{tag}</button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 py-0.5 font-mono text-[10px] text-[#5C5F66]">
                      İçerik: {targetContent?.title ?? item.contentId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setParentId(item.id);
                        setContentId(item.contentId);
                        setEntryType("comment");
                        setBanner(`${item.authorName} yorumuna yanıt yazılıyor.`);
                      }}
                      className="rounded border border-[#E6E7EA] px-2 py-0.5 text-[10px] dark:border-[#23262E]"
                    >
                      Yanıtla
                    </button>
                    <select
                      aria-label={`Durum: ${item.authorName}`}
                      value={item.status}
                      onChange={(e) =>
                        handleToggleStatus(item, e.target.value)
                      }
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase outline-none cursor-pointer ${
                        item.status === "approved"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-800"
                      }`}
                    >
                      <option value="approved">ONAYLI (YAYINDA)</option>
                      <option value="pending">BEKLEMEDE</option>
                      <option value="spam">SPAM</option>
                    </select>
                  </div>
                </div>

                {item.title && (
                  <div className="font-bold text-[13px]">{item.title}</div>
                )}
                <p className="text-[#5C5F66] dark:text-[#9CA3AF] leading-relaxed">
                  {item.body}
                </p>

                {(item.pros.length > 0 || item.cons.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    {item.pros.length > 0 && (
                      <div className="rounded bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1.5 text-emerald-800 dark:text-emerald-400">
                        <span className="font-bold">+ Artılar: </span>
                        {item.pros.join(" • ")}
                      </div>
                    )}
                    {item.cons.length > 0 && (
                      <div className="rounded bg-rose-500/5 border border-rose-500/20 px-2.5 py-1.5 text-rose-700 dark:text-rose-400">
                        <span className="font-bold">− Eksiler: </span>
                        {item.cons.join(" • ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
