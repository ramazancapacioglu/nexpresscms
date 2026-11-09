import type { createTranslator } from "@nexpress/i18n";
import { submitCommentReply } from "@/app/(public)/comment-reply";

type Translator = ReturnType<typeof createTranslator>;

export interface DiscussionEntry {
  id: string;
  parentId?: string | null;
  authorName: string;
  body: string;
  title?: string | null;
  rating?: number;
  dateLabel?: string;
  tags?: string[];
}

function childrenOf(entries: DiscussionEntry[], parentId: string): DiscussionEntry[] {
  return entries.filter((entry) => entry.parentId === parentId);
}

function CommentCard({
  entry,
  replies,
  t,
  radius,
  reply,
}: {
  entry: DiscussionEntry;
  replies: DiscussionEntry[];
  t: Translator;
  radius: string;
  reply: { contentId: string; locale: string; slug: string } | null;
}) {
  return (
    <article style={{ borderRadius: radius }} className="space-y-2 border border-nx-line bg-nx-card p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-nx-fg">{entry.authorName}</span>
        {entry.dateLabel ? <time className="text-xs text-nx-muted">{entry.dateLabel}</time> : null}
        {entry.tags?.map((tag) => (
          <span key={tag} className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium">{tag}</span>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-nx-soft">{entry.body}</p>
      {reply ? (
        <form action={submitCommentReply} className="space-y-2 border-t pt-3">
          <input type="hidden" name="contentId" value={reply.contentId} />
          <input type="hidden" name="parentId" value={entry.id} />
          <input type="hidden" name="locale" value={reply.locale} />
          <input type="hidden" name="slug" value={reply.slug} />
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input name="authorName" required maxLength={80} placeholder={t("content.replyName")} className="h-8 w-full rounded border border-nx-line bg-transparent px-2 text-sm" />
          <textarea name="body" required maxLength={2000} rows={3} placeholder={t("content.replyBody")} className="w-full rounded border border-nx-line bg-transparent p-2 text-sm" />
          <button type="submit" className="rounded border border-nx-line px-3 py-1 text-xs font-semibold">{t("content.reply")}</button>
        </form>
      ) : null}
      {replies.length > 0 ? (
        <div className="space-y-3 border-l pl-4">
          {replies.map((replyEntry) => (
            <CommentCard key={replyEntry.id} entry={replyEntry} replies={[]} t={t} radius={radius} reply={reply} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** Yazı yazarı, yorumlar ve yıldızlı incelemeler. Yorumlara yıldız basılmaz. */
export function PostDiscussion({
  t,
  headingFont,
  radius,
  authorName,
  authorHref,
  comments,
  reviews,
  avgRating,
  reply,
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
  notice: string | null;
}) {
  const roots = comments.filter((entry) => !entry.parentId || !comments.some((item) => item.id === entry.parentId));
  if (!authorName && comments.length === 0 && reviews.length === 0 && !notice) return null;
  return (
    <section className="mx-auto max-w-4xl space-y-8 border-t px-4 py-8">
      {notice ? <p role="status" className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}
      {authorName ? (
        <p className="text-sm text-nx-soft">
          {authorHref ? <a href={authorHref} className="hover:underline">{t("content.authorBy", { name: authorName })}</a> : t("content.authorBy", { name: authorName })}
        </p>
      ) : null}
      {roots.length > 0 ? (
        <div className="space-y-4">
          <h2 style={{ fontFamily: headingFont }} className="text-2xl font-bold text-nx-fg">
            {t("content.commentsHeading", { n: comments.length })}
          </h2>
          {roots.map((entry) => (
            <CommentCard key={entry.id} entry={entry} replies={childrenOf(comments, entry.id)} t={t} radius={radius} reply={reply} />
          ))}
        </div>
      ) : null}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 style={{ fontFamily: headingFont }} className="text-2xl font-bold text-nx-fg">
              {t("content.reviewsHeading", { n: reviews.length })}
            </h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs font-semibold text-amber-900">
              {t("content.ratingSummary", { avg: avgRating, n: reviews.length })}
            </div>
          </div>
          {reviews.map((entry) => (
            <article key={entry.id} style={{ borderRadius: radius }} className="space-y-2 border border-nx-line bg-nx-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-bold text-nx-fg">{entry.authorName}</span>
                {entry.rating ? <span className="text-xs font-bold text-amber-500">{"★".repeat(entry.rating)} ({entry.rating}/5)</span> : null}
              </div>
              {entry.title ? <h3 className="text-sm font-bold text-nx-fg">{entry.title}</h3> : null}
              <p className="text-sm leading-relaxed text-nx-soft">{entry.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
