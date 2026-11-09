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

function blockText(node: BlockNode): string {
  return plain(node.props?.text) || plain(node.props?.html);
}

/** Octo|Cloud gibi yanlış ayrılmış başlığı yeniden tek paragrafa bağlar. Kart başlığına dokunmaz. */
function rejoinCamel(title: string, body: string): string | null {
  const head = title.trim();
  const rest = body.trim();
  if (head.length < 18 || head.length > 80 || rest.length < 40) return null;
  if (/[.!?:]$/.test(head)) return null;
  const last = head.match(/(\S+)$/)?.[1] ?? "";
  const first = rest.match(/^(\S+)/)?.[1] ?? "";
  if (last.length < 3 || last.length > 5 || !/[a-zçğıöşü]$/.test(last)) return null;
  if (!/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,12}$/.test(first)) return null;
  return `${head}${rest}`;
}

function loosenCaps(text: string): string {
  return text.replace(/([A-ZÇĞİÖŞÜ]{3,})([A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,})/g, "$1 $2");
}

/** Uzun gövdeyi başlıktan indirir, yanlış kesilen markayı birleştirir. */
export function tidyImportedBlocks(blocks: BlockNode[]): { blocks: BlockNode[]; changed: number } {
  let changed = 0;
  const walk = (nodes: BlockNode[]): BlockNode[] => {
    const out: BlockNode[] = [];
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index]!;
      const children = node.children?.length ? walk(node.children) : node.children;
      const current = children === node.children ? node : { ...node, children };
      const follower = nodes[index + 1];
      if ((current.type === "heading" || current.type === "heading_element") && follower && (follower.type === "paragraph" || follower.type === "paragraph_element")) {
        const joined = rejoinCamel(blockText(current), blockText(follower));
        if (joined) {
          changed += 1;
          out.push({ ...follower, type: "paragraph", props: { text: joined } });
          index += 1;
          continue;
        }
      }
      if (current.type === "heading" || current.type === "heading_element") {
        const text = blockText(current);
        if (text.length > 90) {
          changed += 1;
          out.push({ id: current.id, type: "paragraph", props: { text } });
          continue;
        }
      }
      if ((current.type === "paragraph" || current.type === "paragraph_element") && typeof current.props?.text === "string") {
        const spaced = loosenCaps(current.props.text);
        if (spaced !== current.props.text) {
          changed += 1;
          out.push({ ...current, props: { ...current.props, text: spaced } });
          continue;
        }
      }
      out.push(current);
    }
    return out;
  };
  return { blocks: walk(blocks), changed };
}

/** Kırpılmış paragrafı, kaynak sayfadaki daha uzun metinle tamamlar. */
export function extendClippedText(blocks: BlockNode[], sources: string[]): { blocks: BlockNode[]; extended: number } {
  let extended = 0;
  const walk = (node: BlockNode): BlockNode => {
    const children = node.children?.map(walk);
    const text = typeof node.props?.text === "string" ? node.props.text : "";
    const norm = text.replace(/\s+/g, " ").trim();
    const fold = (value: string) => value.replace(/[^\p{L}\p{N}]+/gu, "").toLocaleLowerCase("tr");
    if ((node.type === "paragraph" || node.type === "heading") && norm.length >= 250) {
      const head = fold(norm).slice(0, 70);
      const hit = sources.find((source) => fold(source).startsWith(head) && source.length > norm.length + 15);
      if (hit) {
        extended += 1;
        return { ...node, ...(children ? { children } : {}), props: { ...node.props, text: hit } };
      }
    }
    return children ? { ...node, children } : node;
  };
  return { blocks: blocks.map(walk), extended };
}
