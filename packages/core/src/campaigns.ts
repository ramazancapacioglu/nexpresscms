/**
 * Gelişmiş Kampanya & Fırsat Veri Modeli ve Şema Üreticisi (@nexpress/core)
 *
 * WordPress / ACO uyumlu meta alanlarını (`camp_*`) ve modern alanları (`discount`, `gift`, `terms` vb.)
 * birleştirir; Schema.org Offer ve ItemList JSON-LD şemaları üretir.
 */

export interface CampaignFields {
  /** İndirim oranı veya tutarı (örn: "%35 İndirim", "5.000 TL İndirim") */
  discount?: string;
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

  if (campaign.startDate) {
    offer.validFrom = campaign.startDate;
  }

  if (campaign.endDate) {
    offer.validThrough = campaign.endDate;
    offer.availabilityEnds = campaign.endDate;
  }

  if (campaign.productName) {
    const isProduct = campaign.productUrl?.includes("/urun") || campaign.productUrl?.includes("/product");
    const itemOffered: Record<string, unknown> = {
      "@type": isProduct ? "Product" : "SoftwareApplication",
      name: campaign.productName,
    };
    if (campaign.productUrl) {
      itemOffered.url = campaign.productUrl.startsWith("http")
        ? campaign.productUrl
        : `${siteUrl.replace(/\/$/, "")}/${campaign.productUrl.replace(/^\//, "")}`;
    }
    offer.itemOffered = itemOffered;
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

