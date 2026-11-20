"use server";

import { headers } from "next/headers";
import { contentPath, linkedHrefsOf, localeBase, resolvePublishing, resolveSiteSettings, suggestLinksForText, type LinkSuggestion } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";

/** Bağlantı önerilebilecek içerik türleri (şablon, form vb. değil). */
const LINKABLE_TYPES = new Set(["page", "post", "ai_prompt", "kb_tech", "campaign", "product"]);
const MAX_TEXT = 200_000;

/**
 * Editördeki metin için semantik iç bağlantı önerileri: yayındaki herkese açık sayfaların başlığı/odak anahtar kelimesi
 * metinde geçiyorsa "şunu şuraya bağlayın". Yalnızca önerir; bağlantıyı ekleyen editördür. Kendi sayfası ve zaten bağlı sayfalar önerilmez.
 */
export async function suggestLinksAction(input: { contentId?: string; markdown: string; locale?: string }): Promise<{ ok: true; suggestions: LinkSuggestion[] } | { ok: false; error: string }> {
  const me = await requireUser({ audit: "seo.linkSuggest" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = input.locale && site?.supportedLocales.includes(input.locale) ? input.locale : (site?.defaultLocale ?? "tr");
  const text = String(input.markdown ?? "").slice(0, MAX_TEXT);
  if (text.trim().length < 80) return { ok: true, suggestions: [] };
  const types = resolveSiteSettings(site?.settings).general.contentTypes;
  const base = localeBase(site, locale);
  const candidates = (await repo.listContents({ locale, status: "published" }))
    .filter((c) => LINKABLE_TYPES.has(c.type) && !c.noIndex && c.contentId !== input.contentId && c.slug !== "ana-sayfa" && resolvePublishing(c.schemaAttributes).visibility === "public")
    .map((c) => {
      const focus = resolvePublishing(c.schemaAttributes).focusKeyword;
      return { id: c.contentId, title: c.title, href: `${base}${contentPath(types, { type: c.type, slug: c.slug })}`, keywords: focus ? [focus] : [], importance: c.importanceScore };
    });
  return { ok: true, suggestions: suggestLinksForText(text, candidates, { linkedHrefs: linkedHrefsOf(text), limit: 8 }) };
}
