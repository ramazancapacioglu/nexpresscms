import React from "react";
import type { createTranslator } from "@nexpress/i18n";
import {
  buildCommentTree,
  commentAvatarProps,
  type DiscussionSortMode,
  type ThreadedDiscussionNode,
} from "@nexpress/core";
import {
  submitPublicDiscussionAction,
  voteCommentHelpfulAction,
} from "@/app/(public)/comment-reply";
import { PostReviewsSection } from "./post-reviews-section";

type Translator = ReturnType<typeof createTranslator>;

export interface DiscussionEntry {
  id: string;
  parentId?: string | null;
  authorName: string;
  body: string;
  title?: string | null;
  rating?: number;
  pros?: string[];
  cons?: string[];
  isVerified?: boolean;
  dateLabel?: string;
  createdAtMs?: number;
  tags?: string[];
}

function CommentNodeCard({
  node,
  t,
  radius,
  replyContext,
}: {
  node: ThreadedDiscussionNode;
  t: Translator;
  radius: string;
  replyContext: { contentId: string; locale: string; slug: string } | null;
}) {
  const avatar = commentAvatarProps(node.authorName);
  const { meta } = node;

  return (
    <div id={`comment-${node.id}`} className="space-y-3">
      <article
        style={{ borderRadius: radius }}
        className={`space-y-3 border p-5 transition-colors ${
          meta.pinned
            ? "border-amber-400/60 bg-amber-50/20"
            : meta.official
              ? "border-blue-400/50 bg-blue-50/15"
              : "border-nx-line bg-nx-card"
        }`}
      >
        {/* Üst Bilgi: Avatar, Yazar, Rozetler ve Tarih */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: avatar.bg,
                color: avatar.fg,
                borderColor: avatar.border,
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
              aria-hidden="true"
            >
              {avatar.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="font-bold text-nx-fg">{node.authorName}</span>
                {meta.official && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    ★ {t("content.officialBadge")}
                  </span>
                )}
                {meta.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    📌 {t("content.pinnedBadge")}
                  </span>
                )}
                {node.isVerified && !meta.official && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    ✓ {t("content.verified")}
                  </span>
                )}
                {node.replyToAuthor && (
                  <span className="rounded bg-nx-subtle px-1.5 py-0.5 text-[11px] font-medium text-nx-muted">
                    ↪ {t("content.replyTo", { name: node.replyToAuthor })}
                  </span>
                )}
              </div>
              {node.dateLabel ? (
                <time className="block text-[11px] text-nx-muted mt-0.5">
                  {node.dateLabel}
                </time>
              ) : null}
            </div>
          </div>

          {meta.visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {meta.visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-nx-line bg-nx-subtle px-2 py-0.5 text-[10px] font-medium text-nx-soft"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Yorum Gövdesi */}
        <p className="text-sm leading-relaxed text-nx-soft whitespace-pre-line">
          {node.body}
        </p>

        {/* Alt Etkileşim Çubuğu: Faydalı Oyu + Açılır Yanıt Çekmecesi */}
        {replyContext ? (
          <div className="pt-1 border-t border-nx-line/60">
            <div className="flex flex-wrap items-center gap-3">
              <form action={voteCommentHelpfulAction}>
                <input type="hidden" name="commentId" value={node.id} />
                <input type="hidden" name="locale" value={replyContext.locale} />
                <input type="hidden" name="slug" value={replyContext.slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-nx-line px-3 py-1 text-xs font-medium text-nx-soft hover:bg-nx-subtle cursor-pointer"
                >
                  <span>👍</span>
                  <span>{t("content.helpfulBtn")}</span>
                  {meta.upvotes > 0 ? (
                    <span className="font-bold text-nx-fg">
                      ({meta.upvotes})
                    </span>
                  ) : null}
                </button>
              </form>

              <details className="group flex-1">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-nx-line px-3 py-1 text-xs font-semibold text-nx-fg hover:bg-nx-subtle">
                  <span>💬</span>
                  <span>{t("content.reply")}</span>
                </summary>
                <form
                  action={submitPublicDiscussionAction}
                  className="mt-3 space-y-2.5 rounded-xl border border-nx-line bg-nx-subtle/50 p-3.5"
                >
                  <input
                    type="hidden"
                    name="contentId"
                    value={replyContext.contentId}
                  />
                  <input type="hidden" name="parentId" value={node.id} />
                  <input
                    type="hidden"
                    name="locale"
                    value={replyContext.locale}
                  />
                  <input type="hidden" name="slug" value={replyContext.slug} />
                  <input type="hidden" name="entryType" value="comment" />
                  <input
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      name="authorName"
                      required
                      maxLength={80}
                      placeholder={t("content.replyName")}
                      className="h-9 w-full rounded-lg border border-nx-line bg-nx-card px-2.5 text-xs outline-none"
                    />
                    <input
                      name="authorEmail"
                      type="email"
                      maxLength={120}
                      placeholder={t("content.yourEmailOptional")}
                      className="h-9 w-full rounded-lg border border-nx-line bg-nx-card px-2.5 text-xs outline-none"
                    />
                  </div>
                  <textarea
                    name="body"
                    required
                    maxLength={2000}
                    rows={2}
                    placeholder={t("content.replyBody")}
                    className="w-full rounded-lg border border-nx-line bg-nx-card p-2.5 text-xs outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-nx-muted">
                      {t("content.moderationNote")}
                    </span>
                    <button
                      type="submit"
                      className="rounded-lg bg-nx-fg px-3.5 py-1.5 text-xs font-semibold text-nx-bg hover:opacity-90 cursor-pointer"
                    >
                      {t("content.reply")}
                    </button>
                  </div>
                </form>
              </details>
            </div>
          </div>
        ) : null}
      </article>

      {/* İç İçe Yanıt Ağacı (3 seviyeye kadar görsel girinti) */}
      {node.children.length > 0 ? (
        <div className="space-y-3 border-l-2 border-nx-line pl-4 sm:pl-6">
          {node.children.map((child) => (
            <CommentNodeCard
              key={child.id}
              node={child}
              t={t}
              radius={radius}
              replyContext={replyContext}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Yazı yazarı, çok seviyeli topluluk tartışması ve 5 yıldızlı incelemeler (0-KB RSC).
 */
export function PostDiscussion({
  t,
  headingFont,
  radius,
  authorName,
  authorHref,
  comments,
  reviews,
  avgRating: _avgRating,
  reply,
  allowComments = true,
  allowReviews = false,
  sort = "popular",
  pagePath,
  notice,
}: {
  t: Translator;
  headingFont: string;
  radius: string;
  authorName: string | null;
  authorHref: string | null;
  comments: DiscussionEntry[];
  reviews: DiscussionEntry[];
  avgRating: string;
  reply: { contentId: string; locale: string; slug: string } | null;
  allowComments?: boolean;
  allowReviews?: boolean;
  sort?: DiscussionSortMode;
  pagePath?: string;
  notice: string | null;
}) {
  const showCommentsSection = allowComments || comments.length > 0;
  const showReviewsSection = allowReviews || reviews.length > 0;

  if (!authorName && !showCommentsSection && !showReviewsSection && !notice) {
    return null;
  }

  const tree = buildCommentTree(comments, sort, 3);
  const sortBase = pagePath ?? "";

  return (
    <section
      id="tartisma"
      className="mx-auto max-w-4xl space-y-10 border-t border-nx-line px-4 py-10"
    >
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/50 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          ✓ {notice}
        </p>
      ) : null}

      {authorName ? (
        <div className="flex items-center gap-3 text-sm text-nx-soft">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-nx-line bg-nx-subtle text-xs font-bold text-nx-fg">
            ✍️
          </span>
          {authorHref ? (
            <a href={authorHref} className="font-medium hover:underline">
              {t("content.authorBy", { name: authorName })}
            </a>
          ) : (
            <span className="font-medium">
              {t("content.authorBy", { name: authorName })}
            </span>
          )}
        </div>
      ) : null}

      {/* 5 Yıldızlı Değerlendirme Özeti, Dağılım Çubuğu ve İnceleme Kartları */}
      {showReviewsSection ? (
        <PostReviewsSection
          t={t}
          headingFont={headingFont}
          radius={radius}
          reviews={reviews}
          context={reply}
          allowReviews={allowReviews}
        />
      ) : null}

      {/* Çok Seviyeli Yorum ve Tartışma Alanı */}
      {showCommentsSection ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              style={{ fontFamily: headingFont }}
              className="text-2xl font-bold tracking-tight text-nx-fg"
            >
              {t("content.commentsHeading", { n: comments.length })}
            </h2>

            {comments.length > 1 && (
              <nav
                aria-label={t("query.sortLabel")}
                className="inline-flex items-center gap-1 rounded-full border border-nx-line bg-nx-subtle p-1 text-xs"
              >
                {(
                  [
                    { id: "popular", label: t("content.sortPopular") },
                    { id: "newest", label: t("content.sortNewest") },
                    { id: "oldest", label: t("content.sortOldest") },
                  ] as const
                ).map((tab) => {
                  const active = sort === tab.id;
                  return (
                    <a
                      key={tab.id}
                      href={`${sortBase}?c_sort=${tab.id}#tartisma`}
                      className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                        active
                          ? "bg-nx-fg text-nx-bg"
                          : "text-nx-soft hover:text-nx-fg"
                      }`}
                    >
                      {tab.label}
                    </a>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Kök Yorum Gönderim Kartı */}
          {allowComments && reply ? (
            <form
              action={submitPublicDiscussionAction}
              style={{ borderRadius: radius }}
              className="space-y-3.5 border border-nx-line bg-nx-card p-5 shadow-2xs"
            >
              <div className="text-sm font-bold text-nx-fg flex items-center gap-2">
                <span>💬</span>
                <span>{t("content.writeCommentTitle")}</span>
              </div>
              <input type="hidden" name="contentId" value={reply.contentId} />
              <input type="hidden" name="locale" value={reply.locale} />
              <input type="hidden" name="slug" value={reply.slug} />
              <input type="hidden" name="entryType" value="comment" />
              <input
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="authorName"
                  required
                  maxLength={80}
                  placeholder={t("content.replyName")}
                  className="h-10 w-full rounded-lg border border-nx-line bg-transparent px-3 text-sm outline-none focus:border-nx-fg"
                />
                <input
                  name="authorEmail"
                  type="email"
                  maxLength={120}
                  placeholder={t("content.yourEmailOptional")}
                  className="h-10 w-full rounded-lg border border-nx-line bg-transparent px-3 text-sm outline-none focus:border-nx-fg"
                />
              </div>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={3}
                placeholder={t("content.replyBody")}
                className="w-full rounded-lg border border-nx-line bg-transparent p-3 text-sm outline-none focus:border-nx-fg"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-nx-muted">
                  {t("content.moderationNote")}
                </span>
                <button
                  type="submit"
                  className="rounded-lg bg-nx-fg px-4 py-2 text-xs font-semibold text-nx-bg hover:opacity-90 cursor-pointer"
                >
                  {t("content.submitComment")}
                </button>
              </div>
            </form>
          ) : null}

          {tree.length === 0 ? (
            <p className="text-sm text-nx-muted">
              {t("content.beFirstComment")}
            </p>
          ) : (
            <div className="space-y-4">
              {tree.map((node) => (
                <CommentNodeCard
                  key={node.id}
                  node={node}
                  t={t}
                  radius={radius}
                  replyContext={allowComments ? reply : null}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
