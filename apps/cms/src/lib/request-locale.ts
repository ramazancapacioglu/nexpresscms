import "server-only";
import type { NextRequest } from "next/server";
import { pickLocale } from "@nexpress/core";
import { getPublicSite } from "./public-data";

/** Uç noktanın dili: `?locale=` etkin diller içindeyse o, değilse sitenin varsayılan dili. */
export async function requestLocale(request: NextRequest, siteId: string, forced?: string) {
  const site = await getPublicSite(siteId);
  const defaultLocale = site?.defaultLocale ?? "tr";
  const supported = site?.supportedLocales ?? [defaultLocale];
  const locale = pickLocale(forced ?? request.nextUrl.searchParams.get("locale"), supported, defaultLocale);
  return { site, locale, defaultLocale, supported };
}

/** Bir içeriğin dil bağlı adresi (ana sayfa kök adres). */
export const contentUrl = (baseUrl: string, locale: string, slug: string) =>
  `${baseUrl.replace(/\/$/, "")}/${locale}${slug === "ana-sayfa" ? "" : `/${slug}`}`;
