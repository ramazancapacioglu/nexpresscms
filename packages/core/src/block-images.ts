import type { BlockNode } from "./types";

export interface BlockImage {
  url: string;
  alt: string;
  caption: string;
  title: string;
}

const IMAGE_URL = /^(?:\/media\/med_[A-Za-z0-9_-]+(?:\?.*)?|(?:https?:\/\/|\/)[^\s"'<>]+\.(?:png|jpe?g|webp|avif|gif)(?:\?[^\s"'<>]*)?)$/i;
const URL_KEYS = ["url", "src", "image", "imageUrl", "backgroundImage"] as const;
const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** Bir nesnede (blok özelliği ya da galeri öğesi) görsel adresi varsa görsel bilgisini çıkarır. */
function imageOf(obj: Record<string, unknown>): BlockImage | null {
  for (const key of URL_KEYS) {
    const value = str(obj[key]);
    if (value && IMAGE_URL.test(value)) {
      return { url: value, alt: str(obj.altText) || str(obj.alt), caption: str(obj.caption), title: str(obj.titleText) || str(obj.title) };
    }
  }
  return null;
}

function walkValue(value: unknown, out: BlockImage[], depth: number): void {
  if (depth > 6 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) walkValue(item, out, depth + 1);
    return;
  }
  const record = value as Record<string, unknown>;
  const found = imageOf(record);
  if (found) out.push(found);
  for (const [key, inner] of Object.entries(record)) {
    if (key === "children") continue;
    walkValue(inner, out, depth + 1);
  }
}

/**
 * Sayfa bloklarındaki görseller (görsel, galeri, bant arka planı…) sırayla ve adrese göre tekilleştirilerek döner.
 * Şema (`ImageObject`) ve görsel site haritası için kullanılır; alt metin, başlık ve açıklama bloktan gelir.
 */
export function collectBlockImages(blocks: readonly BlockNode[] | null | undefined, limit = 30): BlockImage[] {
  const all: BlockImage[] = [];
  const visit = (nodes: readonly BlockNode[]) => {
    for (const node of nodes) {
      walkValue(node.props, all, 0);
      if (node.children) visit(node.children);
    }
  };
  visit(blocks ?? []);
  const seen = new Set<string>();
  const out: BlockImage[] = [];
  for (const image of all) {
    const key = image.url.split("?")[0] ?? image.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(image);
    if (out.length >= limit) break;
  }
  return out;
}
