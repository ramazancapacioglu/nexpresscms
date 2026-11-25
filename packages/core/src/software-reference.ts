/**
 * Katalog/teklif içindeki yazılım göndermesi. Google `SoftwareApplication` zengin sonucu için `offers` (fiyat + para birimi)
 * zorunludur: fiyat + (kategori veya işletim sistemi) varsa geçerli `SoftwareApplication`, yoksa geçerli `Thing` göndermesi yazılır.
 */
export function softwareReference(item: { name: string; url: string; description?: string; applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string }): Record<string, unknown> {
  const offers = item.price ? { "@type": "Offer", price: String(item.price).replace(",", "."), priceCurrency: item.currency || "TRY" } : undefined;
  const validSoftware = Boolean(offers) && Boolean(item.applicationCategory || item.operatingSystem);
  return {
    "@type": validSoftware ? "SoftwareApplication" : "Thing",
    "@id": `${item.url}#${validSoftware ? "softwareapplication" : "entity"}`,
    name: item.name,
    url: item.url,
    ...(item.description ? { description: item.description } : {}),
    ...(validSoftware ? { ...(item.applicationCategory ? { applicationCategory: normalizeAppCategory(item.applicationCategory) } : {}), ...(item.operatingSystem ? { operatingSystem: item.operatingSystem } : {}), offers } : {}),
  };
}


/** İçeriğin kayıtlı yazılım bilgisi (zengin şema `software` kartı, `software_product_card` bloğu ya da düz şema alanları). */
export function softwareFactsOf(
  attrs: Record<string, unknown> | null | undefined,
  blocks?: Array<{ type?: string; props?: Record<string, unknown> }> | null
): { applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string } {
  const a = attrs ?? {};
  const rich = ((a.richSchema as Record<string, unknown> | undefined)?.software ?? (a.richSchema as Record<string, Record<string, unknown>> | undefined)?.rich?.software ?? {}) as Record<string, unknown>;
  const card = Array.isArray(blocks) ? blocks.find((b) => b?.type === "software_product_card")?.props ?? {} : {};
  const str = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" && value > 0 ? String(value) : undefined);
  const applicationCategory = normalizeAppCategory(str(card.category) ?? str(rich.category) ?? str(a.applicationCategory));
  const operatingSystem = str(card.operatingSystem) ?? str(rich.os) ?? str(a.operatingSystem);
  const cardPrice = (card.pricingMode === "fixed" || card.pricingMode === "starting") ? str(card.price) : undefined;
  const price = cardPrice ?? str(rich.price);
  const currency = str(card.currency) ?? str(rich.currency);
  return { ...(applicationCategory ? { applicationCategory } : {}), ...(operatingSystem ? { operatingSystem } : {}), ...(price ? { price, ...(currency ? { currency } : {}) } : {}) };
}

/** Google'ın desteklediği `applicationCategory` değerleri (SoftwareApplication belgesi). */
export const GOOGLE_APP_CATEGORIES = [
  "GameApplication", "SocialNetworkingApplication", "TravelApplication", "ShoppingApplication", "SportsApplication", "LifestyleApplication",
  "BusinessApplication", "DesignApplication", "DeveloperApplication", "DriverApplication", "EducationalApplication", "HealthApplication",
  "FinanceApplication", "SecurityApplication", "BrowserApplication", "CommunicationApplication", "DesktopEnhancementApplication",
  "EntertainmentApplication", "MultimediaApplication", "HomeApplication", "UtilitiesApplication", "ReferenceApplication",
] as const;

/** Desteklenen değer aynen döner; destek dışı ya da serbest metin en yakın desteklenen değere (muhasebe/finans → Finance, aksi halde Business) çevrilir. */
export function normalizeAppCategory(value: string | undefined | null): string | undefined {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const exact = GOOGLE_APP_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  return /finance|financ|accounting|muhasebe|fatura/i.test(raw) ? "FinanceApplication" : "BusinessApplication";
}
