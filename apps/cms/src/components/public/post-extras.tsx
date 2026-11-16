import React from "react";
import type { createTranslator } from "@nexpress/i18n";
import { ResponsiveImage } from "@nexpress/themes";

/** Blog yazısı yan öğeleri: künye satırı, etiketler, önceki/sonraki yazı ve benzer yazılar. Betik yok. */

export interface PostPeer {
  slug: string;
  title: string;
  image: string | null;
  date: Date | null;
}

type T = ReturnType<typeof createTranslator>;

const formatDate = (value: Date, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
};

/** Yazar · yayın tarihi · güncelleme · yorum sayısı (WordPress künyesi gibi tek satır). */
export function PostByline({
  t,
  locale,
  authorName,
  authorHref,
  publishedAt,
  updatedAt,
  commentCount,
}: {
  t: T;
  locale: string;
  authorName: string;
  authorHref: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  commentCount: number;
}) {
  const showUpdated = publishedAt && updatedAt && updatedAt.getTime() - publishedAt.getTime() > 86_400_000;
  const parts: React.ReactNode[] = [];
  if (authorName) parts.push(authorHref ? <a key="a" href={authorHref} className="font-medium text-nx-fg hover:underline">{t("content.authorBy", { name: authorName })}</a> : <span key="a">{t("content.authorBy", { name: authorName })}</span>);
  if (publishedAt) parts.push(<time key="p" dateTime={publishedAt.toISOString()}>{formatDate(publishedAt, locale)}</time>);
  if (showUpdated && updatedAt) parts.push(<time key="u" dateTime={updatedAt.toISOString()}>{t("content.updatedOn", { date: formatDate(updatedAt, locale) })}</time>);
  parts.push(<span key="c">{t("content.commentCount", { n: commentCount })}</span>);
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-nx-soft">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <span aria-hidden="true" className="text-nx-muted">·</span> : null}
          {part}
        </React.Fragment>
      ))}
    </p>
  );
}

export function PostFooter({
  t,
  locale,
  lb,
  tags,
  prev,
  next,
  related,
}: {
  t: T;
  locale: string;
  lb: string;
  tags: Array<{ slug: string; name: string }>;
  prev: PostPeer | null;
  next: PostPeer | null;
  related: PostPeer[];
}) {
  return (
    <div className="space-y-10">
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Etiketler">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <a href={`${lb}/etiket/${tag.slug}`} className="rounded-full border border-nx-line bg-nx-subtle px-3 py-1 text-nx-soft hover:border-nx-link hover:text-nx-link">
                #{tag.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {prev || next ? (
        <nav aria-label="Yazılar" className="grid gap-4 border-y py-5 sm:grid-cols-2">
          <div>
            {prev ? (
              <a href={`${lb}/${prev.slug}`} className="group block">
                <span className="text-xs font-semibold uppercase tracking-wider text-nx-muted">‹ {t("content.prevPost")}</span>
                <span className="mt-1 block font-semibold text-nx-fg group-hover:text-nx-link">{prev.title}</span>
              </a>
            ) : null}
          </div>
          <div className="sm:text-right">
            {next ? (
              <a href={`${lb}/${next.slug}`} className="group block">
                <span className="text-xs font-semibold uppercase tracking-wider text-nx-muted">{t("content.nextPost")} ›</span>
                <span className="mt-1 block font-semibold text-nx-fg group-hover:text-nx-link">{next.title}</span>
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-posts-title" className="space-y-4">
          <h2 id="related-posts-title" className="text-xl font-bold text-nx-fg">{t("content.relatedHeading")}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((post) => (
              <li key={post.slug} className="group overflow-hidden rounded-xl border border-nx-line bg-nx-card transition hover:-translate-y-0.5 hover:shadow-md">
                <a href={`${lb}/${post.slug}`} className="block">
                  {post.image ? (
                    <div className="aspect-[16/10] overflow-hidden bg-nx-subtle">
                      <ResponsiveImage src={post.image} alt={post.title} sizes="(min-width: 1024px) 280px, 50vw" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                  ) : null}
                  <div className="space-y-1 p-4">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-nx-fg">{post.title}</h3>
                    {post.date ? <time dateTime={post.date.toISOString()} className="block text-xs text-nx-muted">{formatDate(post.date, locale)}</time> : null}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
