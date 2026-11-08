import type { BlockNode } from "@nexpress/core";
import { splitGluedTitle } from "./bridge-draw";
import { resolveAssetUrl } from "./links";

const IMAGE_URL = /^https?:\/\/\S+\/wp-content\/uploads\/\S+\.(?:webp|png|jpe?g|gif|svg|avif)(?:\?\S*)?$/i;

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function isUploadPath(value: string): boolean {
  return value.startsWith("/wp-content/uploads/") || value.startsWith("//");
}

/** Göreli yükleme yolunu kaynağa bağlar ve yapışık kart başlığını ayırır. */
export function repairImportedBlocks(blocks: BlockNode[], origin: string, images: Set<string>): { blocks: BlockNode[]; split: number } {
  let split = 0;
  const walkValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      const next = isUploadPath(value) ? resolveAssetUrl(value, origin) : value;
      if (IMAGE_URL.test(next)) images.add(next.split("?")[0]!);
      return next;
    }
    if (Array.isArray(value)) return value.map(walkValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, walkValue(item)]));
    }
    return value;
  };
  const walk = (node: BlockNode): BlockNode[] => {
    const props = walkValue(node.props ?? {}) as BlockNode["props"];
    const children = (node.children ?? []).flatMap(walk);
    if (node.type === "paragraph") {
      const html = typeof props.html === "string" ? props.html : "";
      const text = plain(props.text) || plain(html);
      const glued = text && !html.includes("<img") ? splitGluedTitle(text) : null;
      if (glued) {
        split += 1;
        return [
          { id: `${node.id}_h`, type: "heading", props: { text: glued.title, level: "3" } },
          { id: `${node.id}_p`, type: "paragraph", props: { text: glued.body }, ...(children.length ? { children } : {}) },
        ];
      }
    }
    return [{ ...node, props, ...(children.length ? { children } : {}) }];
  };
  return { blocks: blocks.flatMap(walk), split };
}
