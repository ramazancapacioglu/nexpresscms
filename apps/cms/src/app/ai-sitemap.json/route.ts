import { NextResponse, type NextRequest } from "next/server";
import { getPublicSite, listPublicEntityLinks, listPublishedContents } from "@/lib/public-data";
import "@/plugins/register";
import { trackBotVisit } from "@/lib/bot-log";

export async function GET(request: NextRequest) {
  await trackBotVisit("ai-sitemap");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const contents = await listPublishedContents(siteId, "tr");
  const entityLinks = await listPublicEntityLinks(siteId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const payload = {
    version: "1.0",
    generator: "NexPress CMS Agentic Discovery Engine",
    siteId,
    siteName: site?.name ?? "NexPress CMS",
    siteProfile: site?.siteProfile ?? "corporate",
    siteDna: site?.siteDna,
    endpoints: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      webMcpRpc: `${baseUrl}/api/mcp`,
      markdownNegotiation: "?format=md or Accept: text/markdown",
    },
    items: contents.map((item) => {
      const publicUrl =
        item.slug === "ana-sayfa"
          ? `${baseUrl}/tr`
          : `${baseUrl}/tr/${item.slug}`;
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
