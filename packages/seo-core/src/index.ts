import { cmsHooks, type BlockNode, type SchemaGraphNode } from "@nexpress/core";
import { buildBreadcrumbNode, deriveAutoSchemaNodes } from "./engine";

export * from "./engine";
export * from "./feed";
export * from "./schema-validate";
export * from "./commerce-schema";
export * from "./search-console";
export * from "./analytics-integrations";

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
    updatedAt?: Date;
    publishedAt?: Date | null;
    blocks?: BlockNode[];
    imageUrl?: string | null;
    imageAlt?: string | null;
    keywords?: string[];
    articleSection?: string;
    /** Özel alanlardan gelen Schema.org özellikleri (`fieldSchemaProps`); temel alanları ezmez. */
    extraProps?: Record<string, string | number | boolean>;
  };
  /** Motor ayarları: bloklardan otomatik FAQPage/HowTo/Review üret. */
  autoSchema?: boolean;
  organization?: { name?: string; logo?: string; sameAs?: string[]; /** Yerel işletme alanları; `@type` dizisi `LocalBusiness` içerebilir. */ schema?: Record<string, unknown> };
  breadcrumbs?: Array<{ name: string; url: string }>;
  aggregateRating?: { ratingValue: number; reviewCount: number };
}

/** Kuruluş düğümüne yerel işletme alanları: temel kimlik alanlarını ezmez, `@type` Organization ile birleşir. */
function organizationExtras(schema: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!schema) return {};
  const { "@type": rawType, ...rest } = schema;
  const types = (Array.isArray(rawType) ? rawType : rawType ? [rawType] : []).filter((type): type is string => typeof type === "string");
  const merged = [...new Set([...types.filter((type) => type !== "Organization"), "Organization"])];
  return { ...Object.fromEntries(Object.entries(rest).filter(([key]) => !RESERVED_NODE_KEYS.has(key))), ...(merged.length > 1 ? { "@type": merged } : {}) };
}

/** Özel alan özellikleri: `@` ile başlayanlar ve temel varlık alanları atılır; yalnızca ilkel değerler geçer. */
const RESERVED_NODE_KEYS = new Set(["name", "headline", "description", "url", "inLanguage", "isPartOf", "publisher", "author", "datePublished", "dateModified", "mainEntityOfPage", "image", "aggregateRating", "sameAs"]);
function safeExtraProps(extra: Record<string, string | number | boolean> | undefined): Record<string, string | number | boolean> {
  if (!extra) return {};
  return Object.fromEntries(
    Object.entries(extra).filter(([k, v]) => /^[a-z][A-Za-z]{1,40}$/.test(k) && !RESERVED_NODE_KEYS.has(k) && ["string", "number", "boolean"].includes(typeof v))
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

  const baseNodes: SchemaGraphNode[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: input.organization?.name || input.siteName,
      url: baseUrl,
      ...(input.organization?.logo
        ? { logo: { "@type": "ImageObject", url: input.organization.logo.startsWith("/") ? `${baseUrl}${input.organization.logo}` : input.organization.logo } }
        : {}),
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
            author: c.authorName?.trim() ? { "@type": "Person", name: c.authorName.trim() } : { "@id": orgId },
            mainEntityOfPage: input.pageUrl,
          }
        : {}),
      ...(c.imageUrl && !c.imageUrl.startsWith("data:")
        ? { image: { "@type": "ImageObject", url: c.imageUrl.startsWith("/") ? `${baseUrl}${c.imageUrl}` : c.imageUrl, caption: c.imageAlt ?? c.title } }
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
        applicationCategory: sw.category || "BusinessApplication",
        ...(sw.subCategory ? { applicationSubCategory: sw.subCategory } : {}),
        ...(sw.version ? { softwareVersion: sw.version } : {}),
        ...(sw.requirements ? { memoryRequirements: sw.requirements } : {}),
        ...(sw.ratingValue ? { aggregateRating: { "@type": "AggregateRating", ratingValue: sw.ratingValue, reviewCount: sw.ratingCount || 1, bestRating: 5, worstRating: 1 } } : {}),
        ...(sw.price ? { offers: { "@type": "Offer", price: String(sw.price).replace(",", "."), priceCurrency: sw.currency || "TRY" } } : {}),
      };
      // Sayfanın ana varlığı zaten SoftwareApplication ise ikinci bir düğüm eklenmez: alanlar ana varlığa işlenir (yinelenen varlık yok)
      if (c.schemaType === "SoftwareApplication") {
        const { "@id": _id, "@type": _type, name: _name, ...fields } = softwareNode;
        Object.assign(entity, fields);
      } else {
        baseNodes.push(softwareNode);
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
    if (rich.qa) {
      const q = rich.qa;
      const list: Array<{ question?: unknown; answer?: unknown }> = Array.isArray(q.faqList) ? q.faqList : [];
      const pairs = list.filter((item) => typeof item?.question === "string" && typeof item?.answer === "string" && item.question.trim() && item.answer.trim()).slice(0, 30);
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
      baseNodes.push(...deriveAutoSchemaNodes(c.blocks, input.pageUrl).filter((node) => !(faqNodeDone && node["@type"] === "FAQPage")));
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
  for (const item of options.items) {
    const list = grouped[item.type] ?? [];
    list.push(item);
    grouped[item.type] = list;
  }

  const labels: Record<string, string> = {
    product: "Ürünler & Yazılım Çözümleri (Products & Software)",
    campaign: "Aktif Kampanyalar & Teklifler (Offers)",
    kb_tech: "Teknik Bilgi Bankası (Knowledge Base)",
    ai_prompt: "Sıkça Sorulan Sorular & Karşılaştırmalar (FAQ / PAA)",
    page: "Kurumsal Sayfalar",
    post: "Makaleler",
  };

  for (const [type, list] of Object.entries(grouped)) {
    lines.push(`## ${labels[type] ?? type}`, "");
    for (const entry of list) {
      const summary = entry.tldr ? `: ${entry.tldr}` : "";
      lines.push(`- [${entry.title}](${entry.url.includes("/", 8) ? entry.url : `${entry.url}/`}?format=md)${summary}`);
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
