import { getPluginSettings, resolvePublishing, type DesignSiteContext } from "@nexpress/core";
import { getFormDefinitionRepository } from "./form-definition-repository";
import { getScopedRepository } from "./repository";

/**
 * AI tasarımın "site bilgisi": var olan herkese açık sayfalar, medya, aktif formlar ve marka alanları.
 * Hem üretim (komuta eklenir) hem kayıt anındaki yeniden doğrulama aynı bağlamı kullanır; modele site dışı veri verilmez.
 */
export async function loadDesignSiteContext(siteId: string): Promise<DesignSiteContext> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [contents, media, forms, brand] = await Promise.all([
    repo.listContents({ locale, status: "published" }),
    repo.listMediaAssets(),
    getFormDefinitionRepository(siteId).list(),
    getPluginSettings(siteId, "@nexpress-pro/agentic-seo"),
  ]);
  const publicContents = contents.filter((c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public");
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return {
    siteName: site?.name,
    tagline: site?.tagline ?? undefined,
    locale,
    sector: str(brand.brandSector),
    audience: str(brand.brandAudience),
    tone: str(brand.aiTone),
    positioning: str(brand.brandPositioning),
    siteDna: site?.siteDna ?? undefined,
    knownPaths: [`/${locale}`, ...publicContents.map((c) => `/${locale}/${c.slug}`)],
    media: media.slice(0, 40).map((m) => ({ id: m.id, alt: m.altText })),
    forms: forms.filter((f) => f.status === "active").map((f) => ({ id: f.id, name: f.name })),
  };
}
