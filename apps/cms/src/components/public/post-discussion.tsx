import type { createTranslator } from "@nexpress/i18n";

type Translator = ReturnType<typeof createTranslator>;

export interface DiscussionEntry {
  id: string;
  authorName: string;
  body: string;
  title?: string | null;
  rating?: number;
  dateLabel?: string;
  pros?: string[];
  cons?: string[];
  verified?: boolean;
}

/** Yazı yazarı, yorumlar ve yıldızlı incelemeler. Yorumlara yıldız basılmaz. */
export function PostDiscussion({
  t,
  headingFont,
  radius,
  authorLine,
  comments,
  reviews,
  avgRating,
}: {
  t: Translator;
  headingFont: string;
  radius: string;
  authorLine: string | null;
  comments: DiscussionEntry[];
  reviews: DiscussionEntry[];
  avgRating: string;
}) {
  if (!authorLine && comments.length === 0 && reviews.length === 0) return null;
  return (
    <section className="mx-auto max-w-4xl space-y-8 border-t px-4 py-8">
      {authorLine ? <p className="text-sm text-nx-soft">{authorLine}</p> : null}
      {comments.length > 0 ? (
        <div className="space-y-4">
          <h2 style={{ fontFamily: headingFont }} className="text-2xl font-bold text-nx-fg">
            {t("content.commentsHeading", { n: comments.length })}
          </h2>
          {comments.map((entry) => (
            <article key={entry.id} style={{ borderRadius: radius }} className="space-y-2 border border-nx-line bg-nx-card p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-nx-fg">{entry.authorName}</span>
                {entry.dateLabel ? <time className="text-xs text-nx-muted">{entry.dateLabel}</time> : null}
              </div>
              <p className="text-sm leading-relaxed text-nx-soft">{entry.body}</p>
            </article>
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
