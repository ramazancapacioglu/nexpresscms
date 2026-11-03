import type { BlockNode, BlockType } from "./types";
import { isContainerBlock } from "./block-style";

/**
 * Editör ve içe aktarıcılar için izomorfik, değişmez (immutable) blok ağacı yardımcıları.
 */

let blockIdSerial = 0;

export function newBlockId(prefix = "blk"): string {
  blockIdSerial = (blockIdSerial + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}_${blockIdSerial.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Bir blok ağacındaki tüm düğüm kimliklerinin benzersiz olmasını garanti eder.
 * Aynı kimliğe sahip ikinci bir düğüm varsa (veya kimlik boşsa) yalnızca çakışan düğüme
 * yeni benzersiz kimlik verir; çakışma yoksa aynı dizi referansını korur.
 */
export function ensureUniqueBlockIds(blocks: BlockNode[]): BlockNode[] {
  const seen = new Set<string>();
  let mutated = false;

  const walk = (nodes: BlockNode[]): BlockNode[] => {
    let levelMutated = false;
    const nextNodes = nodes.map((node) => {
      const rawId = typeof node.id === "string" ? node.id.trim() : "";
      const needsNewId = !rawId || seen.has(rawId);
      const id = needsNewId ? newBlockId(`blk_${node.type}`) : rawId;
      seen.add(id);

      const nextChildren = node.children ? walk(node.children) : undefined;
      if (needsNewId || nextChildren !== node.children) {
        levelMutated = true;
        mutated = true;
        return {
          ...node,
          id,
          ...(nextChildren ? { children: nextChildren } : {}),
        };
      }
      return node;
    });
    return levelMutated ? nextNodes : nodes;
  };

  const result = walk(blocks);
  return mutated ? result : blocks;
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
  if (parentType === "tabs") return childType === "column";
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

/** Yeni (kütüphaneden sürüklenen) bloğu hedef kapsayıcıya koyar; tür o kapsayıcıya uymuyorsa `null` döner. */
export function placeNewBlock(
  blocks: BlockNode[],
  block: BlockNode,
  targetParentId: string | null,
  targetIndex: number
): BlockNode[] | null {
  const parent = targetParentId ? findBlock(blocks, targetParentId) : null;
  if (targetParentId && !parent) return null;
  if (!canInsertInto(parent?.type ?? null, block.type)) return null;
  return insertBlockAt(blocks, block, targetParentId, targetIndex);
}

/**
 * Kökteki bloktan hedef bloğa (`id` dahil) uzanan ata zincirini döner.
 * Alt durum çubuğu (breadcrumb) ve yapı gezgini için kullanılır.
 */
export function getBlockAncestors(blocks: BlockNode[], id: string): BlockNode[] {
  for (const b of blocks) {
    if (b.id === id) return [b];
    if (b.children?.length) {
      const sub = getBlockAncestors(b.children, id);
      if (sub.length > 0) return [b, ...sub];
    }
  }
  return [];
}

/**
 * Yapı Gezgini ve alt durum çubuğu için bloğun kısa metin/düzen özetini üretir.
 */
export function summarizeBlockPreview(block: BlockNode): string {
  const p = (block.props ?? {}) as Record<string, any>;
  if (block.type === "columns") {
    const layout = typeof p.layout === "string" ? p.layout : `${(block.children ?? []).length} sütun`;
    return layout;
  }
  if (block.type === "column") {
    if (typeof p.label === "string" && p.label.trim()) return p.label.trim();
    return typeof p.widthPct === "number" ? `${p.widthPct}%` : "";
  }
  if (block.type === "tabs") {
    const count = Math.max(
      Array.isArray(p.items) ? p.items.length : 0,
      (block.children ?? []).length
    );
    return `${count} sekme`;
  }
  if (block.type === "section") {
    const title = typeof p.title === "string" && p.title.trim() ? p.title.trim() : "";
    const mode = p.containerMode === "full" ? "Tam" : p.containerMode === "narrow" ? "Dar" : "Kutu";
    return title ? `${title.slice(0, 24)} · ${mode}` : mode;
  }
  const rawText =
    p.text ||
    p.title ||
    p.label ||
    p.quote ||
    p.summary ||
    p.itemName ||
    p.altText ||
    (typeof p.html === "string" ? p.html.replace(/<[^>]+>/g, " ") : "");
  if (typeof rawText === "string" && rawText.trim()) {
    const clean = rawText.replace(/\s+/g, " ").trim();
    return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
  }
  if (Array.isArray(p.items)) return `${p.items.length} öğe`;
  if (Array.isArray(p.plans)) return `${p.plans.length} paket`;
  if (Array.isArray(p.steps)) return `${p.steps.length} adım`;
  return "";
}

const REPEATER_BLOCK_TYPES: ReadonlySet<BlockType> = new Set<BlockType>([
  "faq_accordion",
  "tabs",
  "accordion",
  "pricing_table",
  "bento_features",
  "stats_strip",
  "howto_steps",
  "testimonial_grid",
  "icon_list",
  "list_element",
]);

export function canAppendRepeaterItem(type: BlockType): boolean {
  return REPEATER_BLOCK_TYPES.has(type);
}

/**
 * Çok öğeli bloklara (SSS, Sekmeler, Akordiyon, Fiyat Tablosu, Bento, İstatistik, Adımlar, Yorumlar, İkon Listesi)
 * tek tıkla yeni bir varsayılan öğe ekler.
 */
export function appendRepeaterItem(block: BlockNode): BlockNode {
  const props = { ...(block.props ?? {}) } as Record<string, any>;
  switch (block.type) {
    case "faq_accordion": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        question: `Yeni soru ${items.length + 1}?`,
        answer: "Yanıt metnini doğrudan buradan düzenleyebilirsiniz.",
      });
      return { ...block, props: { ...props, items } };
    }
    case "tabs": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      const panes = Array.isArray(block.children) ? [...block.children] : [];
      const nextNum = Math.max(items.length, panes.length) + 1;
      const newLabel = `Sekme ${nextNum}`;
      items.push({
        label: newLabel,
        icon: "sparkles",
        title: `${newLabel} Başlığı`,
        body: "Bu sekmenin açıklama içeriğini buradan düzenleyin.",
      });
      panes.push({
        id: newBlockId("tab"),
        type: "column",
        props: { label: newLabel, icon: "sparkles" },
        children: [
          {
            id: newBlockId("h"),
            type: "heading",
            props: { level: 3, text: `${newLabel} Başlığı` },
          },
          {
            id: newBlockId("p"),
            type: "paragraph",
            props: {
              text: "Bu sekmenin içine satır/sütun düzeni, görsel, liste veya buton ekleyebilirsiniz.",
            },
          },
        ],
      });
      return { ...block, props: { ...props, items }, children: panes };
    }
    case "accordion": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        title: `Panel Başlığı ${items.length + 1}`,
        body: "Bu akordiyon panelinin detay metnini buradan düzenleyin.",
      });
      return { ...block, props: { ...props, items } };
    }
    case "pricing_table": {
      const plans = Array.isArray(props.plans) ? [...props.plans] : [];
      plans.push({
        name: `Paket ${plans.length + 1}`,
        price: "₺1.490",
        period: "/ay",
        badge: "",
        description: "Büyüyen ekipler için kapsamlı paket.",
        features: ["Temel özellik 1", "Gelişmiş özellik 2", "Öncelikli destek"],
        ctaText: "Hemen Başla",
        ctaHref: "/tr/iletisim",
        highlighted: false,
      });
      return { ...block, props: { ...props, plans } };
    }
    case "bento_features": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        tag: "ÖZELLİK",
        title: `Yeni Özellik ${items.length + 1}`,
        description: "Özelliğin sağladığı somut faydayı kısaca açıklayın.",
        icon: "sparkles",
        span: 4,
      });
      return { ...block, props: { ...props, items } };
    }
    case "stats_strip": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        value: "99.9%",
        label: `Yeni Metrik ${items.length + 1}`,
      });
      return { ...block, props: { ...props, items } };
    }
    case "howto_steps": {
      const steps = Array.isArray(props.steps) ? [...props.steps] : [];
      steps.push({
        title: `${steps.length + 1}. Adım Başlığı`,
        text: "Bu adımda yapılacak işlemi net ve kısa bir dille açıklayın.",
      });
      return { ...block, props: { ...props, steps } };
    }
    case "testimonial_grid": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        quote: "Bu altyapı sayesinde yayın ve hız hedeflerimize çok kısa sürede ulaştık.",
        author: "Yeni Müşteri",
        role: "Teknoloji Direktörü",
        rating: 5,
      });
      return { ...block, props: { ...props, items } };
    }
    case "icon_list": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push({
        icon: "check",
        title: `Liste Öğesi ${items.length + 1}`,
        description: "Kısa açıklama metni.",
      });
      return { ...block, props: { ...props, items } };
    }
    case "list_element": {
      const items = Array.isArray(props.items) ? [...props.items] : [];
      items.push(`Yeni liste maddesi ${items.length + 1}`);
      return { ...block, props: { ...props, items } };
    }
    default:
      return block;
  }
}
