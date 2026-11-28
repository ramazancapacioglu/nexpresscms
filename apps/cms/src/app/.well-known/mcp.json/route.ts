import { NextResponse, type NextRequest } from "next/server";
import { resolvePublicSiteOrigin } from "@/lib/site-origin";

export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const baseUrl = await resolvePublicSiteOrigin(siteId);

  return NextResponse.json(
    {
      schemaVersion: "2025-03-26",
      name: "NexPress CMS WebMCP Gateway",
      siteId,
      transport: {
        type: "http-json-rpc",
        endpoint: `${baseUrl}/api/mcp`,
      },
      feeds: {
        llmsTxt: `${baseUrl}/llms.txt`,
        llmsFullTxt: `${baseUrl}/llms-full.txt`,
        aiSitemapJson: `${baseUrl}/ai-sitemap.json`,
      },
    },
    {
      status: 200,
      headers: { "X-NexPress-Site-Id": siteId },
    }
  );
}
