import type { Metadata } from "next";
import { headers } from "next/headers";
import { hasAuthorProfile, isAuthoredType, resolveLocalizedSiteIdentity, resolvePublishing } from "@nexpress/core";
import { buildPageSchemaGraph, jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, ResponsiveImage } from "@nexpress/themes";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { organizationFor } from "@/lib/organization-schema";
import { getPublicAuthors, getPublicSite, listPublishedContents } from "@/lib/public-data";
import { robotsMeta } from "@/lib/robots-meta";

const baseOf = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, authors] = await Promise.all([getPublicSite(siteId), getPublicAuthors(siteId)]);
  const lb = await siteLocaleBase(siteId, locale);
  const localized = resolveLocalizedSiteIdentity(site, locale);
  return {
    title: `Yazarlar & Uzman Ekibimiz${localized.name ? ` — ${localized.name}` : ""}`,
    description: `${localized.name || "Sitemiz"} bünyesindeki uzman yazarlar, teknik editörler ve yayın ekibi profilleri.`,
    alternates: { canonical: `${baseOf()}${lb}/yazar` },
    robots: robotsMeta(Object.keys(authors).length > 0),
  };
}

/** `/yazar`: tüm herkese açık yazarların ve kurumsal yayın ekibinin dizin sayfası (0-KB RSC). */
export default async function AuthorsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, authorsMap, contents] = await Promise.all([
    getPublicSite(siteId),
    getPublicAuthors(siteId),
    listPublishedContents(siteId, locale),
  ]);
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const localized = resolveLocalizedSiteIdentity(site, locale);
  const base = baseOf();
  const pageUrl = `${base}${lb}/yazar`;

  // Her yazarın yayındaki herkese açık yazı sayısını ve son yazı başlığını hesapla
  const postsByAuthor = new Map<string, Array<{ slug: string; title: string }>>();
  for (const item of contents) {
    if (!isAuthoredType(item.type) || item.noIndex) continue;
    const pub = resolvePublishing(item.schemaAttributes);
    const owner = (pub.authorName || item.authorName || "").trim();
    if (!owner) continue;
    const list = postsByAuthor.get(owner) ?? [];
    list.push({ slug: item.slug, title: item.title });
    postsByAuthor.set(owner, list);
  }

  const entries = Object.entries(authorsMap)
    .map(([slug, entry]) => {
      const posts = postsByAuthor.get(entry.name) ?? [];
      return { slug, ...entry, posts, hasProfile: hasAuthorProfile(entry.profile) };
    })
    .filter((a) => a.hasProfile || a.posts.length > 0)
    .sort((a, b) => {
      if (a.hasProfile !== b.hasProfile) return a.hasProfile ? -1 : 1;
      if (b.posts.length !== a.posts.length) return b.posts.length - a.posts.length;
      return a.name.localeCompare(b.name, locale);
    });

  const graph = await buildPageSchemaGraph({
    siteId,
    siteName: localized.name,
    siteUrl: base,
    locale,
    pageUrl,
    breadcrumbs: [
      { name: t("taxonomy.home"), url: `${base}${lb || "/"}` },
      { name: "Yazarlar", url: pageUrl },
    ],
    organization: organizationFor(localized.seo),
    content: {
      id: "authors:index",
      title: "Yazarlar & Uzman Ekibimiz",
      tldr: `${localized.name || "Sitemiz"} içeriklerini ve teknik rehberlerini hazırlayan uzman yazarlar ve yayın ekibi.`,
      schemaType: "CollectionPage",
    },
  });
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  const collectionNode = nodes.find((n) => n["@type"] === "CollectionPage");
  if (entries.length > 0) {
    const listId = `${pageUrl}#itemlist`;
    if (collectionNode) collectionNode.mainEntity = { "@id": listId };
    nodes.push({
      "@type": "ItemList",
      "@id": listId,
      name: "Yazarlar",
      numberOfItems: entries.length,
      itemListElement: entries.map((a, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${base}${lb}/yazar/${a.slug}`,
        name: a.name,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }} />

      <nav aria-label="Sayfa yolu" className="text-xs opacity-70">
        <a href={lb || "/"} className="hover:underline">
          {t("taxonomy.home")}
        </a>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span aria-current="page" className="font-medium">
          Yazarlar
        </span>
      </nav>

      <header className="space-y-2 border-b border-nx-line pb-5">
        <span
          style={{ color: tokens.colors.primary }}
          className="inline-block text-xs font-bold uppercase tracking-wider"
        >
          Uzman Kadro &amp; Editörler
        </span>
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">
          Yazarlar &amp; Uzman Ekibimiz
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed opacity-80">
          Teknik rehberlerimizi, kurulum dokümantasyonlarımızı ve sektörel analizlerimizi hazırlayan uzman yazarlarımızı ve yayın ekibimizi inceleyin.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm opacity-75">Henüz yayınlanmış yazar profili bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {entries.map((author) => {
            const p = author.profile;
            const isOrg = p.authorType === "Organization";
            const initials = author.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("");

            return (
              <article
                key={author.slug}
                style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                className="flex flex-col justify-between gap-4 border bg-nx-surface p-6 shadow-xs transition hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {p.avatarUrl ? (
                      <ResponsiveImage
                        src={p.avatarUrl}
                        alt={author.name}
                        sizes="64px"
                        className="h-16 w-16 shrink-0 rounded-2xl border border-nx-line object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 12%, transparent)`,
                          color: tokens.colors.primary,
                        }}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-nx-line text-lg font-extrabold"
                      >
                        {initials || "?"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-nx-line bg-nx-subtle px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
                          {isOrg ? "Kurumsal Ekip" : "Uzman Yazar"}
                        </span>
                        <span
                          style={{ color: tokens.colors.primary }}
                          className="text-[11px] font-semibold"
                        >
                          {author.posts.length} içerik
                        </span>
                      </div>
                      <h2 className="text-lg font-bold tracking-tight">
                        <a href={`${lb}/yazar/${author.slug}`} className="hover:underline">
                          {author.name}
                        </a>
                      </h2>
                      {p.jobTitle ? <p className="text-xs font-medium opacity-75">{p.jobTitle}</p> : null}
                    </div>
                  </div>

                  {p.bio ? <p className="line-clamp-3 text-sm leading-relaxed opacity-85">{p.bio}</p> : null}

                  {p.expertise.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5 text-[11px]">
                      {p.expertise.slice(0, 4).map((item) => (
                        <li key={item} className="rounded-full border border-nx-line bg-nx-subtle px-2.5 py-0.5 font-medium">
                          {item}
                        </li>
                      ))}
                      {p.expertise.length > 4 ? (
                        <li className="rounded-full border border-nx-line px-2 py-0.5 opacity-70">
                          +{p.expertise.length - 4}
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-nx-line pt-3.5 text-xs">
                  <span className="opacity-65">
                    {p.sameAs.length > 0 ? `${p.sameAs.length} doğrulanmış profil` : "Yazar arşivi"}
                  </span>
                  <a
                    href={`${lb}/yazar/${author.slug}`}
                    style={{ color: tokens.colors.primary }}
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>Profili ve Yazıları Gör</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
