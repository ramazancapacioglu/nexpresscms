import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteSettings } from "@nexpress/core";
import { generateCoreLlmsTxt } from "@nexpress/seo-core";
import { getPublicSite, listPublishedContents } from "@/lib/public-data";
import "@/plugins/register";
import { trackBotVisit } from "@/lib/bot-log";

export async function GET(request: NextRequest) {
  await trackBotVisit("llms");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  if (resolveSiteSettings(site?.settings).seo.enableLlmsTxt === false) {
    return new NextResponse("llms.txt kapalı.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const contents = await listPublishedContents(siteId, "tr");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const txt = await generateCoreLlmsTxt({
    siteId,
    siteName: site?.name ?? "NexPress CMS",
    tagline: site?.tagline,
    siteDna: site?.siteDna,
    baseUrl,
    locale: "tr",
    items: contents.map((c) => ({
      title: c.title,
      url: `${baseUrl}/tr/${c.slug === "ana-sayfa" ? "" : c.slug}`.replace(/\/$/, ""),
      type: c.type,
      tldr: c.tldr,
      importanceScore: c.importanceScore,
    })),
  });

  return new NextResponse(txt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-NexPress-Site-Id": siteId,
    },
  });
}
