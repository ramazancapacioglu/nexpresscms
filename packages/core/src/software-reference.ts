/**
 * Katalog/teklif içindeki yazılım göndermesi. Google `SoftwareApplication` için kategori, işletim sistemi, teklif ve puandan en az ikisini ister:
 * bilgi varsa tam tür, yoksa türsüz (`@id` + ad + adres) yazılır; eksik özellikli tür kritik hata üretir.
 */
export function softwareReference(item: { name: string; url: string; description?: string; applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string }): Record<string, unknown> {
  const offers = item.price ? { "@type": "Offer", price: String(item.price).replace(",", "."), priceCurrency: item.currency || "TRY" } : undefined;
  const known = [item.applicationCategory, item.operatingSystem, offers].filter(Boolean).length;
  return {
    ...(known >= 2 ? { "@type": "SoftwareApplication" } : {}),
    "@id": `${item.url}#softwareapplication`,
    name: item.name,
    url: item.url,
    ...(item.description ? { description: item.description } : {}),
    ...(known >= 2 ? { ...(item.applicationCategory ? { applicationCategory: normalizeAppCategory(item.applicationCategory) } : {}), ...(item.operatingSystem ? { operatingSystem: item.operatingSystem } : {}), ...(offers ? { offers } : {}) } : {}),
  };
}


/** İçeriğin kayıtlı yazılım bilgisi (zengin şema `software` kartı ya da düz şema alanları): kategori, işletim sistemi, fiyat. */
export function softwareFactsOf(attrs: Record<string, unknown> | null | undefined): { applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string } {
  const a = attrs ?? {};
  const rich = ((a.richSchema as Record<string, unknown> | undefined)?.software ?? (a.richSchema as Record<string, Record<string, unknown>> | undefined)?.rich?.software ?? {}) as Record<string, unknown>;
  const str = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : undefined);
  const applicationCategory = normalizeAppCategory(str(rich.category) ?? str(a.applicationCategory));
  const operatingSystem = str(rich.os) ?? str(a.operatingSystem);
  const price = str(rich.price);
  const currency = str(rich.currency);
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
