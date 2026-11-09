import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishing } from "@nexpress/core";
import { getScopedRepository, getUserRepository } from "@nexpress/database";
import { getThemeManifest } from "@nexpress/themes";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { authorSlug } from "@/lib/author-slug";
import { getPublicSite } from "@/lib/public-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const person = (await getUserRepository(siteId).list()).find((user) => authorSlug(user.name) === slug);
  return { title: person?.name ?? slug };
}

/** Yazarın yayınladığı yazılar. Parola veya sahte biyografi yoktur. */
export default async function AuthorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, users, contents] = await Promise.all([
    getPublicSite(siteId),
    getUserRepository(siteId).list(),
    getScopedRepository(siteId).listContents({ locale }),
  ]);
  const person = users.find((user) => authorSlug(user.name) === slug);
  if (!person) notFound();
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const posts = contents.filter((item) => {
    if (item.type !== "post" || item.status !== "published") return false;
    const pub = resolvePublishing(item.schemaAttributes);
    return item.authorName === person.name || pub.authorName === person.name;
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{t("content.authorArchive")}</p>
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{person.name}</h1>
      </header>
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
