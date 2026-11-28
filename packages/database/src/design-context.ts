import { cmsHooks, resolvePublishing, type DesignSiteContext } from "@nexpress/core";
import { getFormDefinitionRepository } from "./form-definition-repository";
import { getScopedRepository } from "./repository";

/**
 * AI tasarımın "site bilgisi": var olan herkese açık sayfalar, medya, aktif formlar ve marka alanları.
 * Hem üretim (komuta eklenir) hem kayıt anındaki yeniden doğrulama aynı bağlamı kullanır; modele site dışı veri verilmez.
 * Open-Core sınırı: çekirdek paket doğrudan Pro eklenti kimliği okumaz; marka bağlamı `cmsHooks` (`design:brandContext`)
 * filtresiyle eklentiler tarafından zenginleştirilebilir.
 */
export async function loadDesignSiteContext(siteId: string): Promise<DesignSiteContext> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [contents, media, forms] = await Promise.all([
    repo.listContentSummaries({ locale, status: "published" }),
    repo.listMediaAssets(),
    getFormDefinitionRepository(siteId).list(),
  ]);
  const publicContents = contents.filter((c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public");
  const baseBrand = ((site as unknown as { brandVoice?: Record<string, unknown> } | null)?.brandVoice ?? {}) as Record<string, unknown>;
  const hooked = await cmsHooks.runFilter("design:brandContext", { siteId, brand: { ...baseBrand } });
  const brand = hooked.brand ?? baseBrand;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return {
    siteName: site?.name,
    tagline: site?.tagline ?? undefined,
    locale,
    sector: str(brand.brandSector ?? brand.sector),
    audience: str(brand.brandAudience ?? brand.audience),
    tone: str(brand.aiTone ?? brand.tone),
    positioning: str(brand.brandPositioning ?? brand.positioning),
    siteDna: site?.siteDna ?? undefined,
    knownPaths: [`/${locale}`, ...publicContents.map((c) => `/${locale}/${c.slug}`)],
    media: media.slice(0, 40).map((m) => ({ id: m.id, alt: m.altText })),
    forms: forms.filter((f) => f.status === "active").map((f) => ({ id: f.id, name: f.name })),
  };
}
