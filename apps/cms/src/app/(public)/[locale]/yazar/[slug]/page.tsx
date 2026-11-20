import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasAuthorProfile, resolveLocalizedSiteIdentity, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { buildAuthorPerson, buildPageSchemaGraph, jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, ResponsiveImage } from "@nexpress/themes";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { authorSlug } from "@/lib/author-slug";
import { organizationFor } from "@/lib/organization-schema";
import { getPublicAuthors, getPublicSite } from "@/lib/public-data";

const baseOf = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const person = (await getPublicAuthors(siteId))[slug];
  if (!person) return { title: slug, robots: { index: false, follow: true } };
  const lb = await siteLocaleBase(siteId, locale);
  const description = person.profile.bio || (person.profile.jobTitle ? `${person.name}, ${person.profile.jobTitle}` : undefined);
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
  const [site, authors, contents] = await Promise.all([getPublicSite(siteId), getPublicAuthors(siteId), getScopedRepository(siteId).listContents({ locale })]);
  const person = authors[slug];
  if (!person) notFound();
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const posts = contents.filter((item) => {
    if (item.type !== "post" || item.status !== "published") return false;
    const pub = resolvePublishing(item.schemaAttributes);
    return item.authorName === person.name || pub.authorName === person.name;
  });
  const profile = person.profile;
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
  const personNode = buildAuthorPerson({ baseUrl: base, orgId: `${base}/#organization`, name: person.name, url: pageUrl, profile: hasAuthorProfile(profile) ? profile : undefined });
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  const page = nodes.find((n) => n["@type"] === "ProfilePage");
  if (page) page.mainEntity = { "@id": `${pageUrl}#person` };
  nodes.push({ ...personNode, mainEntityOfPage: { "@id": `${pageUrl}#profilepage` } } as never);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }} />
      <header className="flex items-start gap-4">
        {profile.avatarUrl ? (
          <ResponsiveImage src={profile.avatarUrl} alt={person.name} priority sizes="96px" className="h-24 w-24 shrink-0 rounded-full object-cover" />
        ) : null}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{t("content.authorArchive")}</p>
          <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{person.name}</h1>
          {profile.jobTitle ? <p className="text-base opacity-80">{profile.jobTitle}</p> : null}
        </div>
      </header>
      {profile.bio ? <p className="text-sm leading-relaxed opacity-85">{profile.bio}</p> : null}
      {profile.expertise.length > 0 ? (
        <section aria-label={t("content.authorExpertise")} className="space-y-2">
          <h2 className="text-sm font-bold">{t("content.authorExpertise")}</h2>
          <ul className="flex flex-wrap gap-2 text-xs">
            {profile.expertise.map((item) => (
              <li key={item} className="rounded-full border border-nx-line bg-nx-subtle px-3 py-1">{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {profile.sameAs.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label={t("content.authorProfileLinks")}>
          {profile.sameAs.map((url) => (
            <li key={url}>
              <a href={url} rel="me noopener" target="_blank" className="hover:underline">{new URL(url).hostname.replace(/^www\./, "")}</a>
            </li>
          ))}
        </ul>
      ) : null}
      {posts.length === 0 ? <p className="text-sm opacity-70">{t("content.authorEmpty")}</p> : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-nx-line pb-3">
              <a href={`${lb}/${post.slug}`} className="text-lg font-semibold hover:underline">{post.title}</a>
              {post.tldr ? <p className="mt-1 text-sm opacity-75">{post.tldr}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
