import { NextResponse, type NextRequest } from "next/server";
import { sitemapWantsHtml } from "@nexpress/seo-core";

/** Paylaşılan önbellek tabloyu arama motoruna vermesin diye yanıt özel tutulur. */
export function sitemapWantsHtmlFrom(request: NextRequest): boolean {
  return sitemapWantsHtml({
    userAgent: request.headers.get("user-agent"),
    secFetchDest: request.headers.get("sec-fetch-dest"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
  });
}

export function sitemapHttpResponse(body: string, html: boolean, siteId: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": html ? "text/html; charset=utf-8" : "application/xml; charset=utf-8",
      "Cache-Control": "private, no-cache",
      Vary: "User-Agent, Sec-Fetch-Dest, Sec-Fetch-Mode",
      "X-NexPress-Site-Id": siteId,
      ...(html ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
