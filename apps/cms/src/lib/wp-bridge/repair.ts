import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { repairImportedBlocks } from "@nexpress/wp-importer";
import { resolveAssetUrl } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { ingestImages, remapContentImages } from "./media";
import { bridgeOrigin } from "./store";

const IMAGE_URL = /^https?:\/\/\S+\/wp-content\/uploads\/\S+\.(?:webp|png|jpe?g|gif|svg|avif)(?:\?\S*)?$/i;

function isUploadPath(value: string): boolean {
  return value.startsWith("/wp-content/uploads/") || value.startsWith("//");
}

/** Yazılmış içerikteki göreli görselleri indirir, yapışık başlıkları ayırır. */
export async function repairImportedAssets(siteId: string): Promise<{ origin: string; pages: number; split: number; downloaded: number; failed: number; remapped: number }> {
  const origin = await bridgeOrigin(siteId);
  if (!origin.startsWith("https://")) return { origin: "", pages: 0, split: 0, downloaded: 0, failed: 0, remapped: 0 };
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const rows = await repo.listContents({ locale });
  const images = new Set<string>();
  let pages = 0;
  let split = 0;
  for (const row of rows) {
    const fixed = repairImportedBlocks(row.blocks ?? [], origin, images);
    const featured = row.featuredImage && isUploadPath(row.featuredImage) ? resolveAssetUrl(row.featuredImage, origin) : row.featuredImage;
    if (featured && IMAGE_URL.test(featured)) images.add(featured.split("?")[0]!);
    const changed = fixed.split > 0 || featured !== row.featuredImage || JSON.stringify(fixed.blocks) !== JSON.stringify(row.blocks ?? []);
    if (!changed) continue;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: row.schemaAttributes,
      featuredImage: featured,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: fixed.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    pages += 1;
    split += fixed.split;
  }
  let downloaded = 0;
  let failed = 0;
  const queue = [...images].map((url) => ({ url, alt: "" }));
  for (let index = 0; index < queue.length; index += 12) {
    const part = await ingestImages(siteId, queue.slice(index, index + 12));
    downloaded += part.downloaded;
    failed += part.failed;
  }
  const remapped = downloaded > 0 ? await remapContentImages(siteId, locale) : 0;
  if (pages > 0 || remapped > 0) {
    try {
      await revalidatePath("/");
    } catch {
      // İstek dışında (betik) önbellek temizliği atlanır.
    }
  }
  return { origin, pages, split, downloaded, failed, remapped };
}
