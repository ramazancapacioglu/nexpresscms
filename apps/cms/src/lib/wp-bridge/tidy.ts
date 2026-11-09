import "server-only";
import type { BlockNode } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { extendClippedText, tidyImportedBlocks } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { bridgeOrigin } from "./store";

function decode(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&#8217;|&#x27;|&#039;|&apos;/gi, "'")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceTexts(html: string): string[] {
  const out: string[] = [];
  const pattern = /<(p|h1|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of html.matchAll(pattern)) {
    const text = decode(match[2] ?? "");
    if (text.length > 80) out.push(text);
  }
  return out;
}

async function textsFrom(origin: string, slug: string): Promise<string[]> {
  const path = slug === "ana-sayfa" ? "/" : `/${slug}/`;
  let target: URL;
  try {
    target = new URL(path, origin);
  } catch {
    return [];
  }
  if (target.host !== new URL(origin).host) return [];
  try {
    const response = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!response.ok) return [];
    const finalHost = new URL(response.url).host;
    if (finalHost !== target.host) return [];
    const html = (await response.text()).slice(0, 1_500_000);
    return sourceTexts(html);
  } catch {
    return [];
  }
}

function needsSource(blocks: BlockNode[]): boolean {
  const walk = (node: BlockNode): boolean => {
    const text = typeof node.props?.text === "string" ? node.props.text : "";
    if ((node.type === "paragraph" || node.type === "heading") && text.length >= 250) return true;
    return (node.children ?? []).some(walk);
  };
  return blocks.some(walk);
}

/** Gövdeyi başlıktan indirir, kesilen cümleyi kaynak sayfadan tamamlar. */
export async function tidyImportedCopy(siteId: string): Promise<{ pages: number; changed: number; extended: number }> {
  const origin = await bridgeOrigin(siteId);
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const rows = await repo.listContents({ locale });
  let pages = 0;
  let changed = 0;
  let extended = 0;
  for (const row of rows) {
    const tidied = tidyImportedBlocks(row.blocks ?? []);
    let blocks = tidied.blocks;
    let extra = 0;
    if (origin.startsWith("https://") && needsSource(blocks)) {
      const sources = await textsFrom(origin, row.slug);
      if (sources.length) {
        const grown = extendClippedText(blocks, sources);
        blocks = grown.blocks;
        extra = grown.extended;
      }
    }
    if (tidied.changed === 0 && extra === 0) continue;
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
    pages += 1;
    changed += tidied.changed;
    extended += extra;
  }
  if (pages > 0) {
    try {
      await revalidatePath("/");
    } catch {
      // İstek dışında önbellek temizliği atlanır.
    }
  }
  return { pages, changed, extended };
}
