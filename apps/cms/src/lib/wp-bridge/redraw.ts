import "server-only";
import type { BlockNode } from "@nexpress/core";
import { pluginActions } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { revalidatePath } from "@/lib/cache";
import { bridgeDrawn, rememberBridgeDrawn } from "./store";

function textOf(blocks: BlockNode[]): string {
  const parts: string[] = [];
  const walk = (node: BlockNode) => {
    const props = node.props ?? {};
    for (const key of ["text", "html", "title"]) {
      const value = props[key];
      if (typeof value === "string") parts.push(value.replace(/<[^>]+>/g, " "));
    }
    for (const child of node.children ?? []) walk(child);
  };
  for (const block of blocks) walk(block);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function hasStructure(blocks: BlockNode[]): boolean {
  const walk = (node: BlockNode): boolean =>
    node.type === "section" || node.type === "columns" || node.type === "image_figure" || (node.children ?? []).some(walk);
  return blocks.some(walk);
}

/** Yapısı olmayan sayfaların yerleşimini AI çizer. Görselli veya bölümlü sayfa değişmez. */
export async function redrawFlatPages(siteId: string, limit = 4): Promise<{ drawn: number; skipped: number; note: string }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const done = new Set(await bridgeDrawn(siteId));
  const rows = await repo.listContents({ locale });
  const targets = rows.filter((row) => row.type === "page" && row.status === "published" && !done.has(row.id) && !hasStructure(row.blocks ?? []) && textOf(row.blocks ?? []).length > 80);
  let drawn = 0;
  let note = "";
  const remembered: string[] = [];
  for (const row of targets.slice(0, limit)) {
    const prompt = `Sayfa başlığı: ${row.title}\nMevcut metni koru. Yeni ürün, fiyat veya iddia ekleme. Metni bölüm, sütun ve kart olarak yerleştir.\n\n${textOf(row.blocks ?? []).slice(0, 1600)}`;
    const result = await pluginActions.run("ai-design.generate", { siteId, userId: "wp-bridge", input: { mode: "section", prompt } });
    if (!result.ok) {
      note = result.error;
      break;
    }
    const data = result.data as { lint?: { blocks?: BlockNode[]; errors?: string[] } };
    const blocks = data.lint?.blocks;
    if (!blocks?.length || (data.lint?.errors?.length ?? 0) > 0) continue;
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
    remembered.push(row.id);
    drawn += 1;
    try {
      await revalidatePath(row.slug === "ana-sayfa" ? "/" : `/${row.slug}`);
    } catch {
      // İstek dışında önbellek temizliği atlanır.
    }
  }
  if (remembered.length) await rememberBridgeDrawn(siteId, remembered);
  return { drawn, skipped: Math.max(0, targets.length - drawn), note };
}
