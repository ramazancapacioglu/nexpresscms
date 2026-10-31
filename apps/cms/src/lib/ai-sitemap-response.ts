import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { listPublicEntityLinks, listPublishedContents } from "./public-data";
import { contentUrl, requestLocale } from "./request-locale";
import "@/plugins/register";
import { trackBotVisit } from "./bot-log";

/** `/ai-sitemap.json` (varsayılan/Accept-Language dili) ve `/{locale}/ai-sitemap.json` (belirli dil). */
export async function aiSitemapResponse(request: NextRequest, forcedLocale?: string) {
  await trackBotVisit("ai-sitemap");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const { site, locale, supported } = await requestLocale(request, siteId, forcedLocale);
  const contents = await listPublishedContents(siteId, locale);
  const entityLinks = await listPublicEntityLinks(siteId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const payload = {
    version: "1.0",
    generator: "NexPress CMS Agentic Discovery Engine",
    siteId,
    locale,
    locales: supported,
    siteName: site?.name ?? "NexPress CMS",
    siteProfile: site?.siteProfile ?? "corporate",
    siteDna: site?.siteDna,
    localeEndpoints: Object.fromEntries(
      supported.map((l) => [l, { aiSitemap: `${baseUrl}/${l}/ai-sitemap.json`, llmsTxt: `${baseUrl}/${l}/llms.txt`, llmsFullTxt: `${baseUrl}/${l}/llms-full.txt` }])
    ),
    endpoints: {
      llmsTxt: `${baseUrl}/${locale}/llms.txt`,
      llmsFullTxt: `${baseUrl}/${locale}/llms-full.txt`,
      webMcpRpc: `${baseUrl}/api/mcp`,
      markdownNegotiation: "?format=md or Accept: text/markdown",
    },
    items: contents.map((item) => {
      const publicUrl = contentUrl(baseUrl, locale, item.slug);
      return {
        id: item.id,
        title: item.title,
        url: publicUrl,
        markdownUrl: `${publicUrl}?format=md`,
        type: item.type,
        schemaType: item.schemaType,
        entityId: `${publicUrl}#${item.schemaType.toLowerCase()}`,
        importanceScore: item.importanceScore,
        seoScore: item.seoScore,
        tldr: item.tldr,
        updatedAt: item.updatedAt,
      };
    }),
    entityGraphLinks: entityLinks,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "X-NexPress-Site-Id": siteId,
    },
  });
}
