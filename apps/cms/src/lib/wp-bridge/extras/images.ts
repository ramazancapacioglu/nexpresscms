import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolveUploadPath, wpUploadsDir } from "@/lib/wp-uploads";
import type { BlockNode } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { originalUploadUrl, plainText } from "@nexpress/wp-importer";
import { ingestImages, remapContentImages } from "../media";
import { readMediaMap, writeMediaMap } from "../store";
import { wpAll, type WpSession } from "./session";

interface WpMediaRow {
  id: number;
  source_url: string;
  alt_text?: string;
}

interface WpFeatured {
  id: number;
  featured_media?: number;
}

/**
 * Öne çıkan görsel. Önceki aktarım bu alanı doldurmuyordu: blog ve kampanya kartları ile paylaşım görseli boştu.
 * Kaynak sitedeki `featured_media` → medya kitaplığındaki yerel kopya (yoksa indirilir).
 */
export async function importFeatured(session: WpSession, siteId: string): Promise<{ set: number; missing: number }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const media = new Map((await wpAll<WpMediaRow>(session, "media?_fields=id,source_url,alt_text", 100)).map((row) => [row.id, row]));
  const wanted = new Map<string, number>();
  for (const rest of ["pages", "posts", "ai_prompt"]) {
    const rows = await wpAll<WpFeatured>(session, `${rest}?status=publish,draft,pending,future&context=edit&_fields=id,featured_media`, 100);
    for (const row of rows) if (row.featured_media) wanted.set(`cnt_wp_${row.id}`, row.featured_media);
  }
  const urls = [...new Set([...wanted.values()].map((id) => media.get(id)?.source_url).filter((url): url is string => Boolean(url)))];
  await ingestImages(siteId, urls.map((url) => ({ url, alt: "" })));
  const map = await readMediaMap(siteId);
  const rows = await repo.listContents({ locale });
  let set = 0;
  let missing = 0;
  for (const row of rows) {
    const mediaId = wanted.get(row.id);
    const source = mediaId ? media.get(mediaId) : undefined;
    if (!source) continue;
    const local = map[source.source_url];
    if (!local) {
      missing += 1;
      continue;
    }
    const attrs = (row.schemaAttributes ?? {}) as Record<string, unknown>;
    const pub = (attrs._publishing ?? {}) as Record<string, unknown>;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: { ...attrs, _publishing: { ...pub, featuredImageUrl: local, featuredImageMeta: { url: local, altText: plainText(source.alt_text ?? "", 300) || row.title } } },
      featuredImage: local,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: row.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    set += 1;
  }
  return { set, missing };
}

const IMAGE_BLOCKS = new Set(["image_figure", "image", "hero_image"]);

function collectUploads(value: unknown, origin: string, into: Set<string>): void {
  if (typeof value === "string") {
    for (const url of value.match(/https?:\/\/[^"'()\s,]+\/wp-content\/uploads\/[^"'()\s,]+/gi) ?? []) if (url.startsWith(origin)) into.add(url);
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => collectUploads(item, origin, into));
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach((item) => collectUploads(item, origin, into));
}

function mentions(value: unknown, dead: Set<string>): boolean {
  if (typeof value === "string") return [...dead].some((url) => value.includes(url));
  if (Array.isArray(value)) return value.some((item) => mentions(item, dead));
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).some((item) => mentions(item, dead));
  return false;
}

function dropDead(nodes: BlockNode[], dead: Set<string>): { nodes: BlockNode[]; dropped: number } {
  let dropped = 0;
  const walk = (list: BlockNode[]): BlockNode[] =>
    list.flatMap((node) => {
      if (IMAGE_BLOCKS.has(node.type) && mentions(node.props, dead)) {
        dropped += 1;
        return [];
      }
      if (node.type === "gallery" && Array.isArray(node.props?.items)) {
        const items = (node.props.items as unknown[]).filter((item) => !mentions(item, dead));
        if (items.length !== (node.props.items as unknown[]).length) {
          dropped += 1;
          if (items.length === 0) return [];
          return [{ ...node, props: { ...node.props, items } }];
        }
      }
      return [node.children ? { ...node, children: walk(node.children) } : node];
    });
  return { nodes: walk(nodes), dropped };
}

/**
 * Kaynak sitede kalan `wp-content/uploads` adresleri. Alan adı yeni siteye geçince bu adresler 404 verir; bu yüzden hepsi
 * kitaplığa alınır. Boyutlu kopya (`-1024x683`) özgün dosyaya eşlenir. Kaynakta da 404 olan görselin bloğu atılır.
 */
export async function localizeUploads(siteId: string, origin: string): Promise<{ found: number; localized: number; dead: string[]; blocksDropped: number }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const rows = await repo.listContents({ locale });
  const found = new Set<string>();
  for (const row of rows) {
    collectUploads(row.blocks, origin, found);
    collectUploads(row.schemaAttributes, origin, found);
  }
  let map = await readMediaMap(siteId);
  const need = [...found].filter((url) => !map[url] && !map[originalUploadUrl(url)]);
  await ingestImages(siteId, need.flatMap((url) => [{ url: originalUploadUrl(url), alt: "" }, { url, alt: "" }]));
  map = await readMediaMap(siteId);
  const dead: string[] = [];
  let localized = 0;
  for (const url of found) {
    const local = map[url] ?? map[originalUploadUrl(url)];
    // Belge ve arşivler (pdf, zip…) `importFiles` ile özgün adreste sunulur; yalnızca görsel olanlar "ölü" sayılabilir.
    if (!/\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i.test(url.split("?")[0] ?? "")) continue;
    if (!local) {
      dead.push(url);
      continue;
    }
    if (!map[url]) map[url] = local;
    localized += 1;
  }
  await writeMediaMap(siteId, map);
  await remapContentImages(siteId, locale);
  let blocksDropped = 0;
  if (dead.length > 0) {
    const deadSet = new Set(dead);
    for (const row of await repo.listContents({ locale })) {
      const result = dropDead(row.blocks, deadSet);
      if (result.dropped === 0) continue;
      blocksDropped += result.dropped;
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
        blocks: result.nodes,
        metaTitle: row.metaTitle ?? undefined,
        metaDescription: row.metaDescription ?? undefined,
        canonicalUrl: row.canonicalUrl ?? undefined,
        noIndex: row.noIndex,
      });
    }
  }
  return { found: found.size, localized, dead, blocksDropped };
}

/**
 * Belge ve arşiv dosyaları (PDF, ZIP, DOCX…): kaynak sitedeki yoluyla `WP_UPLOADS_DIR` altına indirilir ve
 * `/wp-content/uploads/…` rotasından özgün adresinde sunulur. İçerikte bağlantısı olan her dosya ve medya kitaplığındaki
 * görsel olmayan her kayıt alınır. Boyut sınırı 200 MB; zaten inmiş dosya yeniden indirilmez.
 */
export async function importFiles(session: WpSession, siteId: string): Promise<{ downloaded: number; existing: number; failed: string[] }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const urls = new Set<string>();
  for (const row of await repo.listContents({ locale })) {
    collectUploads(row.blocks, session.origin, urls);
    collectUploads(row.schemaAttributes, session.origin, urls);
  }
  for (const item of await wpAll<{ source_url: string; mime_type?: string }>(session, "media?context=edit&_fields=source_url,mime_type", 100)) {
    if (!(item.mime_type ?? "").startsWith("image/") && item.source_url.startsWith(session.origin)) urls.add(item.source_url);
  }
  const base = wpUploadsDir();
  let downloaded = 0;
  let existing = 0;
  const failed: string[] = [];
  for (const url of urls) {
    const tail = url.split("?")[0]?.split("/wp-content/uploads/")[1];
    const target = tail ? resolveUploadPath(base, tail.split("/")) : null;
    if (!target) continue;
    if (fs.existsSync(target.file)) {
      existing += 1;
      continue;
    }
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(300_000) });
      const size = Number(res.headers.get("content-length") ?? "0");
      if (!res.ok || !res.body || size > 200 * 1024 * 1024) throw new Error(`HTTP ${res.status}`);
      await fs.promises.mkdir(path.dirname(target.file), { recursive: true });
      await pipeline(Readable.fromWeb(res.body as never), fs.createWriteStream(target.file));
      downloaded += 1;
    } catch {
      failed.push(url);
    }
  }
  return { downloaded, existing, failed };
}
