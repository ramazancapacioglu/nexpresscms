import type { BlockNode, BlockType } from "./types";
import { isContainerBlock } from "./block-style";

/**
 * Editör ve içe aktarıcılar için izomorfik, değişmez (immutable) blok ağacı yardımcıları.
 */

export function newBlockId(prefix = "blk"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function cloneBlockWithNewIds(block: BlockNode): BlockNode {
  return {
    ...structuredClone(block),
    id: newBlockId(),
    children: block.children?.map(cloneBlockWithNewIds),
  };
}

export function findBlock(blocks: BlockNode[], id: string): BlockNode | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

export interface BlockLocation {
  parentId: string | null;
  index: number;
  siblings: BlockNode[];
}

export function locateBlock(
  blocks: BlockNode[],
  id: string,
  parentId: string | null = null
): BlockLocation | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.id === id) return { parentId, index: i, siblings: blocks };
    if (b.children) {
      const found = locateBlock(b.children, id, b.id);
      if (found) return found;
    }
  }
  return null;
}

export function mapBlocks(
  blocks: BlockNode[],
  fn: (b: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map((b) => {
    const mapped = fn(b);
    return mapped.children
      ? { ...mapped, children: mapBlocks(mapped.children, fn) }
      : mapped;
  });
}

export function updateBlockById(
  blocks: BlockNode[],
  id: string,
  updater: (b: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    if (b.children) return { ...b, children: updateBlockById(b.children, id, updater) };
    return b;
  });
}

export function removeBlockById(blocks: BlockNode[], id: string): BlockNode[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.children ? { ...b, children: removeBlockById(b.children, id) } : b));
}

/**
 * Hedef kapsayıcıya (`parentId === null` → kök) belirtilen indekse blok ekler.
 */
export function insertBlockAt(
  blocks: BlockNode[],
  block: BlockNode,
  parentId: string | null = null,
  index = 999999
): BlockNode[] {
  if (parentId === null) {
    const copy = [...blocks];
    copy.splice(Math.min(Math.max(index, 0), copy.length), 0, block);
    return copy;
  }
  return blocks.map((b) => {
    if (b.id === parentId) {
      const kids = [...(b.children ?? [])];
      kids.splice(Math.min(Math.max(index, 0), kids.length), 0, block);
      return { ...b, children: kids };
    }
    if (b.children) return { ...b, children: insertBlockAt(b.children, block, parentId, index) };
    return b;
  });
}

export function isDescendantOf(blocks: BlockNode[], ancestorId: string, id: string): boolean {
  const anc = findBlock(blocks, ancestorId);
  if (!anc) return false;
  return findBlock(anc.children ?? [], id) !== null;
}

/**
 * Bir blok türünün hedef kapsayıcı içine konulup konulamayacağını denetler.
 */
export function canInsertInto(parentType: BlockType | null, childType: BlockType): boolean {
  if (parentType === null) return childType !== "column";
  if (parentType === "columns") return childType === "column";
  if (parentType === "column") return childType !== "column";
  if (parentType === "section") return childType !== "column";
  return false;
}

export function moveBlockTo(
  blocks: BlockNode[],
  id: string,
  targetParentId: string | null,
  targetIndex: number
): BlockNode[] {
  const block = findBlock(blocks, id);
  if (!block) return blocks;
  if (targetParentId === id || (targetParentId && isDescendantOf(blocks, id, targetParentId))) {
    return blocks;
  }
  const targetParent = targetParentId ? findBlock(blocks, targetParentId) : null;
  if (!canInsertInto(targetParent?.type ?? null, block.type)) return blocks;

  const loc = locateBlock(blocks, id);
  let idx = targetIndex;
  if (loc && loc.parentId === targetParentId && loc.index < targetIndex) idx -= 1;
  const without = removeBlockById(blocks, id);
  return insertBlockAt(without, block, targetParentId, idx);
}

export function moveBlockStep(
  blocks: BlockNode[],
  id: string,
  dir: -1 | 1 | "up" | "down"
): BlockNode[] {
  const delta = dir === "up" ? -1 : dir === "down" ? 1 : dir;
  const loc = locateBlock(blocks, id);
  if (!loc) return blocks;
  const target = loc.index + delta;
  if (target < 0 || target >= loc.siblings.length) return blocks;
  const b = loc.siblings[loc.index]!;
  const without = removeBlockById(blocks, id);
  return insertBlockAt(without, b, loc.parentId, target);
}

export function duplicateBlockById(blocks: BlockNode[], id: string): BlockNode[] {
  const loc = locateBlock(blocks, id);
  if (!loc) return blocks;
  const clone = cloneBlockWithNewIds(loc.siblings[loc.index]!);
  return insertBlockAt(blocks, clone, loc.parentId, loc.index + 1);
}

export interface FlatBlockEntry {
  block: BlockNode;
  depth: number;
  parentId: string | null;
}

export function flattenBlocks(
  blocks: BlockNode[],
  depth = 0,
  parentId: string | null = null
): FlatBlockEntry[] {
  const out: FlatBlockEntry[] = [];
  for (const b of blocks) {
    out.push({ block: b, depth, parentId });
    if (b.children) out.push(...flattenBlocks(b.children, depth + 1, b.id));
  }
  return out;
}

/**
 * JSON içe aktarımı (AI çıktısı vb.) için bloğu normalize eder: id, props, style, children ve geçerli tür güvencesi.
 */
export function normalizeImportedBlock(raw: any, fallbackIndex = 0): BlockNode {
  const type = (typeof raw?.type === "string" ? raw.type : "paragraph") as BlockType;
  const node: BlockNode = {
    id: typeof raw?.id === "string" && raw.id ? raw.id : newBlockId(`ai${fallbackIndex}`),
    type,
    variant: typeof raw?.variant === "string" ? raw.variant : undefined,
    props: raw?.props && typeof raw.props === "object" ? raw.props : {},
    gridSpan: raw?.gridSpan,
    style: raw?.style && typeof raw.style === "object" ? raw.style : undefined,
  };
  if (Array.isArray(raw?.children)) {
    node.children = raw.children.map((c: unknown, i: number) => normalizeImportedBlock(c, i));
  } else if (isContainerBlock(type)) {
    node.children = [];
  }
  return node;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
