import "server-only";
import type { BlockNode } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { assignHeadingAnchors, cardifyPlainBlocks, buildAnchorNav, parseTocEntries, sanitizeBlockColors, tidyFaqBlocks } from "@nexpress/wp-importer";
import type { WpSession } from "./session";

/** Hukuki ve ana sayfa içerikleri kartlaştırılmaz. */
const CARDIFY_SKIP = new Set(["gizlilik-politikasi", "kvkk-aydinlatma-metni", "ana-sayfa", "ana-sayfa-yedek", "blog"]);

export interface TidyResult {
  contents: number;
  colorsRemoved: number;
  faqFixed: number;
  anchorNavs: number;
  tocs: number;
  cards: number;
}

/**
 * İçerik tasarımı: (1) palet dışı renkleri (kaynaktaki turuncu gibi) kaldırır, böylece metin tema rengine döner;
 * (2) SSS maddelerinde görünür `<strong>` yazılarını temizler, akordiyonu tek açık yapar;
 * (3) bölüm bağlantıları olan sayfalara yapışkan çapa menüsü, içindekiler listesi olan yazı ve sayfalara başlık çapaları ve menü ekler.
 * Tekrar çalıştırılabilir: var olan menü ikinci kez eklenmez.
 */
export async function tidyContentDesign(session: WpSession | null, siteId: string): Promise<TidyResult> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const colors = (site?.designTokens as { colors?: Record<string, string> } | undefined)?.colors ?? {};
  const palette = Object.values(colors).filter((value): value is string => typeof value === "string");
  const result: TidyResult = { contents: 0, colorsRemoved: 0, faqFixed: 0, anchorNavs: 0, tocs: 0, cards: 0 };
  for (const row of await repo.listContents({ locale })) {
    if (row.type === "template") continue;
    let blocks: BlockNode[] = row.blocks;
    const before = JSON.stringify(blocks);
    const colored = sanitizeBlockColors(blocks, palette);
    blocks = colored.blocks;
    result.colorsRemoved += colored.removed;
    const faq = tidyFaqBlocks(blocks);
    blocks = faq.blocks;
    result.faqFixed += faq.fixed;
    if (row.type === "page" && !CARDIFY_SKIP.has(row.slug)) {
      const cards = cardifyPlainBlocks(blocks);
      blocks = cards.blocks;
      result.cards += cards.lists + cards.groups;
    }

    const hasMenu = JSON.stringify(blocks).includes('"type":"anchor_nav"') || JSON.stringify(blocks).includes('"type":"toc"');
    if (!hasMenu) {
      const wpId = (row.schemaAttributes as { wpId?: string } | undefined)?.wpId;
      let entries: ReturnType<typeof parseTocEntries> = [];
      if (session && wpId && row.status === "published") {
        try {
          entries = parseTocEntries(await session.text(`/?p=${wpId}`));
        } catch {
          entries = [];
        }
      }
      const assigned = entries.length >= 3 ? assignHeadingAnchors(blocks, entries) : null;
      if (assigned && assigned.items.length >= 3) {
        blocks = assigned.blocks;
        const nav: BlockNode =
          row.type === "page" && assigned.items.length <= 8
            ? { id: "wp_anchor_nav", type: "anchor_nav", props: { title: "Bölümler", sticky: true, styleVariant: "underline", items: assigned.items } }
            : { id: "wp_toc", type: "toc", props: { items: assigned.items } };
        blocks = [...blocks.slice(0, 1), nav, ...blocks.slice(1)];
        if (nav.type === "anchor_nav") result.anchorNavs += 1;
        else result.tocs += 1;
      } else if (row.type === "page") {
        const nav = buildAnchorNav(blocks);
        if (nav) {
          blocks = [...blocks.slice(0, 1), nav, ...blocks.slice(1)];
          result.anchorNavs += 1;
        }
      }
    }
    if (JSON.stringify(blocks) === before) continue;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: row.schemaAttributes,
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    result.contents += 1;
  }
  return result;
}
