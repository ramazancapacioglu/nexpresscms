import { cmsHooks, type BlockNode, type SchemaGraphNode } from "@nexpress/core";
import { buildBreadcrumbNode, deriveAutoSchemaNodes } from "./engine";

export * from "./engine";
export * from "./feed";
export * from "./schema-validate";

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
  };
  /** Motor ayarları: bloklardan otomatik FAQPage/HowTo/Review üret. */
  autoSchema?: boolean;
  organization?: { name?: string; logo?: string; sameAs?: string[] };
  breadcrumbs?: Array<{ name: string; url: string }>;
  aggregateRating?: { ratingValue: number; reviewCount: number };
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
  const orgId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;

  const baseNodes: SchemaGraphNode[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: input.organization?.name || input.siteName,
      url: baseUrl,
      ...(input.organization?.logo
        ? { logo: { "@type": "ImageObject", url: input.organization.logo } }
        : {}),
      ...(input.organization?.sameAs && input.organization.sameAs.length > 0
        ? { sameAs: input.organization.sameAs }
        : {}),
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
    const { publishing: _p, seo: _s, slugHistory: _h, ...cleanAttrs } = (c.schemaAttributes ?? {}) as Record<
      string,
      unknown
    >;
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
            author: { "@type": "Person", name: c.authorName ?? input.siteName },
            mainEntityOfPage: input.pageUrl,
          }
        : {}),
      ...(c.imageUrl && !c.imageUrl.startsWith("data:")
        ? { image: { "@type": "ImageObject", url: c.imageUrl, caption: c.imageAlt ?? c.title } }
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
      ...cleanAttrs,
    };
    baseNodes.push(entity);

    if (input.autoSchema !== false && c.blocks) {
      baseNodes.push(...deriveAutoSchemaNodes(c.blocks, input.pageUrl));
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

/**
 * Çekirdek `/llms.txt` çıktısını oluşturur ve `llms:buildTxt` kancasını çalıştırır.
 */
export async function generateCoreLlmsTxt(options: {
  siteId: string;
  siteName: string;
  tagline?: string | null;
  siteDna?: string | null;
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
      lines.push(`- [${entry.title}](${entry.url}?format=md)${summary}`);
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
