import { cmsHooks, friendlyImagePath, normalizeAppCategory, softwareFactsOf, softwareReference, type BlockNode, type SchemaGraphNode } from "@nexpress/core";

export { softwareFactsOf, softwareReference };
import { buildBreadcrumbNode, deriveAutoSchemaNodes, plainFaqText } from "./engine";

export * from "./engine";
export * from "./feed";
export * from "./schema-validate";
export * from "./commerce-schema";
export * from "./search-console";
export * from "./analytics-integrations";

/** `Person` düğümü için yazar profili alanları (hepsi isteğe bağlı). */
export interface AuthorPersonProfile {
  jobTitle?: string;
  bio?: string;
  expertise?: string[];
  sameAs?: string[];
  avatarUrl?: string;
}

/**
 * Yazar `Person` düğümü: ad, sayfa adresi, ünvan, biyografi (`description`), uzmanlık (`knowsAbout`), `sameAs`, avatar ve kuruluşa bağ (`worksFor`).
 * Yalnızca dolu alanlar yazılır; `@id` yazar sayfası adresine bağlıdır (makale ve profil sayfası aynı düğümü paylaşır).
 */
export function buildAuthorPerson(input: { baseUrl: string; orgId: string; name: string; url?: string; profile?: AuthorPersonProfile }): SchemaGraphNode {
  const { baseUrl, orgId, name, profile } = input;
  const url = input.url ? (input.url.startsWith("/") ? `${baseUrl}${input.url}` : input.url) : undefined;
  return {
    "@type": "Person",
    ...(url ? { "@id": `${url}#person`, url } : {}),
    name,
    ...(profile?.jobTitle ? { jobTitle: profile.jobTitle } : {}),
    ...(profile?.bio ? { description: profile.bio } : {}),
    ...(profile?.expertise && profile.expertise.length > 0 ? { knowsAbout: profile.expertise } : {}),
    ...(profile?.sameAs && profile.sameAs.length > 0 ? { sameAs: profile.sameAs } : {}),
    ...(profile?.avatarUrl ? { image: imageObject(baseUrl, { url: profile.avatarUrl, alt: name, caption: name }) } : {}),
    ...(profile && Object.keys(profile).length > 0 ? { worksFor: { "@id": orgId } } : {}),
  };
}

/** Sayfadaki bir görselin şema bilgisi (medya kitaplığından: alt, başlık, açıklama, boyut). */
export interface SchemaImageInput {
  url: string;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  /** Kitaplıktaki dosya adı: görsel adresi anlamlı ad taşır (`/media/<kimlik>/<ad>.webp`) */
  filename?: string | null;
}

export interface BuildCoreSchemaInput {
  siteId: string;
  siteName: string;
  siteUrl: string;
  locale: string;
  pageUrl: string;
  content?: {
    id: string;
    title: string;
    tldr?: string | null;
    schemaType: string;
    schemaAttributes?: Record<string, unknown>;
    authorName?: string;
    /** Yazar sayfası adresi (mutlak ya da göreli): Article `author.url`. */
    authorUrl?: string;
    /** Yazar profili (ünvan, biyografi, uzmanlık, sameAs, avatar): doluysa `Person` bu bilgilerle zenginleşir. */
    authorProfile?: AuthorPersonProfile;
    updatedAt?: Date;
    publishedAt?: Date | null;
    blocks?: BlockNode[];
    imageUrl?: string | null;
    imageAlt?: string | null;
    /** Öne çıkan görselin medya bilgisi (varsa): `ImageObject` genişlik/yükseklik/açıklama alır. */
    imageMeta?: Omit<SchemaImageInput, "url"> | null;
    keywords?: string[];
    articleSection?: string;
    /** Özel alanlardan ve şema kurallarından gelen Schema.org özellikleri; temel alanları ezmez. */
    extraProps?: Record<string, unknown>;
  };
  /** Motor ayarları: bloklardan otomatik FAQPage/HowTo/Review üret. */
  autoSchema?: boolean;
  organization?: {
    name?: string;
    logo?: string;
    sameAs?: string[];
    /** Yerel işletme alanları; `@type` dizisi `LocalBusiness` içerebilir. */
    schema?: Record<string, unknown>;
    /** Verilirse sayfa görsellerine yaratıcı/kredi/telif/lisans yazılır (Google görsel meta verisi). `licenseUrl` boşsa site kökü. */
    imageRights?: { licenseUrl?: string };
  };
  breadcrumbs?: Array<{ name: string; url: string }>;
  /** Gövde görselleri (en çok 12): sayfa varlığına `associatedMedia` (yazılımda `screenshot`) olarak işlenir. */
  images?: SchemaImageInput[];
  /** Site içi arama adres şablonu (`https://x.test/ara?q={search_term_string}`): WebSite `SearchAction`. */
  searchUrlTemplate?: string;
  /** Ana sayfada kuruluşun ürün/hizmet kataloğu (`hasOfferCatalog`). */
  offerCatalog?: Array<{ name: string; url: string; description?: string; applicationCategory?: string; operatingSystem?: string; price?: string; currency?: string }>;
  aggregateRating?: { ratingValue: number; reviewCount: number };
}

/** Kuruluş düğümüne yerel işletme alanları: temel kimlik alanlarını ezmez, `@type` Organization ile birleşir. */
function organizationExtras(schema: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!schema) return {};
  const { "@type": rawType, ...rest } = schema;
  const types = (Array.isArray(rawType) ? rawType : rawType ? [rawType] : []).filter((type): type is string => typeof type === "string");
  const merged = [...new Set([...types.filter((type) => type !== "Organization"), "Organization"])];
  const entries = Object.entries(rest).filter(([key]) => !ORG_OWN_KEYS.has(key));
  const employees = rest.numberOfEmployees as { value?: unknown } | undefined;
  const numeric = employees && typeof employees === "object" && typeof employees.value === "string" && /^\d+$/.test(employees.value) ? { ...employees, value: Number(employees.value) } : undefined;
  return { ...Object.fromEntries(entries), ...(numeric ? { numberOfEmployees: numeric } : {}), ...(merged.length > 1 ? { "@type": merged } : {}) };
}

/** Kuruluş düğümünün kendi ürettiği alanlar; kullanıcı eki bunları ezmez (açıklama ve görsel serbesttir). */
const ORG_OWN_KEYS = new Set(["name", "url", "logo", "sameAs", "@id"]);

const WEBPAGE_FAMILY = new Set(["WebPage", "AboutPage", "ContactPage", "CollectionPage", "ItemPage", "ProfilePage", "SearchResultsPage", "FAQPage", "QAPage"]);

const normName = (value: string | undefined | null): string => (value ?? "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

/** Görsel hakları (Google görsel meta verisi): yaratıcı, kredi, telif bildirimi, lisans ve lisans edinme sayfası. */
function imageRightsFor(orgName: string, baseUrl: string, pageUrl: string, licenseUrl: string | undefined, now: Date = new Date()): Record<string, unknown> {
  return {
    creator: { "@type": "Organization", name: orgName },
    creditText: orgName,
    copyrightNotice: `© ${now.getFullYear()} ${orgName}`,
    license: licenseUrl || `${baseUrl}/`,
    acquireLicensePage: pageUrl,
  };
}

/** Tek görsel için `ImageObject`: `contentUrl` (sorgu parametresiz özgün adres), ad, açıklama, boyut. */
function imageObject(baseUrl: string, image: SchemaImageInput, id?: string, extra?: Record<string, unknown>): SchemaGraphNode {
  const given = image.url.startsWith("/") ? `${baseUrl}${image.url}` : image.url;
  // Yerel medya: yönlendirme veren `/media/<kimlik>` değil, doğrudan dosya adresi (`/media/<kimlik>/1280.webp`, site haritasındakiyle aynı).
  // Google görseli sayfadaki/sitemap'teki gerçek dosya adresiyle eşler; boyut 1280 px üst sınırıyla ölçeklenir.
  const mediaId = /\/media\/(med_[A-Za-z0-9_-]+)/.exec(given)?.[1];
  const abs = mediaId ? `${baseUrl}${friendlyImagePath(mediaId, image.filename)}` : given;
  const scale = mediaId && image.width && image.height && image.width > 1280 ? 1280 / image.width : 1;
  const width = image.width ? Math.round(image.width * scale) : undefined;
  const height = image.height ? Math.round(image.height * scale) : undefined;
  const name = image.title?.trim() || image.alt?.trim() || "";
  const caption = image.caption?.trim() || image.alt?.trim() || "";
  return {
    "@type": "ImageObject",
    ...(id ? { "@id": id } : {}),
    url: abs,
    contentUrl: abs,
    ...(name ? { name } : {}),
    ...(caption ? { caption } : {}),
    ...(image.alt?.trim() && image.alt.trim() !== caption ? { description: image.alt.trim() } : {}),
    ...(width && height ? { width, height } : {}),
    ...(mediaId ? { encodingFormat: "image/webp" } : image.mime ? { encodingFormat: image.mime } : {}),
    ...(extra ?? {}),
  };
}

/** Özel alan özellikleri: `@` ile başlayanlar ve temel varlık alanları atılır; ilkel değerler ve izinli yapısal alanlar (`about`, `mentions`, `speakable`, `brand`) geçer. */
const RESERVED_NODE_KEYS = new Set(["name", "headline", "description", "url", "inLanguage", "isPartOf", "publisher", "author", "datePublished", "dateModified", "mainEntityOfPage", "image", "aggregateRating", "sameAs"]);
const STRUCTURED_EXTRA_KEYS = new Set(["about", "mentions", "speakable", "brand"]);
function safeExtraProps(extra: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!extra) return {};
  return Object.fromEntries(
    Object.entries(extra).filter(([k, v]) => {
      if (!/^[a-z][A-Za-z]{1,40}$/.test(k) || RESERVED_NODE_KEYS.has(k)) return false;
      if (["string", "number", "boolean"].includes(typeof v)) return true;
      return STRUCTURED_EXTRA_KEYS.has(k) && v !== null && typeof v === "object";
    })
  );
}

/**
 * Çekirdek Schema.org JSON-LD Grafiği üretir ve `seo:buildSchemaGraph` kancasını tetikler.
 * Motor; Organization, WebSite, sayfa varlığı, BreadcrumbList, AggregateRating ve blok kaynaklı
 * FAQPage/HowTo/Review/VideoObject düğümlerini otomatik üretir.
 * Pro eklentiler (`@nexpress-pro/agentic-seo`) bu kancaya bağlanarak `@id` Entity bağlantılarını zenginleştirir.
 */
export async function buildPageSchemaGraph(
  input: BuildCoreSchemaInput
): Promise<{ "@context": "https://schema.org"; "@graph": SchemaGraphNode[] }> {
  const baseUrl = input.siteUrl.replace(/\/$/, "");
  // Kök adres `https://x.test#webpage` değil `https://x.test/#webpage` olmalı (tutarlı @id)
  if (input.pageUrl.replace(/\/$/, "") === baseUrl) input = { ...input, pageUrl: `${baseUrl}/` };
  const orgId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;

  const orgDisplayName = input.organization?.name || input.siteName;
  const rights = input.organization?.imageRights ? imageRightsFor(orgDisplayName, baseUrl, input.pageUrl, input.organization.imageRights.licenseUrl) : undefined;

  const baseNodes: SchemaGraphNode[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: input.organization?.name || input.siteName,
      url: baseUrl,
      ...(input.organization?.logo ? { logo: imageObject(baseUrl, { url: input.organization.logo, caption: input.organization?.name || input.siteName }, `${baseUrl}/#logo`) } : {}),
      ...(input.organization?.sameAs && input.organization.sameAs.length > 0
        ? { sameAs: input.organization.sameAs }
        : {}),
      ...organizationExtras(input.organization?.schema),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: baseUrl,
      name: input.siteName,
      inLanguage: input.locale,
      publisher: { "@id": orgId },
    },
  ];

  // LocalBusiness için görsel şart: açıkça verilmediyse logo; telefon/e-posta varsa iletişim noktası
  const orgNode = baseNodes[0]!;
  if (input.organization?.logo && !orgNode.image) orgNode.image = { "@id": `${baseUrl}/#logo` };
  const orgPhone = typeof orgNode.telephone === "string" ? orgNode.telephone : "";
  const orgMail = typeof orgNode.email === "string" ? orgNode.email : "";
  if ((orgPhone || orgMail) && !orgNode.contactPoint) {
    orgNode.contactPoint = [{ "@type": "ContactPoint", contactType: "customer support", ...(orgPhone ? { telephone: orgPhone } : {}), ...(orgMail ? { email: orgMail } : {}), ...(Array.isArray(orgNode.availableLanguage) ? { availableLanguage: orgNode.availableLanguage } : {}) }];
  }
  if (input.offerCatalog && input.offerCatalog.length > 0 && !orgNode.hasOfferCatalog) {
    orgNode.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${input.organization?.name || input.siteName} ürün ve hizmetleri`,
      itemListElement: input.offerCatalog.slice(0, 40).map((item) => ({ "@type": "Offer", itemOffered: softwareReference(item) })),
    };
  }
  if (input.searchUrlTemplate) {
    baseNodes[1]!.potentialAction = { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: input.searchUrlTemplate }, "query-input": "required name=search_term_string" };
  }

  if (input.content) {
    const c = input.content;
    const entityId = `${input.pageUrl}#${c.schemaType.toLowerCase()}`;
    const isArticle = /Article|BlogPosting|NewsArticle|TechArticle/i.test(c.schemaType);
    // Editör/CMS iç alanları (yayın ayarları, SEO ayarları, slug geçmişi, zengin şema girdisi, tuval bayrağı) JSON-LD'ye sızmaz
    const INTERNAL_ATTRS = new Set(["publishing", "seo", "slugHistory", "richSchema", "canvas"]);
    // İçe aktarma izleri (`wpId`, `wpKind`, `migratedFrom`…) Schema.org özelliği değildir; JSON-LD'ye sızmaz
    const IMPORT_TRACE = /^(wp[A-Z]|wp_|migrated|import(ed)?[A-Z_]|source(Id|Url|System)$)/;
    const cleanAttrs = Object.fromEntries(
      Object.entries((c.schemaAttributes ?? {}) as Record<string, unknown>).filter(([k]) => !k.startsWith("_") && !INTERNAL_ATTRS.has(k) && !IMPORT_TRACE.test(k))
    );
    if (typeof cleanAttrs.applicationCategory === "string") cleanAttrs.applicationCategory = normalizeAppCategory(cleanAttrs.applicationCategory) ?? cleanAttrs.applicationCategory;
    const entity: SchemaGraphNode = {
      "@type": c.schemaType || "WebPage",
      "@id": entityId,
      headline: c.title,
      name: c.title,
      description: c.tldr ?? c.title,
      url: input.pageUrl,
      inLanguage: input.locale,
      isPartOf: { "@id": websiteId },
      publisher: { "@id": orgId },
      ...(c.publishedAt ? { datePublished: new Date(c.publishedAt).toISOString() } : {}),
      ...(c.updatedAt ? { dateModified: new Date(c.updatedAt).toISOString() } : {}),
      ...(isArticle
        ? {
            // Yazar adı yoksa uydurma kişi yazılmaz: yayıncı kuruluş yazar sayılır
            // Yazar adı kuruluşun adıyla aynıysa kişi değil kuruluştur (ör. "Akınsoft İzmir Ana Bayi" Person olmaz)
            author:
              c.authorName?.trim() && ![normName(input.siteName), normName(input.organization?.name)].includes(normName(c.authorName))
                ? buildAuthorPerson({ baseUrl, orgId, name: c.authorName.trim(), url: c.authorUrl, profile: c.authorProfile })
                : { "@type": "Organization", "@id": orgId, name: orgDisplayName, url: baseUrl },
          }
        : {}),
      ...(c.imageUrl && !c.imageUrl.startsWith("data:")
        ? { image: imageObject(baseUrl, { ...(c.imageMeta ?? {}), url: c.imageUrl, alt: c.imageMeta?.alt || c.imageAlt || c.title }, `${input.pageUrl}#primaryimage`, rights) }
        : {}),
      ...(c.keywords && c.keywords.length > 0 ? { keywords: c.keywords.join(", ") } : {}),
      ...(c.articleSection ? { articleSection: c.articleSection } : {}),
      ...(input.aggregateRating && input.aggregateRating.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: input.aggregateRating.ratingValue,
              reviewCount: input.aggregateRating.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      ...safeExtraProps(c.extraProps),
      ...cleanAttrs,
    };
    baseNodes.push(entity);

    // Gelişmiş Şema (richSchema) düğümleri
    const rich = ((c.schemaAttributes as Record<string, unknown> | undefined)?.richSchema as Record<string, any> | undefined)?.rich ??
      ((c.schemaAttributes as Record<string, unknown> | undefined)?.richSchema as Record<string, any> | undefined) ?? {};
    if (rich.software && (c.schemaType === "SoftwareApplication" || c.schemaType === "Product" || c.schemaType === "WebPage")) {
      const sw = rich.software;
      const softwareNode: SchemaGraphNode = {
        "@type": "SoftwareApplication",
        "@id": `${input.pageUrl}#software`,
        name: sw.name || c.title,
        ...(sw.alternateName ? { alternateName: sw.alternateName } : {}),
        operatingSystem: sw.os || "Windows, Web",
        applicationCategory: normalizeAppCategory(sw.category) || "BusinessApplication",
        ...(sw.subCategory ? { applicationSubCategory: sw.subCategory } : {}),
        ...(sw.version ? { softwareVersion: sw.version } : {}),
        ...(sw.requirements ? { memoryRequirements: sw.requirements } : {}),
        ...(sw.ratingValue ? { aggregateRating: { "@type": "AggregateRating", ratingValue: sw.ratingValue, reviewCount: sw.ratingCount || 1, bestRating: 5, worstRating: 1 } } : {}),
        ...(sw.price ? { offers: { "@type": "Offer", price: String(sw.price).replace(",", "."), priceCurrency: sw.currency || "TRY", url: input.pageUrl, availability: "https://schema.org/InStock", seller: { "@id": orgId } } } : {}),
        ...(typeof sw.features === "string" && sw.features.trim()
          ? { featureList: sw.features.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean).slice(0, 20) }
          : {}),
      };
      // Sayfanın ana varlığı zaten SoftwareApplication ise ikinci bir düğüm eklenmez: alanlar ana varlığa işlenir (yinelenen varlık yok)
      if (c.schemaType === "SoftwareApplication") {
        const { "@id": _id, "@type": _type, name: _name, ...fields } = softwareNode;
        Object.assign(entity, fields);
      } else {
        baseNodes.push(softwareNode);
      }
    }
    if (rich.service && typeof rich.service === "object") {
      const sv = rich.service;
      const serviceNode: SchemaGraphNode = {
        "@type": "Service",
        "@id": `${input.pageUrl}#service`,
        name: c.title,
        provider: { "@id": orgId },
        ...(sv.serviceType ? { serviceType: String(sv.serviceType).trim() } : {}),
        ...(sv.areaServed ? { areaServed: String(sv.areaServed).trim() } : {}),
        ...(sv.audience ? { audience: { "@type": "Audience", audienceType: String(sv.audience).trim() } } : {}),
        ...(sv.priceRange ? { priceRange: String(sv.priceRange).trim() } : {}),
      };
      if (c.schemaType === "Service") {
        const { "@id": _id, "@type": _type, name: _name, ...fields } = serviceNode;
        Object.assign(entity, fields);
      } else {
        baseNodes.push(serviceNode);
      }
    }
    if (rich.product && typeof rich.product === "object") {
      const pr = rich.product;
      const prodNode: SchemaGraphNode = {
        "@type": "Product",
        "@id": `${input.pageUrl}#product`,
        name: c.title,
        ...(pr.brand ? { brand: { "@type": "Brand", name: String(pr.brand).trim() } } : {}),
        ...(pr.sku ? { sku: String(pr.sku).trim() } : {}),
        ...(pr.gtin ? { gtin: String(pr.gtin).trim() } : {}),
        ...(pr.price
          ? {
              offers: {
                "@type": "Offer",
                price: String(pr.price).replace(",", "."),
                priceCurrency: pr.currency || "TRY",
                availability: `https://schema.org/${pr.availability || "InStock"}`,
                url: input.pageUrl,
                seller: { "@id": orgId },
              },
            }
          : {}),
      };
      if (c.schemaType === "Product") {
        const { "@id": _id, "@type": _type, name: _name, ...fields } = prodNode;
        Object.assign(entity, fields);
      } else {
        baseNodes.push(prodNode);
      }
    }
    if (rich.article && typeof rich.article === "object") {
      if (rich.article.articleSection) entity.articleSection = String(rich.article.articleSection).trim();
      if (rich.article.keywords) entity.keywords = String(rich.article.keywords).trim();
    }
    if (rich.tech && typeof rich.tech === "object") {
      if (rich.tech.level) entity.proficiencyLevel = String(rich.tech.level).trim();
      if (rich.tech.dependencies) entity.dependencies = String(rich.tech.dependencies).trim();
    }
    if (rich.speakable && !entity.speakable) {
      entity.speakable = { "@type": "SpeakableSpecification", cssSelector: ["h1", ".nx-tldr", "h2"] };
    }
    if (typeof rich.about === "string" && rich.about.trim()) {
      const names = rich.about.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 8);
      if (names.length > 0) {
        const existing = Array.isArray(entity.about) ? (entity.about as SchemaGraphNode[]) : entity.about ? [entity.about as SchemaGraphNode] : [];
        entity.about = [...existing, ...names.map((n: string) => ({ "@type": "Thing", name: n }))];
      }
    }
    if (rich.offer) {
      const o = rich.offer;
      baseNodes.push({
        "@type": "Offer",
        "@id": `${input.pageUrl}#offer`,
        name: o.name || c.title,
        price: String(o.price ?? "0").replace(",", "."),
        priceCurrency: o.currency || "TRY",
        ...(o.validThrough ? { validThrough: o.validThrough } : {}),
        availability: o.availability ? `https://schema.org/${o.availability}` : "https://schema.org/InStock",
        ...(o.discount ? { description: `${o.discount} indirim. ${o.terms ?? ""}`.trim() } : {}),
      });
    }
    let faqNodeDone = false;
    // Soru-cevap sayfası (QAPage): tek ana soru; gerçek soru, tam cevap, oy, yazar ve künye (konu, hedef kitle, bölge) tek varlıkta toplanır.
    // FAQPage ile birlikte yazılmaz (aynı sayfada iki çelişen soru-cevap varlığı olmasın).
    const qaText = (v: unknown, max: number): string => (typeof v === "string" ? plainFaqText(v).slice(0, max) : "");
    const qaMain = rich.qa && c.schemaType === "QAPage" ? rich.qa : null;
    const qaAnswer = qaMain ? [qaText(qaMain.shortAnswer, 600), qaText(qaMain.detail, 3000)].filter(Boolean).join("\n\n") || qaText(c.tldr, 600) : "";
    if (qaMain && qaAnswer) {
      faqNodeDone = true;
      const question = qaText(qaMain.question, 300) || c.title;
      const qaAuthorName = (c.authorName?.trim() || qaText(qaMain.author, 80)).trim();
      const qaAuthor = qaAuthorName && ![normName(input.siteName), normName(input.organization?.name)].includes(normName(qaAuthorName))
        ? buildAuthorPerson({ baseUrl, orgId, name: qaAuthorName, url: c.authorUrl, profile: c.authorProfile })
        : { "@type": "Organization", "@id": orgId, name: orgDisplayName, url: baseUrl };
      const published = c.publishedAt ? new Date(c.publishedAt).toISOString() : undefined;
      const modified = c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined;
      const storedVotes = Number(((c.schemaAttributes as Record<string, unknown> | undefined)?._qa as { upvotes?: unknown } | undefined)?.upvotes);
      const rawVotes = Math.max(Number(qaMain.upvotes) || 0, Number.isFinite(storedVotes) ? storedVotes : 0);
      const votes = rawVotes > 0 ? Math.floor(rawVotes) : 0;
      entity.mainEntity = {
        "@type": "Question",
        name: question,
        text: question,
        answerCount: 1,
        ...(votes ? { upvoteCount: votes } : {}),
        ...(published ? { datePublished: published } : {}),
        ...(modified ? { dateModified: modified } : {}),
        author: qaAuthor,
        acceptedAnswer: {
          "@type": "Answer",
          text: qaAnswer,
          url: input.pageUrl,
          ...(published ? { datePublished: published } : {}),
          ...(modified ? { dateModified: modified } : {}),
          ...(votes ? { upvoteCount: votes } : {}),
          author: qaAuthor,
        },
      };
      const about = qaText(qaMain.about, 160);
      const serviceType = qaText(qaMain.serviceType, 120);
      const audience = qaText(qaMain.audience, 160);
      const area = qaText(qaMain.areaServed, 80);
      const aboutNodes: SchemaGraphNode[] = [
        ...(about ? [{ "@type": "Thing", name: about }] : []),
        ...(serviceType ? [{ "@type": "Service", name: serviceType, serviceType, ...(area ? { areaServed: area } : {}), provider: { "@id": orgId } }] : []),
      ];
      if (aboutNodes.length > 0) entity.about = aboutNodes;
      if (audience) entity.audience = { "@type": "Audience", audienceType: audience };
      if (area) entity.spatialCoverage = { "@type": "Place", name: area };
      // Referans URL: konunun ürün/hizmet sayfası (WebPage.significantLink)
      const ref = qaText(qaMain.productUrl, 500);
      if (/^https?:\/\//i.test(ref)) entity.significantLink = ref;
      else if (ref.startsWith("/") && !ref.startsWith("//")) entity.significantLink = `${baseUrl}${ref}`;
    } else if (rich.qa) {
      const q = rich.qa;
      const list: Array<{ question?: unknown; answer?: unknown }> = Array.isArray(q.faqList) ? q.faqList : [];
      const seenQuestions = new Set<string>();
      const pairs = list
        .filter((item) => typeof item?.question === "string" && typeof item?.answer === "string")
        .map((item) => ({ question: plainFaqText(String(item.question)), answer: plainFaqText(String(item.answer)) }))
        .filter((item) => {
          const key = item.question.toLocaleLowerCase("tr");
          if (!item.question || !item.answer || seenQuestions.has(key)) return false;
          seenQuestions.add(key);
          return true;
        })
        .slice(0, 30);
      if (pairs.length > 0) {
        // Sayfada soru listesi varsa tek bir FAQPage düğümü: sayfa başlığından uydurulmuş tek soru yerine gerçek sorular.
        faqNodeDone = true;
        const mainEntity = pairs.map((item) => ({ "@type": "Question", name: String(item.question).trim(), acceptedAnswer: { "@type": "Answer", text: String(item.answer).trim() } }));
        // Varlık zaten FAQPage ise sorular onun içine girer (aynı @id ikinci kez yazılmaz).
        if (c.schemaType === "FAQPage") entity.mainEntity = mainEntity;
        else baseNodes.push({ "@type": "FAQPage", "@id": `${input.pageUrl}#faqpage`, mainEntity });
      } else {
        baseNodes.push({
          "@type": "Question",
          "@id": `${input.pageUrl}#question`,
          name: c.title,
          text: c.tldr || c.title,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.shortAnswer || c.tldr || c.title,
          },
        });
      }
    }

    if (input.autoSchema !== false && c.blocks) {
      const derived = deriveAutoSchemaNodes(c.blocks, input.pageUrl);
      for (const node of derived) {
        if (node["@type"] === "FAQPage") {
          if (faqNodeDone) continue;
          if (c.schemaType === "FAQPage" && !entity.mainEntity && Array.isArray(node.mainEntity)) {
            entity.mainEntity = node.mainEntity;
            faqNodeDone = true;
            continue;
          }
          faqNodeDone = true;
        }
        // Sayfanın ana varlığı zaten SoftwareApplication ise software_product_card bloğundan gelen alanlar ikinci düğüm açmak yerine ana düğümde birleşir
        if (node["@type"] === "SoftwareApplication" && c.schemaType === "SoftwareApplication") {
          const { "@id": _id, "@type": _type, name: _name, url: _url, ...fields } = node;
          Object.assign(entity, fields);
          continue;
        }
        baseNodes.push(node);
      }
    }
    if (c.schemaType === "FAQPage" && !entity.mainEntity) {
      entity["@type"] = "WebPage";
    }

    // Görseller ve sayfa düğümü: birincil görsel, gövde görselleri (associatedMedia / screenshot), WebPage ile bağlantılar
    const hasCrumbs = Boolean(input.breadcrumbs && input.breadcrumbs.length > 0);
    const webpageId = `${input.pageUrl}#webpage`;
    const primaryRef = entity.image ? { "@id": `${input.pageUrl}#primaryimage` } : undefined;
    const seen = new Set<string>([String(c.imageUrl ?? "").split("?")[0] ?? ""]);
    const bodyImages = (input.images ?? [])
      .filter((img) => {
        const key = img.url.split("?")[0] ?? img.url;
        if (!img.url || img.url.startsWith("data:") || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12)
      .map((img, index) => imageObject(baseUrl, img, `${input.pageUrl}#image-${index}`, rights));
    if (bodyImages.length > 0) {
      if (c.schemaType === "SoftwareApplication") entity.screenshot = bodyImages.slice(0, 6);
      else entity.associatedMedia = bodyImages;
    }
    if (WEBPAGE_FAMILY.has(c.schemaType)) {
      if (primaryRef) entity.primaryImageOfPage = primaryRef;
      if (hasCrumbs) entity.breadcrumb = { "@id": `${input.pageUrl}#breadcrumb` };
    } else {
      baseNodes.push({
        "@type": "WebPage",
        "@id": webpageId,
        url: input.pageUrl,
        name: c.title,
        inLanguage: input.locale,
        isPartOf: { "@id": websiteId },
        about: { "@id": entityId },
        mainEntity: { "@id": entityId },
        ...(c.tldr ? { description: c.tldr } : {}),
        ...(c.publishedAt ? { datePublished: new Date(c.publishedAt).toISOString() } : {}),
        ...(c.updatedAt ? { dateModified: new Date(c.updatedAt).toISOString() } : {}),
        ...(primaryRef ? { primaryImageOfPage: primaryRef } : {}),
        ...(hasCrumbs ? { breadcrumb: { "@id": `${input.pageUrl}#breadcrumb` } } : {}),
      });
      entity.mainEntityOfPage = { "@id": webpageId };
    }
  }

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    baseNodes.push(buildBreadcrumbNode(baseUrl, input.pageUrl, input.breadcrumbs));
  }

  const filtered = await cmsHooks.runFilter("seo:buildSchemaGraph", {
    siteId: input.siteId,
    locale: input.locale,
    url: input.pageUrl,
    contentId: input.content?.id,
    content: input.content ? { title: input.content.title, tldr: input.content.tldr ?? null, schemaAttributes: input.content.schemaAttributes ?? {} } : undefined,
    nodes: baseNodes,
  });

  return {
    "@context": "https://schema.org",
    "@graph": filtered.nodes,
  };
}

export interface LlmsTxtItem {
  title: string;
  url: string;
  type: string;
  /** Sayfa türü şeması (`SoftwareApplication`…): ürün sayfaları ayrı bölümde listelenir. */
  schemaType?: string | null;
  tldr?: string | null;
  importanceScore: number;
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "");
const names = (value: unknown): string[] =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => (typeof item === "object" && item ? text((item as Record<string, unknown>).name) : text(item)))
    .filter(Boolean);

/**
 * Kuruluş şemasından (adres, telefon, saat, hizmet bölgesi, uzmanlık) yapay zekâ modellerinin alıntılayabileceği kısa künye satırları.
 * Yalnızca sitenin kendi bildirdiği alanlar yazılır; boş alan satır üretmez.
 */
export function organizationFactLines(schema: Record<string, unknown> | null | undefined): string[] {
  if (!schema) return [];
  const address = (schema.address && typeof schema.address === "object" ? schema.address : {}) as Record<string, unknown>;
  const place = [text(address.streetAddress), text(address.addressLocality), text(address.addressRegion), text(address.postalCode), text(address.addressCountry)].filter(Boolean).join(", ");
  const hours = (Array.isArray(schema.openingHours) ? schema.openingHours : schema.openingHours ? [schema.openingHours] : []).map(text).filter(Boolean).join("; ");
  const rows: Array<[string, string]> = [
    ["Tanım", text(schema.description)],
    ["Yasal ad", text(schema.legalName)],
    ["Adres", place],
    ["Telefon", text(schema.telephone)],
    ["E-posta", text(schema.email)],
    ["Çalışma saatleri", hours],
    ["Hizmet bölgesi", names(schema.areaServed).join(", ")],
    ["Uzmanlık alanları", names(schema.knowsAbout).join(", ")],
    ["Bağlı olduğu kuruluş", names(schema.parentOrganization).join(", ")],
    ["Diller", names(schema.availableLanguage).join(", ")],
  ];
  return rows.filter(([, value]) => value).map(([label, value]) => `- ${label}: ${value}`);
}

/**
 * Çekirdek `/llms.txt` çıktısını oluşturur ve `llms:buildTxt` kancasını çalıştırır.
 */
export async function generateCoreLlmsTxt(options: {
  siteId: string;
  siteName: string;
  tagline?: string | null;
  siteDna?: string | null;
  /** Kuruluş şeması (`seo.organizationSchema`): künye bölümü için. */
  organization?: Record<string, unknown> | null;
  baseUrl: string;
  locale: string;
  items: LlmsTxtItem[];
}): Promise<string> {
  const lines: string[] = [
    `# ${options.siteName}`,
    "",
    `> ${options.tagline ?? "NexPress CMS Dual-Engine (Human & Agentic Web) Platform"}`,
    "",
  ];

  if (options.siteDna) {
    lines.push("## Kurumsal Kimlik & Site DNA", "", options.siteDna, "");
  }

  const facts = organizationFactLines(options.organization);
  if (facts.length > 0) lines.push("## Kuruluş ve İletişim", "", ...facts, "");

  lines.push(
    "## Makine Tarafından Okunabilir Beslemeler (Agentic Protocols)",
    "",
    `- Ana Sitemap: ${options.baseUrl}/sitemap.xml`,
    `- Doğrudan Markdown Müzakeresi: Herhangi bir URL sonuna \`?format=md\` ekleyin veya \`Accept: text/markdown\` başlığı gönderin.`,
    ""
  );

  const grouped: Record<string, LlmsTxtItem[]> = {};
  for (const item of [...options.items].sort((a, b) => b.importanceScore - a.importanceScore)) {
    const key =
      item.type === "campaign" && (item as LlmsTxtItem & { expired?: boolean }).expired
        ? "campaign_expired"
        : item.type === "page" && item.schemaType === "SoftwareApplication"
          ? "software"
          : item.type;
    const list = grouped[key] ?? [];
    list.push(item);
    grouped[key] = list;
  }

  const labels: Record<string, string> = {
    software: "Ürünler & Yazılım Çözümleri (Products & Software)",
    product: "Ürünler & Yazılım Çözümleri (Products & Software)",
    campaign: "Aktif Kampanyalar & Teklifler (Offers)",
    campaign_expired: "Süresi Dolan Kampanyalar (Arşiv)",
    kb_tech: "Teknik Bilgi Bankası (Knowledge Base)",
    ai_prompt: "Sıkça Sorulan Sorular & Karşılaştırmalar (FAQ / PAA)",
    page: "Kurumsal Sayfalar",
    post: "Makaleler",
  };

  const order = ["software", "product", "campaign", "ai_prompt", "kb_tech", "page", "post", "campaign_expired"];
  const sections = Object.entries(grouped).sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  for (const [type, list] of sections) {
    lines.push(`## ${labels[type] ?? type}`, "");
    for (const entry of list) {
      const ext = entry as LlmsTxtItem & { expired?: boolean; validityLabel?: string };
      const statusTag = ext.expired
        ? ` [Süresi Doldu${ext.validityLabel ? ` · ${ext.validityLabel}` : ""}]`
        : ext.validityLabel
          ? ` [${ext.validityLabel}]`
          : "";
      const summary = entry.tldr ? `: ${entry.tldr}` : "";
      lines.push(`- [${entry.title}](${entry.url.includes("/", 8) ? entry.url : `${entry.url}/`}?format=md)${statusTag}${summary}`);
    }
    lines.push("");
  }

  const result = await cmsHooks.runFilter("llms:buildTxt", {
    siteId: options.siteId,
    locale: options.locale,
    mode: "basic",
    lines,
  });

  return result.lines.join("\n").trim() + "\n";
}
export * from "./sitemap";
export * from "./webmaster-reports";
