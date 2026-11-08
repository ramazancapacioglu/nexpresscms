import "server-only";
import { randomBytes } from "node:crypto";
import { buildMediaRef, type BlockNode } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { MAX_UPLOAD_BYTES, inspectUpload } from "@/lib/media/process";
import { putOriginal } from "@/lib/media/storage";
import { fetchPublicFile } from "@/lib/safe-fetch";
import { readMediaMap, writeMediaMap } from "./store";

function swap(value: unknown, map: Record<string, string>): unknown {
  if (typeof value === "string") return map[value] ?? value;
  if (Array.isArray(value)) return value.map((item) => swap(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, swap(item, map)]));
  }
  return value;
}

/** Genel adresteki görselleri medya kitaplığına alır. Aynı adres ikinci kez indirilmez. */
export async function ingestImages(siteId: string, items: Array<{ url: string; alt: string }>): Promise<{ downloaded: number; failed: number }> {
  const map = await readMediaMap(siteId);
  let downloaded = 0;
  let failed = 0;
  const repo = getScopedRepository(siteId);
  for (const item of items) {
    if (map[item.url]) continue;
    try {
      const { data } = await fetchPublicFile(item.url, { maxBytes: MAX_UPLOAD_BYTES });
      const info = await inspectUpload(data);
      const id = `med_${randomBytes(9).toString("base64url")}`;
      await putOriginal(siteId, id, data);
      const ref = buildMediaRef({ id, width: info.width, height: info.height, hasAlpha: info.hasAlpha });
      const name = decodeURIComponent(new URL(item.url).pathname.split("/").pop() ?? "gorsel").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || "gorsel";
      await repo.saveMediaAsset({ id, filename: name, url: ref, mimeType: info.mimeType, width: info.width, height: info.height, sizeBytes: data.length, altText: item.alt });
      map[item.url] = ref;
      downloaded += 1;
    } catch {
      failed += 1;
    }
  }
  if (downloaded) await writeMediaMap(siteId, map);
  return { downloaded, failed };
}

/** İndirilen adresleri yazılmış içerikteki görsel alanlarına işler. */
export async function remapContentImages(siteId: string, locale: string): Promise<number> {
  const map = await readMediaMap(siteId);
  const urls = Object.keys(map);
  if (urls.length === 0) return 0;
  const repo = getScopedRepository(siteId);
  const rows = await repo.listContents({ locale });
  let changed = 0;
  for (const row of rows) {
    const featured = row.featuredImage && map[row.featuredImage] ? map[row.featuredImage] : row.featuredImage;
    const blocks = swap(row.blocks, map) as BlockNode[];
    if (featured === row.featuredImage && JSON.stringify(blocks) === JSON.stringify(row.blocks)) continue;
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
      blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    changed += 1;
  }
  return changed;
}
