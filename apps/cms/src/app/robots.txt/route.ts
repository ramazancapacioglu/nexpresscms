import { NextResponse, type NextRequest } from "next/server";
import { buildRobotsTxt, cmsHooks, resolveSiteSettings } from "@nexpress/core";
import "@/plugins/register";

import { getPublicSite } from "@/lib/public-data";
import { trackBotVisit } from "@/lib/bot-log";

export async function GET(request: NextRequest) {
  await trackBotVisit("robots");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const seo = resolveSiteSettings(site?.settings).seo;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const hooked = await cmsHooks.runFilter("robots:buildTxt", { siteId, groupLines: [], botPolicy: seo.botPolicy ?? {} });
  const body = buildRobotsTxt({ baseUrl: base, botPolicy: seo.botPolicy, extra: seo.robotsTxtExtra, groupLines: hooked.groupLines });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-NexPress-Site-Id": siteId,
    },
  });
}
