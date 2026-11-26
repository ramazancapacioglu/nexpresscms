import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasAuthorProfile, paginate, resolveLocalizedSiteIdentity, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { buildAuthorPerson, buildPageSchemaGraph, jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, ResponsiveImage } from "@nexpress/themes";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { organizationFor } from "@/lib/organization-schema";
import { getPublicAuthors, getPublicSite, listPublishedContents } from "@/lib/public-data";

const baseOf = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PAGE_SIZE = 12;

function socialLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host === "x.com" || host === "twitter.com") return "X (Twitter)";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("pinterest.")) return "Pinterest";
    return host;
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const person = (await getPublicAuthors(siteId))[slug];
  if (!person) return { title: slug, robots: { index: false, follow: true } };
  const lb = await siteLocaleBase(siteId, locale);
  const description = person.profile.bio
    ? person.profile.bio.slice(0, 160)
    : person.profile.jobTitle
      ? `${person.name} — ${person.profile.jobTitle}`
      : undefined;
  return {
    title: person.profile.jobTitle ? `${person.name} — ${person.profile.jobTitle}` : person.name,
    ...(description ? { description } : {}),
    alternates: { canonical: `${baseOf()}${lb}/yazar/${slug}` },
  };
}

/** Yazar profili ve yayınladığı yazılar (kart ızgarası + kenar çubuğu uyumlu 0-KB RSC). Boş alanlar gösterilmez. */
export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const { locale, slug } = await params;
  const pageNum = Number((await searchParams).sayfa) || 1;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, authors, contents, taxonomyRows] = await Promise.all([
    getPublicSite(siteId),
    getPublicAuthors(siteId),
    listPublishedContents(siteId, locale),
    getScopedRepository(siteId).listTaxonomies("category"),
  ]);
  const person = authors[slug];
  if (!person) notFound();
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;

  const categoryName = (catSlug: string) =>
    taxonomyRows.find((row) => row.slug === catSlug)?.name ?? catSlug;

  const posts = contents
    .filter((item) => {
      if (item.type !== "post" || item.noIndex) return false;
      const pub = resolvePublishing(item.schemaAttributes);
      return item.authorName === person.name || pub.authorName === person.name;
    })
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime());

  const paged = paginate(posts, pageNum, PAGE_SIZE);
  const profile = person.profile;
  const isOrg = profile.authorType === "Organization";
  const base = baseOf();
  const canonicalUrl = `${base}${lb}/yazar/${slug}`;
  const localized = resolveLocalizedSiteIdentity(site, locale);
  const siteName = localized.name;

  const graph = await buildPageSchemaGraph({
    siteId,
    siteName,
    siteUrl: base,
    locale,
    pageUrl: canonicalUrl,
    breadcrumbs: [
      { name: t("taxonomy.home"), url: `${base}${lb || "/"}` },
      { name: "Yazarlar", url: `${base}${lb}/yazar` },
      { name: person.name, url: canonicalUrl },
    ],
    organization: organizationFor(localized.seo),
    content: { id: `author:${slug}`, title: person.name, tldr: profile.bio || undefined, schemaType: "ProfilePage" },
  });
  const personNode = buildAuthorPerson({
    baseUrl: base,
    orgId: `${base}/#organization`,
    name: person.name,
    url: canonicalUrl,
    profile: hasAuthorProfile(profile) ? profile : undefined,
  });
  const entityId = typeof personNode["@id"] === "string" ? personNode["@id"] : `${canonicalUrl}#${isOrg ? "organization" : "person"}`;
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  const pageNode = nodes.find((n) => n["@type"] === "ProfilePage");
  if (pageNode) pageNode.mainEntity = { "@id": entityId };
  nodes.push({ ...personNode, mainEntityOfPage: { "@id": `${canonicalUrl}#profilepage` } } as never);

  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }} />

      {/* Ekmek Kırıntısı */}
      <nav aria-label="Sayfa yolu" className="text-xs opacity-70">
        <a href={lb || "/"} className="hover:underline">
          {t("taxonomy.home")}
        </a>{" "}
        <span aria-hidden="true">/</span>{" "}
        <a href={`${lb}/yazar`} className="hover:underline">
          Yazarlar
        </a>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span aria-current="page" className="font-medium">
          {person.name}
        </span>
      </nav>

      {/* Yazar Profil Kartı */}
      <section
        style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
        className="relative overflow-hidden border bg-nx-surface p-6 sm:p-7 shadow-xs space-y-5"
      >
        <div
          aria-hidden="true"
          style={{ backgroundColor: tokens.colors.primary }}
          className="absolute inset-x-0 top-0 h-1"
        />

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {profile.avatarUrl ? (
              <ResponsiveImage
                src={profile.avatarUrl}
                alt={person.name}
                priority
                sizes="96px"
                className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl border border-nx-line object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 12%, transparent)`,
                  color: tokens.colors.primary,
                }}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-nx-line text-2xl font-extrabold"
              >
                {initials || "?"}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-nx-line bg-nx-subtle px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  {isOrg ? "Kurumsal Yayın Ekibi" : t("content.authorArchive")}
                </span>
                <span
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 10%, transparent)`,
                    color: tokens.colors.primary,
                  }}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  {posts.length} Yayınlanan İçerik
                </span>
              </div>
              <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {person.name}
              </h1>
              {profile.jobTitle ? <p className="text-sm sm:text-base font-medium opacity-80">{profile.jobTitle}</p> : null}
            </div>
          </div>
        </header>

        {profile.bio ? (
          <p className="text-[15px] leading-relaxed opacity-90">{profile.bio}</p>
        ) : null}

        {profile.expertise.length > 0 || profile.credentials.length > 0 ? (
          <div className="grid gap-4 border-t border-nx-line pt-4 sm:grid-cols-2">
            {profile.expertise.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-[11px] font-bold uppercase tracking-wider opacity-65">{t("content.authorExpertise")}</h2>
                <ul className="flex flex-wrap gap-1.5 text-xs">
                  {profile.expertise.map((item) => (
                    <li key={item} className="rounded-full border border-nx-line bg-nx-subtle px-3 py-1 font-medium">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {profile.credentials.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-[11px] font-bold uppercase tracking-wider opacity-65">Yetkinlikler &amp; Belgeler</h2>
                <ul className="space-y-1.5 text-xs">
                  {profile.credentials.map((cred) => (
                    <li key={cred} className="flex items-start gap-2 font-medium">
                      <span style={{ color: tokens.colors.primary }} className="font-bold">✓</span>
                      <span>{cred}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {profile.sameAs.length > 0 ? (
          <div className="border-t border-nx-line pt-4">
            <ul className="flex flex-wrap gap-2 text-xs" aria-label={t("content.authorProfileLinks")}>
              {profile.sameAs.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 font-medium transition hover:border-current/30 hover:underline"
                  >
                    <span>{socialLabel(url)}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Yayınlanan Yazılar (Kart Izgarası) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-nx-line pb-3">
          <div>
            <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl font-bold tracking-tight">
              Yayınlanan İçerikler
            </h2>
            <p className="text-xs opacity-65">{person.name} tarafından hazırlanan teknik rehberler ve makaleler</p>
          </div>
          <span className="rounded-full border border-nx-line bg-nx-subtle px-3 py-1 text-xs font-semibold">
            Toplam {posts.length} yazı
          </span>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm opacity-70">{t("content.authorEmpty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {paged.items.map((post) => {
              const pub = resolvePublishing(post.schemaAttributes);
              const dt = post.publishedAt ? new Date(post.publishedAt) : null;
              const imgUrl = pub.featuredImageUrl || post.featuredImage || null;
              const imgAlt = pub.featuredImageAlt || post.title;
              const catSlug = pub.categories[0];
              const isTech = post.schemaType === "TechArticle";
              const summary = (post.tldr || post.excerpt || post.metaDescription || "").trim();
              const href = `${lb}/${post.slug}`;

              return (
                <article
                  key={post.id}
                  style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                  className="group flex flex-col overflow-hidden border bg-nx-surface shadow-xs transition hover:shadow-md"
                >
                  <a href={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden bg-nx-subtle">
                    {imgUrl ? (
                      <ResponsiveImage
                        src={imgUrl}
                        alt={imgAlt}
                        className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div
                        style={{
                          background: `linear-gradient(135deg, color-mix(in srgb, ${tokens.colors.primary} 14%, transparent), color-mix(in srgb, ${tokens.colors.primary} 4%, transparent))`,
                        }}
                        className="flex aspect-[16/9] w-full items-center justify-center px-4 text-center"
                      >
                        <span style={{ color: tokens.colors.primary }} className="text-xs font-bold uppercase tracking-wider opacity-80">
                          {catSlug ? categoryName(catSlug) : isTech ? "Teknik Rehber" : "Makale"}
                        </span>
                      </div>
                    )}
                  </a>

                  <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {catSlug ? (
                          <a
                            href={`${lb}/kategori/${catSlug}`}
                            style={{ color: tokens.colors.primary }}
                            className="font-bold uppercase tracking-wider hover:underline"
                          >
                            {categoryName(catSlug)}
                          </a>
                        ) : null}
                        {isTech ? (
                          <span className="rounded bg-nx-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80 border border-nx-line">
                            Teknik Rehber
                          </span>
                        ) : null}
                        {dt ? (
                          <time dateTime={dt.toISOString()} className="ml-auto opacity-60">
                            {dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                          </time>
                        ) : null}
                      </div>

                      <h3 className="text-base font-bold leading-snug tracking-tight">
                        <a href={href} className="hover:underline">
                          {post.title}
                        </a>
                      </h3>

                      {summary ? (
                        <p className="line-clamp-3 text-sm leading-relaxed opacity-75">{summary}</p>
                      ) : null}
                    </div>

                    <div className="border-t border-nx-line pt-3">
                      <a
                        href={href}
                        style={{ color: tokens.colors.primary }}
                        className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                      >
                        <span>Yazıyı İncele</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {paged.pages > 1 ? (
          <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t border-nx-line pt-4 text-sm">
            {paged.page > 1 ? (
              <a
                rel="prev"
                href={`${lb}/yazar/${slug}${paged.page > 2 ? `?sayfa=${paged.page - 1}` : ""}`}
                className="font-medium hover:underline"
              >
                ← Yeni yazılar
              </a>
            ) : (
              <span />
            )}
            <span className="text-xs opacity-70">
              Sayfa {paged.page} / {paged.pages}
            </span>
            {paged.page < paged.pages ? (
              <a
                rel="next"
                href={`${lb}/yazar/${slug}?sayfa=${paged.page + 1}`}
                className="font-medium hover:underline"
              >
                Eski yazılar →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
