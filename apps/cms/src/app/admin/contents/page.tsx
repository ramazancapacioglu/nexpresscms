import React from "react";
import { headers } from "next/headers";
import { findContentType, PluginSlot, resolveSiteSettings, type ContentType } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { DualModeEditorClient } from "@/components/admin/dual-mode-editor-client";

export const dynamic = "force-dynamic";

export default async function AdminContentsEditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; type?: string; new?: string; locale?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const siteLocales = site?.supportedLocales ?? [defaultLocale];
  const locale = sp.locale && siteLocales.includes(sp.locale) ? sp.locale : defaultLocale;
  const isTemplate = sp.type === "template";
  const [contents, taxonomies, mediaAssets] = await Promise.all([
    // Şablonlar yalnızca şablon düzenlenirken listelenir (genel listelerde görünmez)
    repo.listContents(isTemplate ? { locale, type: "template" } : { locale }),
    repo.listTaxonomies(),
    repo.listMediaAssets(),
  ]);

  // Çeviri düzenlerken kaynağı da listeden bulunabilsin: seçili içeriğin dil durumu
  const translations = sp.id ? await repo.translationOverview(sp.id) : [];

  const customDef = findContentType(resolveSiteSettings(site?.settings).general.contentTypes, sp.type);
  const requestedType: ContentType = customDef
    ? customDef.id
    : sp.type === "post" || sp.type === "kb_tech" || sp.type === "ai_prompt" || sp.type === "campaign" || sp.type === "template"
      ? (sp.type as ContentType)
      : "page";

  // Performans: Sadece aktif düzenlenen belgenin blokları aktarılır; diğer belgelerin AST ve markdown yükü kesilir.
  const targetId = sp.id ?? (contents.find((c) => c.type === requestedType)?.contentId ?? contents[0]?.contentId);
  const optimizedContents = contents.map((c) => {
    if (c.contentId === targetId) return c;
    return {
      ...c,
      blocks: [],
      markdownCache: "",
    };
  });

  return (
    <DualModeEditorClient
      key={`${sp.new ?? "0"}:${sp.id ?? ""}:${requestedType}:${locale}`}
      initialContents={optimizedContents}
      initialTaxonomies={taxonomies}
      initialMediaAssets={mediaAssets}
      siteId={siteId}
      locale={locale}
      defaultLocale={defaultLocale}
      siteLocales={siteLocales}
      translations={translations}
      initialSelectedId={sp.id}
      initialContextType={requestedType}
      customTypes={resolveSiteSettings(site?.settings).general.contentTypes}
      customType={customDef ?? findContentType(resolveSiteSettings(site?.settings).general.contentTypes, contents.find((c) => c.contentId === sp.id)?.type)}
      startNew={sp.new === "1"}
      siteTokens={site?.designTokens}
      inspectorSlot={
        <PluginSlot
          name="editor.sidebar.tabs"
          siteId={siteId}
          context={{ contentId: sp.id }}
          fallback={
            <div className="border-t border-[#E6E7EA] dark:border-[#23262E] pt-3 space-y-1.5 text-[11px]">
              <div className="font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
                Co-Pilot Slot (editor.sidebar.tabs)
              </div>
              <p className="text-[#5C5F66] dark:text-[#9CA3AF] leading-relaxed">
                <code>@nexpress-pro/agentic-seo</code> (İçerik operasyonları) aktif edildiğinde pgvector Kanibalizasyon Denetimi ve Guardrail Kalkanı bu çekmeceye bağlanır.
              </p>
            </div>
          }
        />
      }
    />
  );
}
