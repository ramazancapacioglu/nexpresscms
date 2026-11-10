import { filterDynamicItems, normalizeDynamicQuery } from "@nexpress/core";
import type { DesignTokens } from "@nexpress/core";
import { DynamicListView } from "@nexpress/themes";
import { getDynamicCandidates } from "@/lib/dynamic-content";

/** WordPress yazı sayfası: sayfanın kendi gövdesi yerine yayınlanmış yazılar. */
export async function PostsIndex({
  siteId,
  locale,
  title,
  tokens,
}: {
  siteId: string;
  locale: string;
  title: string;
  tokens: DesignTokens;
}) {
  const query = normalizeDynamicQuery({
    source: "posts",
    limit: 12,
    orderBy: "newest",
    layout: "cards",
    columns: 3,
    showImage: true,
    showExcerpt: true,
    showDate: true,
    heading: "",
    emptyText: "Yayınlanmış yazı yok.",
  });
  const items = filterDynamicItems(await getDynamicCandidates(siteId, locale), query).slice(0, query.limit);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 style={{ fontFamily: tokens.typography.headingFont }} className="mb-8 text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <DynamicListView query={query} items={items} tokens={tokens} locale={locale} />
    </div>
  );
}
