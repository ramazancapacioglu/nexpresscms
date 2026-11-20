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

/** Künye (WordPress gibi tek satır): yuvarlak avatar · Tarafından yazar | yayın | güncelleme | kategori | yorum sayısı. */
export function PostByline({
  t,
  locale,
  authorName,
  authorHref,
  publishedAt,
  updatedAt,
  commentCount,
  category,
}: {
  t: T;
  locale: string;
  authorName: string;
  authorHref: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  commentCount: number;
  category?: { name: string; href: string } | null;
}) {
  const showUpdated = publishedAt && updatedAt && updatedAt.getTime() - publishedAt.getTime() > 86_400_000;
  const parts: React.ReactNode[] = [];
  if (publishedAt) parts.push(<time key="p" dateTime={publishedAt.toISOString()}>{formatDate(publishedAt, locale)}</time>);
  if (showUpdated && updatedAt) parts.push(<time key="u" dateTime={updatedAt.toISOString()}>{formatDate(updatedAt, locale)}</time>);
  if (category) parts.push(<a key="c" href={category.href} className="hover:underline">{category.name}</a>);
  parts.push(<span key="n">{commentCount} {commentCount === 1 ? "Yorum" : "Yorum"}</span>);
  const initial = (authorName.trim()[0] ?? "•").toLocaleUpperCase(locale);
  const who = t("content.byAuthor", { name: authorName });
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-nx-soft">
      {authorName ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-nx-secondary-bg text-xs font-bold text-white" style={{ backgroundColor: "var(--nx-secondary,#042646)" }}>{initial}</span>
          {authorHref ? <a href={authorHref} className="hover:underline">{who}</a> : <span>{who}</span>}
        </span>
      ) : null}
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {authorName || index > 0 ? <span aria-hidden="true" className="text-nx-muted">|</span> : null}
          {part}
        </React.Fragment>
      ))}
    </p>
  );
}

const SHARE: Array<{ id: string; label: string; glyph: React.ReactNode; href: (url: string, title: string) => string }> = [
  { id: "facebook", label: "Facebook", glyph: <span className="text-[15px] font-black">f</span>, href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: "x", label: "X", glyph: <span className="text-[13px] font-black">X</span>, href: (u, ti) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(ti)}&url=${encodeURIComponent(u)}` },
  { id: "linkedin", label: "LinkedIn", glyph: <span className="text-[12px] font-black">in</span>, href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { id: "pinterest", label: "Pinterest", glyph: <span className="text-[14px] font-black">P</span>, href: (u, ti) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(ti)}` },
  { id: "reddit", label: "Reddit", glyph: <span className="text-[14px] font-black">r</span>, href: (u, ti) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(ti)}` },
  { id: "tumblr", label: "Tumblr", glyph: <span className="text-[14px] font-black">t</span>, href: (u, ti) => `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(u)}&title=${encodeURIComponent(ti)}` },
  {
    id: "whatsapp",
    label: "WhatsApp",
    glyph: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.1Z" /></svg>,
    href: (u, ti) => `https://wa.me/?text=${encodeURIComponent(`${ti} ${u}`)}`,
  },
];

/** "Paylaş :" + yuvarlak paylaşım düğmeleri (WordPress yazı düzeni). Betik yok; her düğme bir paylaşım bağlantısıdır. */
export function PostShareRow({ t, title, pageUrl }: { t: T; title: string; pageUrl: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-nx-soft">
      <span>{t("content.shareLabel")}</span>
      <ul className="flex items-center gap-1.5">
        {SHARE.map((item) => (
          <li key={item.id}>
            <a
              href={item.href(pageUrl, title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              style={{ backgroundColor: "var(--nx-secondary,#042646)" }}
              className="grid h-8 w-8 place-items-center rounded-full text-white transition hover:opacity-85"
            >
              {item.glyph}
            </a>
          </li>
        ))}
      </ul>
    </div>
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

/** Sayfa altında ilgili sayfa ve yazı bağlantıları (iç bağlantı kümesi). Betik yok, düz bağlantı listesi. */
export function RelatedLinks({ heading, lb, items }: { heading: string; lb: string; items: Array<{ slug: string; title: string }> }) {
  return (
    <nav aria-labelledby="related-links-title" className="mt-10 space-y-3 border-t pt-6">
      <h2 id="related-links-title" className="text-lg font-bold text-nx-fg">{heading}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.slug}>
            <a href={`${lb}/${item.slug}`} className="block rounded-lg border border-nx-line bg-nx-card px-4 py-3 text-sm font-semibold text-nx-fg transition hover:border-nx-link hover:text-nx-link">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Yazı altı yazar kutusu (E-E-A-T): avatar, ad, ünvan, biyografi, uzmanlık, profil bağlantıları. Yalnızca dolu alanlar görünür; şemadaki `Person` ile aynı veriden gelir. */
export function AuthorBox({
  t,
  name,
  href,
  profile,
}: {
  t: T;
  name: string;
  href: string;
  profile: { jobTitle: string; bio: string; expertise: string[]; sameAs: string[]; avatarUrl: string };
}) {
  return (
    <aside aria-label={t("content.aboutAuthor")} className="flex gap-4 rounded-xl border border-nx-line bg-nx-card p-4">
      {profile.avatarUrl ? (
        <ResponsiveImage src={profile.avatarUrl} alt={name} sizes="64px" className="h-16 w-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: "var(--nx-secondary,#042646)" }}>
          {(name.trim()[0] ?? "•").toLocaleUpperCase()}
        </span>
      )}
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-nx-muted">{t("content.aboutAuthor")}</p>
        <p className="text-base font-bold text-nx-fg">
          <a href={href} className="hover:underline">{name}</a>
          {profile.jobTitle ? <span className="ml-2 text-sm font-normal text-nx-soft">{profile.jobTitle}</span> : null}
        </p>
        {profile.bio ? <p className="text-sm leading-relaxed text-nx-soft">{profile.bio}</p> : null}
        {profile.expertise.length > 0 ? (
          <p className="text-xs text-nx-muted">
            <span className="font-semibold">{t("content.authorExpertise")}:</span> {profile.expertise.join(", ")}
          </p>
        ) : null}
        {profile.sameAs.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label={t("content.authorProfileLinks")}>
            {profile.sameAs.map((url) => (
              <li key={url}>
                <a href={url} rel="me noopener" target="_blank" className="text-nx-link hover:underline">{new URL(url).hostname.replace(/^www\./, "")}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
