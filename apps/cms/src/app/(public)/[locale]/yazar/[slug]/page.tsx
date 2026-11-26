import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasAuthorProfile, resolveLocalizedSiteIdentity, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { buildAuthorPerson, buildPageSchemaGraph, jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, ResponsiveImage } from "@nexpress/themes";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { organizationFor } from "@/lib/organization-schema";
import { getPublicAuthors, getPublicSite } from "@/lib/public-data";

const baseOf = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function socialLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host === "x.com" || host === "twitter.com") return "X (Twitter)";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("github.com")) return "GitHub";
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

/** Yazar profili ve yayınladığı yazılar. Boş alanlar gösterilmez; parola, e-posta ve rol hiçbir zaman çıkmaz. */
export default async function AuthorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, authors, contents] = await Promise.all([
    getPublicSite(siteId),
    getPublicAuthors(siteId),
    getScopedRepository(siteId).listContents({ locale }),
  ]);
  const person = authors[slug];
  if (!person) notFound();
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const posts = contents
    .filter((item) => {
      if (item.type !== "post" || item.status !== "published") return false;
      const pub = resolvePublishing(item.schemaAttributes);
      if (pub.visibility !== "public") return false;
      return item.authorName === person.name || pub.authorName === person.name;
    })
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime());

  const profile = person.profile;
  const isOrg = profile.authorType === "Organization";
  const base = baseOf();
  const pageUrl = `${base}${lb}/yazar/${slug}`;
  const localized = resolveLocalizedSiteIdentity(site, locale);
  const siteName = localized.name;
  const graph = await buildPageSchemaGraph({
    siteId,
    siteName,
    siteUrl: base,
    locale,
    pageUrl,
    breadcrumbs: [
      { name: t("taxonomy.home"), url: `${base}${lb || "/"}` },
      { name: person.name, url: pageUrl },
    ],
    organization: organizationFor(localized.seo),
    content: { id: `author:${slug}`, title: person.name, tldr: profile.bio || undefined, schemaType: "ProfilePage" },
  });
  const personNode = buildAuthorPerson({
    baseUrl: base,
    orgId: `${base}/#organization`,
    name: person.name,
    url: pageUrl,
    profile: hasAuthorProfile(profile) ? profile : undefined,
  });
  const entityId = typeof personNode["@id"] === "string" ? personNode["@id"] : `${pageUrl}#${isOrg ? "organization" : "person"}`;
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  const page = nodes.find((n) => n["@type"] === "ProfilePage");
  if (page) page.mainEntity = { "@id": entityId };
  nodes.push({ ...personNode, mainEntityOfPage: { "@id": `${pageUrl}#profilepage` } } as never);

  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }} />

      {/* Profil Kartı */}
      <section className="rounded-2xl border border-nx-line bg-nx-surface p-6 sm:p-8 shadow-xs space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center gap-5">
          {profile.avatarUrl ? (
            <ResponsiveImage
              src={profile.avatarUrl}
              alt={person.name}
              priority
              sizes="96px"
              className="h-24 w-24 shrink-0 rounded-full object-cover border border-nx-line"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-nx-line bg-nx-subtle text-xl font-bold"
            >
              {initials || "?"}
            </div>
          )}
          <div className="space-y-1.5">
            <span className="inline-flex items-center rounded-full border border-nx-line bg-nx-subtle px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
              {isOrg ? "Kurumsal Yayın Ekibi" : t("content.authorArchive")}
            </span>
            <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">
              {person.name}
            </h1>
            {profile.jobTitle ? <p className="text-base font-medium opacity-80">{profile.jobTitle}</p> : null}
          </div>
        </header>

        {profile.bio ? (
          <p className="text-[15px] leading-relaxed opacity-90">{profile.bio}</p>
        ) : null}

        {profile.expertise.length > 0 ? (
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-65">{t("content.authorExpertise")}</h2>
            <ul className="flex flex-wrap gap-2 text-xs">
              {profile.expertise.map((item) => (
                <li key={item} className="rounded-full border border-nx-line bg-nx-subtle px-3 py-1 font-medium">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {profile.credentials.length > 0 ? (
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-65">Yetkinlikler &amp; Belgeler</h2>
            <ul className="flex flex-wrap gap-2 text-xs">
              {profile.credentials.map((cred) => (
                <li key={cred} className="rounded-lg border border-nx-line px-3 py-1.5 font-medium">
                  ✓ {cred}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {profile.sameAs.length > 0 ? (
          <div className="pt-2 border-t border-nx-line">
            <ul className="flex flex-wrap gap-2 text-xs" aria-label={t("content.authorProfileLinks")}>
              {profile.sameAs.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 font-medium hover:underline"
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

      {/* Yayınlanan Yazılar */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-nx-line pb-2">
          <h2 className="text-lg font-bold tracking-tight">Yayınlanan İçerikler</h2>
          <span className="text-xs opacity-65">{posts.length} içerik</span>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm opacity-70">{t("content.authorEmpty")}</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => {
              const dt = post.publishedAt ? new Date(post.publishedAt) : null;
              return (
                <li key={post.id} className="rounded-xl border border-nx-line bg-nx-surface p-4 transition hover:border-current/25">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <a href={`${lb}/${post.slug}`} className="text-base font-bold hover:underline">
                      {post.title}
                    </a>
                    {dt ? (
                      <time dateTime={dt.toISOString()} className="text-xs opacity-60">
                        {dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </time>
                    ) : null}
                  </div>
                  {post.tldr ? <p className="mt-1.5 text-sm leading-relaxed opacity-75">{post.tldr}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
