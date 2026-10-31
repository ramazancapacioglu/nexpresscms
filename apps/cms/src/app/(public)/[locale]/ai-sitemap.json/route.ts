import type { NextRequest } from "next/server";
import { aiSitemapResponse } from "@/lib/ai-sitemap-response";

/** `/{locale}/ai-sitemap.json`: dil başına yapay zeka site haritası. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return aiSitemapResponse(request, locale);
}
