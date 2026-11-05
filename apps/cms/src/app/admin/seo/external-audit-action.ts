"use server";

import { headers } from "next/headers";
import { auditLinks, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdmin } from "@/lib/auth/session";
import { probeExternalLinks, type ExternalLinkResult } from "@/lib/external-link-check";

/** Yayındaki içeriklerin dış bağlantılarını yoklar. Adres listesi istemciden alınmaz. */
export async function auditExternalLinksAction(): Promise<ExternalLinkResult[]> {
  await requireAdmin("seo.external_links");
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locales = site?.supportedLocales?.length ? site.supportedLocales : ["tr"];
  const lists = await Promise.all(locales.map((locale) => repo.listContents({ locale, status: "published" })));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = auditLinks(
    lists.flat().map((content) => ({
      id: content.contentId,
      title: content.title,
      slug: content.slug,
      locale: content.locale,
      markdown: content.markdownCache,
      slugHistory: resolvePublishing(content.schemaAttributes).slugHistory,
    })),
    { baseUrl, locales },
  );
  return probeExternalLinks(result.external.map((item) => item.url));
}
