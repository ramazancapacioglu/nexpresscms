import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteSettings, localeBase } from "@nexpress/core";
import { generateCoreLlmsTxt } from "@nexpress/seo-core";
import { listPublishedContents } from "./public-data";
import { requestLocale } from "./request-locale";
import "@/plugins/register";
import { trackBotVisit } from "./bot-log";

export async function llmsTxtResponse(request: NextRequest, forcedLocale?: string) {
  await trackBotVisit("llms");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const { site, locale, supported } = await requestLocale(request, siteId, forcedLocale);
  if (resolveSiteSettings(site?.settings).seo.enableLlmsTxt === false) {
    return new NextResponse("llms.txt kapalı.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const contents = await listPublishedContents(siteId, locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const txt = await generateCoreLlmsTxt({
    siteId,
    siteName: site?.name ?? "NexPress CMS",
    tagline: site?.tagline,
    siteDna: site?.siteDna,
    baseUrl,
    locale,
    items: contents.map((c) => ({
      title: c.title,
      url: `${baseUrl}${localeBase(site, locale)}/${c.slug === "ana-sayfa" ? "" : c.slug}`.replace(/\/$/, ""),
      type: c.type,
      tldr: c.tldr,
      importanceScore: c.importanceScore,
    })),
  });

  // Çok dillide: diğer dillerin dizinleri
  const others = supported.filter((l) => l !== locale);
  const body = others.length ? `${txt}\n\n## Languages\n${others.map((l) => `- ${l}: ${baseUrl.replace(/\/$/, "")}/${l}/llms.txt`).join("\n")}\n` : txt;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-NexPress-Site-Id": siteId,
    },
  });
}
