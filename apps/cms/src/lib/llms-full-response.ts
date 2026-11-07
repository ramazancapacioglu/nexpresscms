import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { isPluginModuleEnabled, localeBase } from "@nexpress/core";
import { generateCoreLlmsTxt } from "@nexpress/seo-core";
import { listPublishedContents } from "./public-data";
import { requestLocale } from "./request-locale";
import "@/plugins/register";
import { trackBotVisit } from "./bot-log";

/** `/llms-full.txt` ve `/{locale}/llms-full.txt`: seçili dilin tam bilgi bankası. */
export async function llmsFullResponse(request: NextRequest, forcedLocale?: string) {
  await trackBotVisit("llms");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  if (!(await isPluginModuleEnabled(siteId, "@nexpress-pro/agentic-seo", "llms-full"))) {
    return new NextResponse("llms-full.txt kapalı.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const { site, locale } = await requestLocale(request, siteId, forcedLocale);
  const contents = await listPublishedContents(siteId, locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const baseTxt = await generateCoreLlmsTxt({
    siteId,
    siteName: `${site?.name ?? "NexPress CMS"} — 4-Katmanlı Tam Bilgi Bankosu (/llms-full.txt)`,
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

  const fullCorpusAppendix = contents
    .map(
      (c) =>
        `\n================================================================================\n### [${c.type.toUpperCase()} • Önem: ${c.importanceScore}/10] ${c.title}\nURL: ${baseUrl}/${locale}/${c.slug}\nSchema: @${c.schemaType}\n================================================================================\n\n${c.markdownCache}`
    )
    .join("\n");

  return new NextResponse(baseTxt + "\n" + fullCorpusAppendix, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-NexPress-Site-Id": siteId,
      "X-NexPress-Feed": "4-Tier-LLMS-Full",
    },
  });
}
