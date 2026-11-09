import React from "react";
import type { createTranslator } from "@nexpress/i18n";
import {
  commentAvatarProps,
  computeRatingSummary,
  parseCommentTags,
} from "@nexpress/core";
import {
  submitPublicDiscussionAction,
  voteCommentHelpfulAction,
} from "@/app/(public)/comment-reply";
import type { DiscussionEntry } from "./post-discussion";

type Translator = ReturnType<typeof createTranslator>;

export function PostReviewsSection({
  t,
  headingFont,
  radius,
  reviews,
  context,
  allowReviews,
}: {
  t: Translator;
  headingFont: string;
  radius: string;
  reviews: DiscussionEntry[];
  context: { contentId: string; locale: string; slug: string } | null;
  allowReviews: boolean;
}) {
  if (reviews.length === 0 && !allowReviews) return null;

  const summary = computeRatingSummary(
    reviews.map((r) => ({ rating: r.rating ?? 5, isVerified: r.isVerified }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            style={{ fontFamily: headingFont }}
            className="text-2xl font-bold tracking-tight text-nx-fg"
          >
            {t("content.reviewsHeading", { n: reviews.length })}
          </h2>
          <p className="text-xs text-nx-muted mt-0.5">
            {t("content.reviewsSubheading")}
          </p>
        </div>
      </div>

      {/* 5 Yıldızlı Dağılım Grafiği ve Özet Kartı */}
      <div
        style={{ borderRadius: radius }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 border border-nx-line bg-nx-card p-6 shadow-xs"
      >
        {/* Sol: Ortalama Puan */}
        <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start md:border-r border-nx-line md:pr-6 text-center md:text-left">
          <div className="text-4xl font-extrabold tracking-tight text-nx-fg">
            {summary.averageLabel}
            <span className="text-lg font-normal text-nx-muted"> / 5.0</span>
          </div>
          <div
            className="mt-1.5 flex items-center gap-1 text-amber-500 text-lg tracking-wider"
            aria-label={`${summary.averageLabel} / 5`}
          >
            {"★★★★★"}
          </div>
          <p className="mt-1.5 text-xs font-medium text-nx-soft">
            {t("content.ratingSummary", {
              avg: summary.averageLabel,
              n: summary.total,
            })}
          </p>
          {summary.verifiedCount > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              ✓ {summary.verifiedCount} {t("content.verified")}
            </span>
          )}
        </div>

        {/* Sağ: 5★ - 1★ Çubuk Dağılımı */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {summary.stars.map((row) => (
            <div key={row.star} className="flex items-center gap-3 text-xs">
              <span className="w-12 font-semibold text-amber-600 shrink-0">
                {row.star} ★
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-nx-subtle border border-nx-line">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono text-[11px] text-nx-muted shrink-0">
                {row.count} ({row.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ziyaretçi 5 Yıldızlı Değerlendirme Formu (Açılır <details> Çekmecesi - 0 KB RSC) */}
      {allowReviews && context ? (
        <details
          style={{ borderRadius: radius }}
          className="group border border-nx-line bg-nx-card overflow-hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold text-nx-fg hover:bg-nx-subtle">
            <span className="flex items-center gap-2">
              <span className="text-amber-500">★</span>
              <span>{t("content.writeReviewTitle")}</span>
            </span>
            <span className="rounded-full border border-nx-line px-2.5 py-0.5 text-xs font-medium text-nx-soft group-open:bg-nx-subtle">
              +
            </span>
          </summary>
          <form
            action={submitPublicDiscussionAction}
            className="space-y-4 border-t border-nx-line p-5 text-sm"
          >
            <input type="hidden" name="contentId" value={context.contentId} />
            <input type="hidden" name="locale" value={context.locale} />
            <input type="hidden" name="slug" value={context.slug} />
            <input type="hidden" name="entryType" value="review" />
            <input
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            {/* Yıldız Seçimi */}
            <div className="flex flex-wrap items-center gap-2">
              {[5, 4, 3, 2, 1].map((starVal) => (
                <label
                  key={starVal}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold hover:border-amber-400"
                >
                  <input
                    type="radio"
                    name="rating"
                    value={starVal}
                    defaultChecked={starVal === 5}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-500">{"★".repeat(starVal)}</span>
                  <span className="text-nx-soft">({starVal}/5)</span>
                </label>
              ))}
            </div>

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

            <input
              name="title"
              maxLength={120}
              placeholder={t("content.reviewTitlePlaceholder")}
              className="h-10 w-full rounded-lg border border-nx-line bg-transparent px-3 text-sm outline-none focus:border-nx-fg"
            />

            <textarea
              name="body"
              required
              maxLength={2000}
              rows={3}
              placeholder={t("content.replyBody")}
              className="w-full rounded-lg border border-nx-line bg-transparent p-3 text-sm outline-none focus:border-nx-fg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <textarea
                name="prosText"
                maxLength={600}
                rows={2}
                placeholder={t("content.prosPlaceholder")}
                className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs outline-none"
              />
              <textarea
                name="consText"
                maxLength={600}
                rows={2}
                placeholder={t("content.consPlaceholder")}
                className="w-full rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-xs outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-nx-muted">
                {t("content.moderationNote")}
              </span>
              <button
                type="submit"
                className="rounded-lg bg-nx-fg px-4 py-2 text-xs font-semibold text-nx-bg hover:opacity-90 cursor-pointer"
              >
                {t("content.submitReview")}
              </button>
            </div>
          </form>
        </details>
      ) : null}

      {/* İnceleme Kartları */}
      {reviews.length === 0 ? (
        <p className="text-sm text-nx-muted">{t("content.noReviews")}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((entry) => {
            const avatar = commentAvatarProps(entry.authorName);
            const meta = parseCommentTags(entry.tags);
            const pros = entry.pros ?? [];
            const cons = entry.cons ?? [];

            return (
              <article
                key={entry.id}
                id={`comment-${entry.id}`}
                style={{ borderRadius: radius }}
                className="space-y-3 border border-nx-line bg-nx-card p-5 shadow-2xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: avatar.bg,
                        color: avatar.fg,
                        borderColor: avatar.border,
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                      aria-hidden="true"
                    >
                      {avatar.initials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-nx-fg">
                          {entry.authorName}
                        </span>
                        {entry.isVerified !== false && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            ✓ {t("content.verified")}
                          </span>
                        )}
                        {meta.official && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            ★ {t("content.officialBadge")}
                          </span>
                        )}
                        {meta.pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            📌 {t("content.pinnedBadge")}
                          </span>
                        )}
                      </div>
                      {entry.dateLabel ? (
                        <time className="block text-xs text-nx-muted mt-0.5">
                          {entry.dateLabel}
                        </time>
                      ) : null}
                    </div>
                  </div>

                  {entry.rating ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 px-3 py-1 text-xs font-bold text-amber-800">
                      <span className="text-amber-500">
                        {"★".repeat(entry.rating)}
                      </span>
                      <span>({entry.rating}/5)</span>
                    </div>
                  ) : null}
                </div>

                {entry.title ? (
                  <h3 className="text-base font-bold text-nx-fg">
                    {entry.title}
                  </h3>
                ) : null}

                <p className="text-sm leading-relaxed text-nx-soft whitespace-pre-line">
                  {entry.body}
                </p>

                {(pros.length > 0 || cons.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {pros.length > 0 && (
                      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs">
                        <div className="font-bold text-emerald-800 mb-1.5">
                          + {t("content.pros")}
                        </div>
                        <ul className="space-y-1 text-nx-soft">
                          {pros.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-3 text-xs">
                        <div className="font-bold text-rose-800 mb-1.5">
                          − {t("content.cons")}
                        </div>
                        <ul className="space-y-1 text-nx-soft">
                          {cons.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">−</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-nx-line/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {meta.visibleTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-nx-line bg-nx-subtle px-2 py-0.5 text-[11px] font-medium text-nx-soft"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {context ? (
                    <form action={voteCommentHelpfulAction}>
                      <input type="hidden" name="commentId" value={entry.id} />
                      <input type="hidden" name="locale" value={context.locale} />
                      <input type="hidden" name="slug" value={context.slug} />
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
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

