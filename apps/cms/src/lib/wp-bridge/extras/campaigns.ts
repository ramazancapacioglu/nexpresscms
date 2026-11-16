import "server-only";
import { getRedirectRepository, getScopedRepository } from "@nexpress/database";
import { parseCampaignText } from "@nexpress/wp-importer";

/**
 * "Kampanya" kategorisindeki yazılar kampanya türüne çevrilir (`/kampanyalar` arşivi, `/kampanya/<adres>` sayfası, Offer şeması).
 * İndirim ve geçerlilik tarihi başlık ve açıklamadan okunur; bulunamayan alan boş kalır (uydurma değer yazılmaz).
 * Yayın durumu korunur: taslak kampanya taslak kalır. Eski kök adres kalıcı olarak yeni adrese yönlenir.
 */
export async function importCampaigns(siteId: string, categoryPattern = /kampanya/i): Promise<{ converted: number; withDiscount: number; withDates: number; redirects: number }> {
  const repo = getScopedRepository(siteId);
  const redirects = getRedirectRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const rows = await repo.listContents({ locale });
  let converted = 0;
  let withDiscount = 0;
  let withDates = 0;
  let redirectCount = 0;
  for (const row of rows) {
    if (row.type !== "post" && row.type !== "campaign") continue;
    const attrs = (row.schemaAttributes ?? {}) as Record<string, unknown>;
    const categories = ((attrs._publishing as { categories?: unknown } | undefined)?.categories ?? []) as unknown[];
    if (!categories.some((slug) => typeof slug === "string" && categoryPattern.test(slug))) continue;
    const parsed = parseCampaignText(`${row.title}. ${row.metaDescription ?? ""}. ${row.tldr ?? ""}`);
    const previous = (attrs.campaign ?? {}) as Record<string, unknown>;
    const campaign = {
      ...previous,
      ...(parsed.discount && !previous.discount ? { discount: parsed.discount } : {}),
      ...(parsed.startDate && !previous.startDate ? { startDate: parsed.startDate } : {}),
      ...(parsed.endDate && !previous.endDate ? { endDate: parsed.endDate } : {}),
      ctaText: previous.ctaText ?? "Teklif Al",
      ctaUrl: previous.ctaUrl ?? "/akinsoft-demo-talebi",
    };
    await repo.saveContent({
      contentId: row.id,
      type: "campaign",
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: { ...attrs, campaign },
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: row.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    converted += 1;
    if (campaign.discount) withDiscount += 1;
    if (campaign.startDate || campaign.endDate) withDates += 1;
    if (row.status === "published" && (await redirects.save({ fromPath: `/${row.slug}`, toPath: `/kampanya/${row.slug}`, code: 301, note: "Kampanya adresi" })).ok) redirectCount += 1;
  }
  return { converted, withDiscount, withDates, redirects: redirectCount };
}
