import { flattenBlocks } from "./block-tree";
import type { BlockNode } from "./types";

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

export interface StructuredProductPricing {
  name: string;
  sku?: string;
  version?: string;
  pricingMode: string;
  currency: string;
  vatNote?: string;
  price: number | null;
  listPrice: number | null;
  priceLabel?: string;
  priceValidUntil?: string;
  lastVerified?: string;
  priceList: Array<{
    name: string;
    code?: string;
    group?: string;
    listPrice: number | null;
    campaignPrice: number | null;
    note?: string;
  }>;
  packages: Array<{
    name: string;
    badge?: string;
    listPrice?: string;
    price?: string;
    period?: string;
  }>;
}

const optNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  const cleaned = String(v).trim().replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  const norm =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "")
      : cleaned.includes(",")
        ? cleaned.replace(",", ".")
        : cleaned;
  const n = Number(norm);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * Bir içeriğin blok ağacındaki `software_product_card` bloklarından AI ajanları (WebMCP) için
 * doğrulanmış, halüsinasyonsuz yapısal fiyat ve paket bilgisini çıkarır.
 */
export function extractProductPricingFromBlocks(blocks: BlockNode[]): StructuredProductPricing[] {
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const out: StructuredProductPricing[] = [];
  for (const { block } of flattenBlocks(blocks)) {
    if (block.type !== "software_product_card") continue;
    const p = block.props ?? {};
    const name = s(p.name);
    if (!name) continue;
    const currency = (s(p.currency) ?? "TRY").toUpperCase();
    const pricingMode = s(p.pricingMode) ?? "quote";
    const priceList = Array.isArray(p.priceList)
      ? p.priceList
          .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
          .map((r) => ({
            name: s(r.name) ?? "",
            ...(s(r.code) ? { code: s(r.code) } : {}),
            ...(s(r.group) ? { group: s(r.group) } : {}),
            listPrice: optNum(r.listPrice),
            campaignPrice: optNum(r.campaignPrice),
            ...(s(r.note) ? { note: s(r.note) } : {}),
          }))
          .filter((r) => r.name.length > 0)
      : [];
    const packages = Array.isArray(p.packages)
      ? p.packages
          .filter((pk): pk is Record<string, unknown> => Boolean(pk && typeof pk === "object"))
          .map((pk) => ({
            name: s(pk.name) ?? "",
            ...(s(pk.badge) ? { badge: s(pk.badge) } : {}),
            ...(s(pk.listPrice) ? { listPrice: s(pk.listPrice) } : {}),
            ...(s(pk.price) ? { price: s(pk.price) } : {}),
            ...(s(pk.period) ? { period: s(pk.period) } : {}),
          }))
          .filter((pk) => pk.name.length > 0)
      : [];
    out.push({
      name,
      ...(s(p.sku) ? { sku: s(p.sku) } : {}),
      ...(s(p.version) ? { version: s(p.version) } : {}),
      pricingMode,
      currency,
      ...(s(p.vatNote) ? { vatNote: s(p.vatNote) } : {}),
      price: optNum(p.price),
      listPrice: optNum(p.listPrice),
      ...(s(p.priceLabel) ? { priceLabel: s(p.priceLabel) } : {}),
      ...(s(p.priceValidUntil) ? { priceValidUntil: s(p.priceValidUntil) } : {}),
      ...(s(p.lastVerified) ? { lastVerified: s(p.lastVerified) } : {}),
      priceList,
      packages,
    });
  }
  return out;
}
