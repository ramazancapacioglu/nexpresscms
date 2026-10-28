import {
  compileBlocksToMarkdown,
  type BlockNode,
  type ContentType,
} from "@nexpress/core";

export interface WpRawPostInput {
  wpId: number | string;
  title: string;
  slug: string;
  wpType: "post" | "page" | "product" | "docs";
  oldPermalink: string;
  rawContentHtml: string;
  excerptHtml?: string;
  meta?: Record<string, unknown>;
}

export interface WpConvertedItem {
  wpId: string;
  title: string;
  slug: string;
  targetType: ContentType;
  schemaType: string;
  importanceScore: number;
  tldr: string;
  blocks: BlockNode[];
  markdownCache: string;
  strippedShortcodesCount: number;
  redirect301: {
    fromPath: string;
    toPath: string;
    statusCode: 301;
  };
}

export interface WpMigrationReport {
  siteId: string;
  totalProcessed: number;
  totalShortcodesStripped: number;
  items: WpConvertedItem[];
}

/**
 * Elementor, WPBakery (`[vc_*]`), Divi (`[et_pb_*]`) ve Gutenberg (`<!-- wp:* -->`)
 * kısa kodlarını ve gereksiz sarmalayıcıları temizleyip saf 0-KB RSC `BlockNode[]` AST'ye dönüştürür.
 */
export function convertWpHtmlToNexPressBlocks(rawHtml: string): {
  blocks: BlockNode[];
  strippedShortcodesCount: number;
  extractedTldr: string;
} {
  let strippedCount = 0;

  const shortcodeRegex =
    /\[\/?(?:vc_[a-z0-9_]+|et_pb_[a-z0-9_]+|elementor-template|rev_slider)[^\]]*\]|<!--\s*\/?wp:[^>]*-->/gi;
  const matches = rawHtml.match(shortcodeRegex);
  if (matches) {
    strippedCount = matches.length;
  }

  const cleanedHtml = rawHtml
    .replace(shortcodeRegex, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();

  const blocks: BlockNode[] = [];
  let firstParagraph = "";

  const tagPattern = /<(h1|h2|h3|h4|p|blockquote|pre)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = tagPattern.exec(cleanedHtml)) !== null) {
    const tag = (match[1] ?? "p").toLowerCase();
    const innerRaw = match[2] ?? "";
    const plainText = stripInlineHtml(innerRaw).trim();
    if (!plainText) continue;

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const level = Number(tag.replace("h", "")) || 2;
      blocks.push({
        id: `wp_blk_${idx++}`,
        type: "heading",
        props: { level: Math.max(2, level), text: plainText },
      });
    } else if (tag === "pre") {
      blocks.push({
        id: `wp_blk_${idx++}`,
        type: "code_block",
        props: { language: "typescript", code: plainText },
      });
    } else if (tag === "blockquote") {
      blocks.push({
        id: `wp_blk_${idx++}`,
        type: "callout",
        props: {
          tone: "NOTE",
          title: "Önemli Not",
          text: plainText,
        },
      });
    } else {
      if (!firstParagraph && plainText.length > 30) {
        firstParagraph = plainText;
      }
      blocks.push({
        id: `wp_blk_${idx++}`,
        type: "paragraph",
        props: { text: plainText },
      });
    }
  }

  if (blocks.length === 0 && cleanedHtml.length > 0) {
    const plain = stripInlineHtml(cleanedHtml).trim();
    firstParagraph = plain.slice(0, 240);
    blocks.push({
      id: "wp_blk_1",
      type: "paragraph",
      props: { text: plain },
    });
  }

  const extractedTldr =
    firstParagraph.length > 0
      ? firstParagraph.slice(0, 260)
      : "WordPress'ten NexPress 0-KB RSC mimarisine aktarılan optimize edilmiş içerik.";

  blocks.unshift({
    id: "wp_blk_tldr",
    type: "tldr_box",
    props: { summary: extractedTldr },
  });

  return {
    blocks,
    strippedShortcodesCount: strippedCount,
    extractedTldr,
  };
}

function stripInlineHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–");
}

/**
 * Ham WordPress kayıtlarını NexPress polimorfik şemasına dönüştürür.
 */
export function convertWpPostsToNexPress(
  rawPosts: WpRawPostInput[],
  locale = "tr"
): WpConvertedItem[] {
  return rawPosts.map((post) => {
    const { blocks, strippedShortcodesCount, extractedTldr } =
      convertWpHtmlToNexPressBlocks(post.rawContentHtml);

    let targetType: ContentType = "post";
    let schemaType = "Article";
    let importanceScore = 7;

    if (post.wpType === "page") {
      targetType = "page";
      schemaType = "WebPage";
      importanceScore = 8;
    } else if (post.wpType === "product") {
      targetType = "product";
      schemaType = "Product";
      importanceScore = 9;
    } else if (post.wpType === "docs") {
      targetType = "kb_tech";
      schemaType = "TechArticle";
      importanceScore = 9;
    }

    const markdownCache = compileBlocksToMarkdown(blocks, {
      title: post.title,
      tldr: extractedTldr,
    });

    let oldPath = post.oldPermalink;
    try {
      const parsedUrl = new URL(post.oldPermalink);
      oldPath = parsedUrl.pathname;
    } catch {
      // Zaten göreceli yol ise koru
    }

    return {
      wpId: String(post.wpId),
      title: stripInlineHtml(post.title),
      slug: post.slug,
      targetType,
      schemaType,
      importanceScore,
      tldr: extractedTldr,
      blocks,
      markdownCache,
      strippedShortcodesCount,
      redirect301: {
        fromPath: oldPath,
        toPath: `/${locale}/${post.slug}`,
        statusCode: 301,
      },
    };
  });
}

export const DEMO_WORDPRESS_EXPORT_PAYLOAD: WpRawPostInput[] = [
  {
    wpId: 401,
    title: "Kurumsal E-Ticaret Sitelerinde Core Web Vitals ve INP Optimizasyonu",
    slug: "kurumsal-eticaret-core-web-vitals-inp-optimizasyonu",
    wpType: "docs",
    oldPermalink: "https://eski-wp-site.com/2025/11/kurumsal-eticaret-core-web-vitals-inp-optimizasyonu/",
    rawContentHtml: `
      <!-- wp:shortcode -->[vc_row][vc_column][elementor-template id="992"][/vc_column][/vc_row]<!-- /wp:shortcode -->
      <!-- wp:paragraph -->
      <p>Google'ın Interaction to Next Paint (INP) metriği, ağır JavaScript yüküne sahip klasik WordPress ve Elementor sitelerinde ciddi sıralama kayıplarına yol açmaktadır. Next.js 15 React Server Components (RSC) mimarisi ise istemciye 0 KB gereksiz JS göndererek INP süresini 20 milisaniyenin altına indirir.</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading -->
      <h2>1. Neden Klasik Sayfa Oluşturucular INP Testinde Başarısız Oluyor?</h2>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Her görsel bileşen için tarayıcıya jQuery, Swiper ve yüzlerce kilobaytlık hidratasyon betiği yüklemek ana iş parçacığını (Main Thread) kilitler.</p>
      <!-- /wp:paragraph -->
      <!-- wp:quote -->
      <blockquote>NexPress CMS, görsel kanvası yalnızca yönetim panelinde çalıştırır; ziyaretçiye ise %100 saf sunucu bileşeni ve önbelleklenmiş Markdown sunar.</blockquote>
      <!-- /wp:quote -->
    `,
  },
  {
    wpId: 402,
    title: "NexPress AI Commerce Connector (WooCommerce & Merchant Göç Paketi)",
    slug: "nexpress-ai-commerce-connector",
    wpType: "product",
    oldPermalink: "https://eski-wp-site.com/urun/nexpress-ai-commerce-connector/",
    rawContentHtml: `
      [et_pb_section][et_pb_row]
      <p>WooCommerce ürün kataloglarınızı GTIN, MPN, SKU, fiyat ve stok şemalarıyla birlikte 60 saniyede NexPress'in bağlantılı @id Bilgi Grafiğine ve Google Merchant Center XML beslemesine taşıyan kurumsal adaptör.</p>
      <h2>Teknik Özellikler ve Schema.org Desteği</h2>
      <p>Otomatik Product, Offer ve AggregateRating düğümleri ile hem Google Alışveriş hem de ChatGPT/Perplexity alışveriş ajanlarında tam görünürlük sağlar.</p>
      [/et_pb_row][/et_pb_section]
    `,
  },
];
