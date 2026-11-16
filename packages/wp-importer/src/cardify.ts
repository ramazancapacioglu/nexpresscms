import type { BlockNode } from "@nexpress/core";

const PLAIN = new Set(["heading", "paragraph", "list_element", "quote", "button_row", "button_element", "divider_spacer"]);
/** Görsel zenginlik taşıyan bloklar: bunlardan en fazla biri olan sayfa "düz metin" sayılır. */
const RICH = new Set(["bento_features", "info_box", "contact_campaign", "campaign_showcase", "dynamic_list", "hero", "gallery", "faq_accordion", "data_table", "schema_card", "review_box"]);
export const CARD_CLASS = "yb-card nx-text-card";

const countRich = (nodes: BlockNode[]): number => nodes.reduce((sum, node) => sum + (RICH.has(node.type) ? 1 : 0) + countRich(node.children ?? []), 0);

const isHeading = (node: BlockNode) => node.type === "heading" && /^h[23]$/.test(String(node.props?.level ?? "h2"));

export interface CardifyResult {
  blocks: BlockNode[];
  lists: number;
  groups: number;
}

/**
 * Düz metin sayfaları kullanıcı dostu yapar: uzun madde listeleri kart ızgarasına (`listType: "cards"`), başlık + metin
 * öbekleri kart bantlarına dönüşür. Zengin (kart, form, vitrin içeren) sayfalara dokunulmaz; tekrar çalıştırılınca değişmez.
 */
export function cardifyPlainBlocks(blocks: BlockNode[], opts: { minListItems?: number } = {}): CardifyResult {
  const minItems = opts.minListItems ?? 4;
  let lists = 0;
  let groups = 0;

  const convertLists = (node: BlockNode): BlockNode => {
    let next = node;
    if (node.type === "list_element" && Array.isArray(node.props?.items) && node.props.items.length >= minItems) {
      const type = String(node.props.listType ?? "check");
      if (type !== "numbered" && type !== "cards") {
        lists += 1;
        next = { ...node, props: { ...node.props, listType: "cards" } };
      }
    }
    return next.children ? { ...next, children: next.children.map(convertLists) } : next;
  };

  /** Doğrudan düz çocukları olan bir kapta, her başlık + sonrasındaki metinler bir kart olur (en az iki öbek varsa). */
  const group = (children: BlockNode[]): BlockNode[] => {
    const starts = children.map((child, index) => (isHeading(child) ? index : -1)).filter((index) => index >= 0);
    if (starts.length < 2) return children;
    const out: BlockNode[] = [];
    let cursor = 0;
    for (let s = 0; s < starts.length; s += 1) {
      const from = starts[s]!;
      let to = from + 1;
      while (to < children.length && !isHeading(children[to]!) && PLAIN.has(children[to]!.type)) to += 1;
      const body = children.slice(from + 1, to);
      out.push(...children.slice(cursor, from));
      if (body.some((node) => node.type === "paragraph" || node.type === "list_element")) {
        groups += 1;
        out.push({ id: `${children[from]!.id}_card`, type: "section", props: { containerMode: "full" }, style: { cssClass: CARD_CLASS }, children: children.slice(from, to) } as BlockNode);
      } else out.push(...children.slice(from, to));
      cursor = to;
    }
    out.push(...children.slice(cursor));
    return out;
  };

  const walk = (node: BlockNode): BlockNode => {
    if (!node.children) return node;
    const alreadyCard = node.style?.cssClass?.includes("nx-text-card");
    const inner = node.children.map(walk);
    if ((node.type === "section" || node.type === "column") && !alreadyCard) return { ...node, children: group(inner) };
    return { ...node, children: inner };
  };

  const plainPage = countRich(blocks) <= 1;
  let out = blocks.map(convertLists);
  if (plainPage) {
    const rooted = out.map(walk);
    out = group(rooted);
  }
  return { blocks: out, lists, groups };
}
