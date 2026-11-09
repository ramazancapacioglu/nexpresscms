"use client";

import React, { useState } from "react";
import type {
  CommentReviewDto,
  ContentWithTranslationDto,
} from "@nexpress/database";
import {
  commentAvatarProps,
  parseCommentTags,
  serializeCommentTags,
} from "@nexpress/core";
import {
  ShieldCheck,
  Pin,
  Award,
  ThumbsUp,
  Reply,
  Trash2,
  CornerDownRight,
  Check,
} from "lucide-react";

export function CommentModerationCard({
  item,
  parentAuthor,
  targetContent,
  selected,
  isPending,
  onToggleSelect,
  onUpdateItem,
  onDeleteItem,
  onQuickReply,
  onTagClick,
}: {
  item: CommentReviewDto;
  parentAuthor: string | null;
  targetContent: ContentWithTranslationDto | undefined;
  selected: boolean;
  isPending: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateItem: (
    item: CommentReviewDto,
    patch: {
      status?: string;
      isVerified?: boolean;
      tags?: string[];
    }
  ) => void;
  onDeleteItem: (id: string) => void;
  onQuickReply: (
    parentItem: CommentReviewDto,
    replyAuthor: string,
    replyBody: string
  ) => void;
  onTagClick: (tag: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyAuthor, setReplyAuthor] = useState("Editör Ekibi");
  const [replyBody, setReplyBody] = useState("");

  const avatar = commentAvatarProps(item.authorName);
  const meta = parseCommentTags(item.tags);

  const togglePinned = () => {
    const nextTags = serializeCommentTags({
      ...meta,
      pinned: !meta.pinned,
    });
    onUpdateItem(item, { tags: nextTags });
  };

  const toggleOfficial = () => {
    const nextTags = serializeCommentTags({
      ...meta,
      official: !meta.official,
    });
    onUpdateItem(item, { tags: nextTags });
  };

  const bumpUpvotes = () => {
    const nextTags = serializeCommentTags({
      ...meta,
      upvotes: meta.upvotes + 1,
    });
    onUpdateItem(item, { tags: nextTags });
  };

  const submitInlineReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    onQuickReply(item, replyAuthor.trim() || "Editör Ekibi", replyBody.trim());
    setReplyBody("");
    setReplyOpen(false);
  };

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 text-[12px] transition-colors ${
        item.status === "pending"
          ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/5"
          : meta.pinned
            ? "border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/5"
            : "border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C]"
      }`}
    >
      {/* Üst Satır: Seçim, Avatar, Yazar, Rozetler ve Durum */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={`Seç: ${item.authorName}`}
            className="mt-2 h-3.5 w-3.5 rounded border-[#E6E7EA] cursor-pointer"
          />
          <div
            style={{
              backgroundColor: avatar.bg,
              color: avatar.fg,
              borderColor: avatar.border,
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
          >
            {avatar.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[13px] text-[#14151A] dark:text-white">
                {item.authorName}
              </span>
              {item.authorEmail && (
                <span className="text-[11px] font-mono text-[#5F6570] dark:text-[#8C9099]">
                  &lt;{item.authorEmail}&gt;
                </span>
              )}
              {item.entryType === "review" && item.rating > 0 ? (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                  {"★".repeat(item.rating)} ({item.rating}/5)
                </span>
              ) : (
                <span className="rounded bg-[#F3F4F6] dark:bg-[#23262E] px-1.5 py-0.5 font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">
                  YORUM
                </span>
              )}
              {parentAuthor && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-medium">
                  <CornerDownRight className="h-3 w-3" />@{parentAuthor} yanıtı
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-[#5F6570] dark:text-[#8C9099]">
              <span>
                İçerik:{" "}
                <strong className="text-[#14151A] dark:text-slate-200">
                  {targetContent?.title ?? item.contentId}
                </strong>
              </span>
              {item.createdAt && (
                <span>
                  •{" "}
                  {new Date(item.createdAt).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sağ: Durum Seçici & Hızlı Onay */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.status === "pending" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onUpdateItem(item, { status: "approved" })}
              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Check className="h-3 w-3" />
              Hemen Onayla
            </button>
          )}
          <select
            aria-label={`Durum: ${item.authorName}`}
            value={item.status}
            disabled={isPending}
            onChange={(e) => onUpdateItem(item, { status: e.target.value })}
            className={`rounded border px-2 py-1 font-mono text-[10px] uppercase outline-none cursor-pointer ${
              item.status === "approved"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : item.status === "spam"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold"
            }`}
          >
            <option value="approved">ONAYLI (YAYINDA)</option>
            <option value="pending">BEKLEMEDE</option>
            <option value="spam">SPAM</option>
          </select>
        </div>
      </div>

      {/* Başlık ve Gövde */}
      {item.title && (
        <div className="font-bold text-[13px] pl-10">{item.title}</div>
      )}
      <p className="text-[#374151] dark:text-[#D1D5DB] leading-relaxed pl-10 whitespace-pre-line">
        {item.body}
      </p>

      {/* Artılar & Eksiler */}
      {(item.pros.length > 0 || item.cons.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10 pt-0.5 text-[11px]">
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

      {/* Alt Araç Çubuğu: Rozet Anahtarları, Etiketler, Yanıtla ve Sil */}
      <div className="flex flex-wrap items-center justify-between gap-2 pl-10 pt-2 border-t border-[#E6E7EA]/70 dark:border-[#23262E]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={togglePinned}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
              meta.pinned
                ? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold"
                : "border-[#E6E7EA] dark:border-[#23262E] text-[#5F6570] hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028]"
            }`}
          >
            <Pin className="h-3 w-3" />
            {meta.pinned ? "Sabitlendi" : "Sabitle"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleOfficial}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
              meta.official
                ? "border-blue-500/40 bg-blue-500/15 text-blue-800 dark:text-blue-300 font-semibold"
                : "border-[#E6E7EA] dark:border-[#23262E] text-[#5F6570] hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028]"
            }`}
          >
            <Award className="h-3 w-3" />
            {meta.official ? "Ekip / Yazar" : "Ekip Rozeti"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              onUpdateItem(item, { isVerified: !item.isVerified })
            }
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
              item.isVerified
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold"
                : "border-[#E6E7EA] dark:border-[#23262E] text-[#5F6570] hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028]"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            {item.isVerified ? "Doğrulanmış" : "Doğrulanmamış"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={bumpUpvotes}
            title="Faydalı oy sayısını artır"
            className="inline-flex items-center gap-1 rounded border border-[#E6E7EA] dark:border-[#23262E] px-2 py-0.5 text-[10px] font-mono text-[#5F6570] hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028] cursor-pointer"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{meta.upvotes}</span>
          </button>

          {meta.visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className="rounded bg-[#F3F4F6] dark:bg-[#23262E] px-1.5 py-0.5 text-[10px] font-mono text-[#5F6570] dark:text-[#8C9099]"
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReplyOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-[#E6E7EA] dark:border-[#23262E] px-2.5 py-1 text-[10px] font-semibold hover:bg-[#F3F4F6] dark:hover:bg-[#1E2028] cursor-pointer"
          >
            <Reply className="h-3 w-3" />
            Yanıtla
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onDeleteItem(item.id)}
            className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-[10px] font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-500/15 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Sil
          </button>
        </div>
      </div>

      {/* Satır İçi Hızlı Yanıt Çekmecesi */}
      {replyOpen && (
        <form
          onSubmit={submitInlineReply}
          className="ml-10 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
            <span>
              ↪ @{item.authorName} yorumuna resmi ekip yanıtı yazılıyor
            </span>
            <button
              type="button"
              onClick={() => setReplyOpen(false)}
              className="text-[10px] underline"
            >
              Vazgeç
            </button>
          </div>
          <input
            type="text"
            value={replyAuthor}
            onChange={(e) => setReplyAuthor(e.target.value)}
            placeholder="Yanıtlayan adı (ör. Editör Ekibi)"
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#121317] px-2.5 py-1 text-[11px] outline-none"
          />
          <textarea
            rows={2}
            required
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Yanıt metni..."
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#121317] p-2 text-[11px] outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-[#1D5ED8] px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 cursor-pointer"
            >
              Resmi Yanıtı Yayınla
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

