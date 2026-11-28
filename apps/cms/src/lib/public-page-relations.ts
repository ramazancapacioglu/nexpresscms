import "server-only";
import { rankRelated, resolvePublishing, selectPublicFamily } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { listPublishedContentSummaries } from "./public-data";

export interface PageRelationsInput {
  siteId: string;
  locale: string;
  baseUrl: string;
  lb: string;
  pageUrl: string;
  postsPageSlug: string;
  homeLabel: string;
  blogLabel: string;
  content: {
    id: string;
    type: string;
    title: string;
    slug: string;
  };
  categories: string[];
  tags: string[];
  parentId?: string;
  pillar?: boolean;
}

/**
 * Ziyaretçi içerik sayfasının kırıntı (`crumbs`), üst/alt sayfa (`parent`/`children`),
 * önceki/sonraki yazı ve ilgili içerik listelerini tek önbellekli gövdesiz özet havuzundan hesaplar.
 */
export async function resolvePublicPageRelations(input: PageRelationsInput) {
  const { siteId, locale, baseUrl, lb, pageUrl, postsPageSlug, homeLabel, blogLabel, content, categories, tags, parentId, pillar } = input;
  const needsSummaries = Boolean(
    parentId ||
    pillar ||
    content.type === "post" ||
    content.type === "page" ||
    content.type === "ai_prompt"
  );
  const [publicSummaries, taxonomyRows] = await Promise.all([
    needsSummaries ? listPublishedContentSummaries(siteId, locale) : Promise.resolve([]),
    content.type === "post" ? getScopedRepository(siteId).listTaxonomies() : Promise.resolve([]),
  ]);

  const { parent, children } = selectPublicFamily(publicSummaries, content.id, { parentId, pillar });
  const termName = (kind: "category" | "tag", slug: string) =>
    taxonomyRows.find((row) => row.taxonomyType === kind && row.slug === slug)?.name ?? slug;

  const crumbs = [
    { name: homeLabel, url: `${baseUrl}${lb || "/"}` },
    ...(content.type === "post"
      ? [
          { name: blogLabel, url: `${baseUrl}${lb}/${postsPageSlug || "blog"}` },
          ...(categories[0] ? [{ name: termName("category", categories[0]), url: `${baseUrl}${lb}/kategori/${categories[0]}` }] : []),
        ]
      : []),
    ...(parent ? [{ name: parent.title, url: `${baseUrl}${lb}/${parent.slug}` }] : []),
    { name: content.title, url: pageUrl },
  ];

  const peers =
    content.type === "post"
      ? publicSummaries
          .filter((row) => row.type === "post")
          .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
      : [];
  const asPeer = (row: (typeof peers)[number]) => ({
    slug: row.slug,
    title: row.title,
    image: row.featuredImage ?? null,
    date: row.publishedAt ? new Date(row.publishedAt) : null,
  });
  const peerAt = peers.findIndex((row) => row.id === content.id);
  const prevPost = peerAt >= 0 && peers[peerAt + 1] ? asPeer(peers[peerAt + 1]!) : null;
  const nextPost = peerAt > 0 && peers[peerAt - 1] ? asPeer(peers[peerAt - 1]!) : null;

  const asCandidate = <R extends { id: string; title: string; schemaAttributes: Record<string, unknown> | null }>(row: R) => {
    const pub = resolvePublishing(row.schemaAttributes);
    return { row, id: row.id, title: row.title, categories: pub.categories, tags: pub.tags };
  };
  const me = { id: content.id, title: content.title, categories, tags };
  const relatedPosts = rankRelated(me, peers.map(asCandidate), 3, 0).map((c) => asPeer(c.row));
  const relatedLinks =
    content.type === "page" || content.type === "post" || content.type === "ai_prompt"
      ? rankRelated(
          me,
          publicSummaries
            .filter((row) => (row.type === "page" || (content.type !== "post" && row.type === "post")) && row.slug !== "ana-sayfa")
            .map(asCandidate),
          6
        ).map((c) => ({ slug: c.row.slug, title: c.row.title, image: c.row.featuredImage ?? null, tldr: c.row.tldr ?? null }))
      : [];

  return { parent, children, crumbs, termName, prevPost, nextPost, relatedPosts, relatedLinks };
}
