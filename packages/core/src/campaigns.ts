/**
 * Gelişmiş Kampanya & Fırsat Veri Modeli ve Şema Üreticisi (@nexpress/core)
 *
 * WordPress / ACO uyumlu meta alanlarını (`camp_*`) ve modern alanları (`discount`, `gift`, `terms` vb.)
 * birleştirir; Schema.org Offer ve ItemList JSON-LD şemaları üretir.
 */

import { softwareReference } from "./software-reference";

export interface CampaignFields {
  /** İndirim oranı veya tutarı (örn: "%35 İndirim", "5.000 TL İndirim") */
  discount?: string;
  /** Kampanya fiyatı (örn: "12.500", "12500,00"). Doluysa Offer şemasına `price` olarak yazılır; boşsa hiç yazılmaz (uydurma fiyat yok). */
  price?: string;
  /** Para birimi (ISO 4217, varsayılan `TRY`) */
  priceCurrency?: string;
  /** Hediye ürün / bonus modül (örn: "1 Yıllık QR Menü + Kurulum Hediyesi") */
  gift?: string;
  /** Hedef ürün / yazılım adı (örn: "Wolvox ERP Restoran Programı") */
  productName?: string;
  /** Hedef ürün / yazılım URL'si (örn: "/wolvox-restoran") */
  productUrl?: string;
  /** İlişkili e-ticaret / katalog ürün ID'si */
  catalogProductId?: string;
  /** Vurgu rozeti (örn: "Yıl Sonu Fırsatı", "Sınırlı Kontenjan", "Özel Paket") */
  badge?: string;
  /** Başlangıç tarihi (YYYY-MM-DD) */
  startDate?: string;
  /** Bitiş tarihi (YYYY-MM-DD) */
  endDate?: string;
  /** Kampanya şartları ve katılım kuralları */
  terms?: string;
  /** Madde madde şartlar listesi */
  termsList?: string[];
  /** Hedef kitle (örn: "Yeni Lisans Alımları", "Mevcut Kullanıcılar") */
  targetAudience?: string;
  /** Eylem butonu metni (örn: "Hemen Teklif Al & Başvur") */
  ctaText?: string;
  /** Eylem butonu URL'si (örn: "/demo-talebi", "/iletisim") */
  ctaUrl?: string;
  /** Destek / İletişim telefonu (örn: "0 (232) 555 00 00") */
  contactPhone?: string;
  /** WhatsApp destek hattı (örn: "905551112233") */
  contactWhatsapp?: string;
  /** Kampanya afişi görsel URL */
  featuredImageUrl?: string;
  /** Afiş görseli alt metni */
  featuredImageAlt?: string;
  /** Süresiz / Kesintisiz kampanya bayrağı */
  isPerpetual?: boolean;
}

export interface ResolvedCampaign extends CampaignFields {
  id: string;
  contentId: string;
  title: string;
  slug: string;
  tldr: string;
  status: "published" | "draft" | "scheduled";
  isExpired: boolean;
  daysRemaining: number | null;
  formattedValidity: string;
  updatedAt?: string;
}

/**
 * Serbest yazılmış fiyatı schema.org `price` biçimine (nokta ondalıklı, binlik ayracı yok) çevirir; fiyat değilse `undefined`.
 * "12.500" → "12500", "12.500,50 TL" → "12500.50", "12,5" → "12.5", "1 250" → "1250", "%35" → undefined.
 */
export function normalizeOfferPrice(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const text = raw.trim();
  if (text.includes("%")) return undefined;
  let digits = text.replace(/[^\d.,]/g, "");
  if (!/\d/.test(digits)) return undefined;
  const lastComma = digits.lastIndexOf(",");
  const lastDot = digits.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // Son ayraç ondalıktır: "12.500,50" (tr) ya da "12,500.50" (en)
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    digits = digits.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? "," : ".";
    const parts = digits.split(sep);
    // Birden çok ayraç ya da son grup 3 hane ise binlik ayracıdır ("12.500"); aksi halde ondalık ("12,5")
    if (parts.length > 2 || (parts[1] ?? "").length === 3) digits = parts.join("");
    else digits = `${parts[0]}.${parts[1]}`;
  }
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return String(n);
}

function normalizeCurrency(raw: string | undefined): string | undefined {
  const code = raw?.trim().toUpperCase();
  return code && /^[A-Z]{3}$/.test(code) ? code : undefined;
}

/**
 * Ham içerik nesnesinden kampanya alanlarını ayıklar ve normalize eder.
 * Hem modern camelCase alanları hem de eski `camp_*` anahtarlarını şeffafça destekler.
 */
export function resolveCampaignData(input: {
  id?: string;
  contentId?: string;
  title?: string;
  slug?: string;
  tldr?: string | null;
  status?: string;
  featuredImage?: string | null;
  updatedAt?: Date | string | null;
  schemaAttributes?: Record<string, unknown> | null;
}, referenceDate = new Date()): ResolvedCampaign {
  const attrs = (input.schemaAttributes ?? {}) as Record<string, unknown>;
  const camp = (attrs.campaign ?? {}) as Record<string, unknown>;
  const richOffer = ((attrs.richSchema as Record<string, unknown> | undefined)?.offer ?? {}) as Record<string, unknown>;

  const str = (v: unknown): string | undefined => {
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    if (typeof v === "number") return String(v);
    return undefined;
  };

  const discount = str(camp.discount) ?? str(attrs.discount) ?? str(attrs.camp_discount) ?? str(richOffer.discount);
  const price = normalizeOfferPrice(str(camp.price) ?? str(attrs.price) ?? str(richOffer.price));
  const priceCurrency = normalizeCurrency(str(camp.priceCurrency) ?? str(attrs.priceCurrency) ?? str(richOffer.priceCurrency));
  const gift = str(camp.gift) ?? str(attrs.gift) ?? str(attrs.camp_gift);
  const productName = str(camp.productName) ?? str(attrs.productName) ?? str(attrs.camp_product_name);
  const productUrl = str(camp.productUrl) ?? str(attrs.productUrl) ?? str(attrs.camp_product_url);
  const catalogProductId = str(camp.catalogProductId) ?? str(attrs.catalogProductId) ?? str(attrs.aco_wp_product_id);
  const badge = str(camp.badge) ?? str(attrs.badge);
  const startDate = str(camp.startDate) ?? str(attrs.startDate) ?? str(attrs.camp_start) ?? str(richOffer.validFrom);
  const endDate = str(camp.endDate) ?? str(attrs.endDate) ?? str(attrs.camp_end) ?? str(richOffer.validThrough);
  const terms = str(camp.terms) ?? str(attrs.terms) ?? str(attrs.camp_terms) ?? str(richOffer.terms);
  const targetAudience = str(camp.targetAudience) ?? str(attrs.targetAudience);
  const ctaText = str(camp.ctaText) ?? str(attrs.ctaText) ?? "Hemen Teklif Al & Başvur";
  const ctaUrl = str(camp.ctaUrl) ?? str(attrs.ctaUrl) ?? "/iletisim";
  const contactPhone = str(camp.contactPhone) ?? str(attrs.contactPhone);
  const contactWhatsapp = str(camp.contactWhatsapp) ?? str(attrs.contactWhatsapp);
  const featuredImageUrl = str(camp.featuredImageUrl) ?? str(attrs.featuredImageUrl) ?? (typeof input.featuredImage === "string" ? input.featuredImage : undefined);
  const featuredImageAlt = str(camp.featuredImageAlt) ?? str(attrs.featuredImageAlt) ?? input.title;
  const isPerpetual = Boolean(camp.isPerpetual ?? attrs.isPerpetual ?? (!endDate && !startDate));

  // Madde madde şartları ayıkla (satır başlarına veya noktalı virgüllere göre)
  let termsList: string[] | undefined = undefined;
  if (Array.isArray(camp.termsList)) {
    termsList = camp.termsList.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  } else if (terms) {
    termsList = terms
      .split(/\r?\n|•|- |\*/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);
  }

  // Geçerlilik ve Kalan Gün Hesabı
  const todayStr = referenceDate.toISOString().slice(0, 10);
  let isExpired = false;
  let daysRemaining: number | null = null;

  if (endDate && !isPerpetual) {
    if (endDate < todayStr) {
      isExpired = true;
      daysRemaining = 0;
    } else {
      const endMs = new Date(`${endDate}T23:59:59Z`).getTime();
      const nowMs = referenceDate.getTime();
      const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, diffDays);
    }
  }

  // Tarih gösterim formatı
  const formatDateTr = (dStr?: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  let formattedValidity = "Süresiz Fırsat";
  if (startDate && endDate) {
    formattedValidity = `${formatDateTr(startDate)} – ${formatDateTr(endDate)}`;
  } else if (endDate) {
    formattedValidity = `Son Gün: ${formatDateTr(endDate)}`;
  } else if (startDate) {
    formattedValidity = `${formatDateTr(startDate)} İtibarıyla`;
  }

  const rawStatus = input.status ?? "published";
  const status = rawStatus === "draft" || rawStatus === "scheduled" ? rawStatus : "published";

  return {
    id: input.id ?? input.contentId ?? "",
    contentId: input.contentId ?? input.id ?? "",
    title: input.title ?? "Kampanya",
    slug: input.slug ?? "",
    tldr: input.tldr ?? str(attrs.camp_detail) ?? "",
    status,
    discount,
    gift,
    productName,
    productUrl,
    catalogProductId,
    badge,
    startDate,
    endDate,
    terms,
    termsList,
    targetAudience,
    ctaText,
    ctaUrl,
    contactPhone,
    contactWhatsapp,
    featuredImageUrl,
    featuredImageAlt,
    isPerpetual,
    ...(price ? { price, priceCurrency: priceCurrency ?? "TRY" } : {}),
    isExpired,
    daysRemaining,
    formattedValidity,
    updatedAt: input.updatedAt ? new Date(input.updatedAt).toISOString() : undefined,
  };
}

/**
 * Tekil kampanya için Google Schema.org Offer JSON-LD düğümü üretir.
 */
export function buildCampaignOfferJsonLd(
  campaign: ResolvedCampaign,
  options: {
    siteUrl: string;
    pageUrl: string;
    siteName: string;
    /** İlgili ürün sayfasının yazılım bilgisi (varsa): ürün göndermesi geçerli `SoftwareApplication` olur. */
    product?: { applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string };
  }
): Record<string, unknown> {
  const { siteUrl, pageUrl, siteName } = options;

  const descParts = [
    campaign.discount ? `${campaign.discount} indirim.` : "",
    campaign.gift ? `Hediye: ${campaign.gift}.` : "",
    campaign.productName ? `Geçerli ürün: ${campaign.productName}.` : "",
    campaign.tldr || "",
  ].filter(Boolean);

  const description = descParts.join(" ").trim() || campaign.title;

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    "@id": `${pageUrl}#offer`,
    name: campaign.title,
    url: pageUrl,
    availability: campaign.isExpired
      ? "https://schema.org/Discontinued"
      : "https://schema.org/InStock",
    description,
    seller: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };

  // Fiyat yalnızca editörde girildiyse yazılır; kampanya yüzdelik indirimse Offer fiyatsız kalır (Kural 9: uydurma veri yok)
  if (campaign.price) {
    offer.price = campaign.price;
    offer.priceCurrency = campaign.priceCurrency ?? "TRY";
  }

  if (campaign.startDate) {
    offer.validFrom = campaign.startDate;
  }

  if (campaign.endDate) {
    offer.validThrough = campaign.endDate;
    offer.availabilityEnds = campaign.endDate;
  }

  if (campaign.productName) {
    const isProduct = campaign.productUrl?.includes("/urun") || campaign.productUrl?.includes("/product");
    const productUrl = campaign.productUrl
      ? campaign.productUrl.startsWith("http")
        ? campaign.productUrl
        : `${siteUrl.replace(/\/$/, "")}/${campaign.productUrl.replace(/^\//, "")}`
      : undefined;
    if (isProduct) {
      offer.itemOffered = { "@type": "Product", name: campaign.productName, ...(productUrl ? { url: productUrl } : {}) };
    } else if (productUrl) {
      // Eksik özellikli `SoftwareApplication` Google'da kritik hata üretir: bilgi yoksa türsüz gönderme yazılır
      offer.itemOffered = softwareReference({ name: campaign.productName, url: productUrl, ...(options.product ?? {}) });
    } else {
      offer.itemOffered = { name: campaign.productName };
    }
  }

  return offer;
}

/**
 * Kampanyalar arşiv sayfası (`/kampanyalar`) için Google Schema.org ItemList JSON-LD üretir.
 */
export function buildCampaignsItemListJsonLd(
  campaigns: ResolvedCampaign[],
  options: {
    archiveUrl: string;
    siteUrl: string;
    name?: string;
    /** Dilin kök adresi (`/tr`); tek dilli sitede boş string. Varsayılan `/tr`. */
    localeBase?: string;
  }
): Record<string, unknown> {
  const { archiveUrl, siteUrl, name = "Aktif Kampanyalar ve Fırsatlar", localeBase = "/tr" } = options;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${archiveUrl}#campaigns-list`,
    name,
    url: archiveUrl,
    numberOfItems: campaigns.length,
    itemListElement: campaigns.map((camp, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: camp.title,
      url: `${siteUrl.replace(/\/$/, "")}${localeBase}/kampanya/${camp.slug}`,
      ...(camp.discount ? { description: `${camp.discount} - ${camp.tldr || camp.title}` } : {}),
    })),
  };
}

