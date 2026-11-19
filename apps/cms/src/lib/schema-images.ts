import "server-only";
import { collectBlockImages, type BlockNode } from "@nexpress/core";
import type { SchemaImageInput } from "@nexpress/seo-core";
import { getPublicMediaMeta } from "./public-data";

const mediaId = (url: string): string => /\/media\/(med_[A-Za-z0-9_-]+)/.exec(url)?.[1] ?? "";

/**
 * Sayfanın şema görselleri: bloklardaki görseller ve öne çıkan görsel, medya kitaplığındaki alt metin, başlık, açıklama ve
 * boyutla zenginleştirilir (blokta yazılan alan önceliklidir). Kitaplıkta olmayan görsel yine bildirilir, boyutsuz.
 */
export async function schemaImagesFor(siteId: string, blocks: readonly BlockNode[] | null | undefined, featuredUrl?: string | null) {
  const meta = await getPublicMediaMeta(siteId);
  const enrich = (url: string, own?: { alt?: string; title?: string; caption?: string }): SchemaImageInput => {
    const m = meta[mediaId(url)];
    return {
      url,
      alt: own?.alt || m?.alt || "",
      title: own?.title || m?.title || "",
      caption: own?.caption || m?.caption || "",
      width: m?.width ?? null,
      height: m?.height ?? null,
      mime: m?.mime || null,
    };
  };
  return {
    images: collectBlockImages(blocks, 30).map((img) => enrich(img.url, img)),
    featured: featuredUrl ? (({ url: _url, ...rest }) => rest)(enrich(featuredUrl)) : null,
  };
}
