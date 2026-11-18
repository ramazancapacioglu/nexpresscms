import type { BlockNode } from "@nexpress/core";
import { stripTags } from "./page-tidy";

const PLAIN = new Set(["heading", "paragraph", "list_element", "quote", "button_row", "button_element", "divider_spacer"]);
/** Görsel zenginlik taşıyan bloklar: bunlardan en fazla biri olan sayfa "düz metin" sayılır. */
const RICH = new Set(["bento_features", "info_box", "contact_campaign", "campaign_showcase", "dynamic_list", "hero", "gallery", "faq_accordion", "data_table", "schema_card", "review_box"]);
export const CARD_CLASS = "yb-card nx-text-card";

const countRich = (nodes: BlockNode[]): number => nodes.reduce((sum, node) => sum + (RICH.has(node.type) ? 1 : 0) + countRich(node.children ?? []), 0);

const isHeading = (node: BlockNode) => node.type === "heading" && /^h[23]$/.test(String(node.props?.level ?? "h2"));


const BULLET = /^\s*[•·▪●■◦*\-–—]\s+/;
const mkId = (base: string, n: number) => `${base}_x${n}`;

/**
 * `<br>` ile satırlara bölünmüş uzun paragrafları düzenler: madde işaretli veya kısa satır dizileri `list_element` olur,
 * kısa ve ":" ile biten ya da tamamı kalın satırlar başlığa dönüşür, uzun cümleler paragraf kalır. Satır sayısı azsa dokunmaz.
 */
export function explodeLineParagraphs(blocks: BlockNode[]): { blocks: BlockNode[]; exploded: number } {
  let exploded = 0;
  const split = (node: BlockNode): BlockNode[] => {
    const html = typeof node.props?.html === "string" ? node.props.html : "";
    if (node.type !== "paragraph" || !/<br\s*\/?>/i.test(html)) return [node];
    const lines = html.split(/<br\s*\/?>/i).map((line) => ({ html: line.trim(), text: stripTags(line) })).filter((line) => line.text);
    if (lines.length < 4) return [node];
    const kind = (line: { html: string; text: string }): "bullet" | "heading" | "short" | "long" => {
      if (BULLET.test(line.text)) return "bullet";
      if (/^<(strong|b)>[^<]{3,90}<\/(strong|b)>:?$/i.test(line.html) || (line.text.length <= 70 && /:$/.test(line.text))) return "heading";
      return line.text.length <= 260 ? "short" : "long";
    };
    const kinds = lines.map(kind);
    const bullets = kinds.filter((k) => k === "bullet").length;
    const listish = kinds.filter((k) => k === "bullet" || k === "short").length;
    // Madde işaretli satırlar liste sayılır; işaretsiz satırlar düzyazı da olabilir: en az 6 kısa satır yoksa dokunulmaz
    if (bullets < 3 && listish < 6) return [node];
    const out: BlockNode[] = [];
    let run: string[] = [];
    let n = 0;
    const flush = () => {
      if (run.length >= 3) out.push({ id: mkId(node.id, n++), type: "list_element", props: { listType: "cards", items: run } } as BlockNode);
      else if (run.length > 0) out.push({ id: mkId(node.id, n++), type: "paragraph", props: { text: run.join(" ") } } as BlockNode);
      run = [];
    };
    lines.forEach((line, index) => {
      const k = kinds[index]!;
      if (k === "bullet" || k === "short") run.push(line.text.replace(BULLET, "").trim());
      else {
        flush();
        if (k === "heading") out.push({ id: mkId(node.id, n++), type: "heading", props: { level: "h3", text: line.text.replace(/:$/, "") } } as BlockNode);
        else out.push({ id: mkId(node.id, n++), type: "paragraph", props: { text: line.text } } as BlockNode);
      }
    });
    flush();
    exploded += 1;
    return out;
  };
  const walk = (nodes: BlockNode[]): BlockNode[] => nodes.flatMap((node) => split(node.children ? { ...node, children: walk(node.children) } : node));
  return { blocks: walk(blocks), exploded };
}


const VERTICAL = ["paddingTop", "paddingBottom", "marginTop", "marginBottom"] as const;
const px = (value: unknown) => (typeof value === "string" && /^-?\d+(\.\d+)?px$/.test(value.trim()) ? Number.parseFloat(value) : null);

/**
 * Dikey ritmi tasarıma göre düzenler: kaynak sitenin satır boşlukları (Kadence satır dolguları) ölçü değildir. Kapsayıcı bloklar
 * (`section`, `columns`, `column`) zaten tutarlı aralık verir; bu yüzden zemini ve kenarlığı olmayan bloktaki dikey dolgu ve kenar boşluğu
 * kaldırılır, zemini veya kenarlığı olan (bant, kart) bloktaki dolgu 28 px ile sınırlanır. Yan dolgulara dokunulmaz. Tekrar çalıştırılabilir.
 */
export function normalizeBlockSpacing(blocks: BlockNode[]): { blocks: BlockNode[]; changed: number } {
  let changed = 0;
  const fix = (values: Record<string, unknown> | undefined, boxed: boolean): Record<string, unknown> | undefined => {
    if (!values) return values;
    const next = { ...values };
    for (const key of VERTICAL) {
      const n = px(next[key]);
      if (n === null || n === 0) continue;
      const wanted = boxed && key.startsWith("padding") ? Math.min(n, 28) : 0;
      if (wanted === n) continue;
      if (wanted === 0) delete next[key];
      else next[key] = `${wanted}px`;
      changed += 1;
    }
    return next;
  };
  const walk = (node: BlockNode): BlockNode => {
    let next = node;
    const style = node.style as Record<string, unknown> | undefined;
    if (style) {
      const boxed = Boolean(style.backgroundColor || style.background || style.backgroundGradient || style.backgroundImage || style.borderWidth || style.borderColor);
      const fixed = fix(style, boxed) as Record<string, unknown>;
      const tablet = fix(style.tablet as Record<string, unknown> | undefined, boxed);
      const mobile = fix(style.mobile as Record<string, unknown> | undefined, boxed);
      next = { ...node, style: { ...fixed, ...(tablet ? { tablet } : {}), ...(mobile ? { mobile } : {}) } as BlockNode["style"] };
    }
    return next.children ? { ...next, children: next.children.map(walk) } : next;
  };
  return { blocks: blocks.map(walk), changed };
}


/** Dar sütunda (yarıdan az genişlik) bölünmüş liste kartları okunmaz: düz paragrafa geri döner. Daha önce bölünmüş içeriği de onarır. */
export function revertNarrowExploded(blocks: BlockNode[]): { blocks: BlockNode[]; reverted: number } {
  let reverted = 0;
  const walk = (node: BlockNode, narrow: boolean): BlockNode => {
    const isNarrow = narrow || (node.type === "column" && typeof node.props?.widthPct === "number" && node.props.widthPct <= 50);
    if (isNarrow && node.type === "list_element" && node.props?.listType === "cards" && /_x\d+$/.test(node.id) && Array.isArray(node.props.items)) {
      reverted += 1;
      const items = (node.props.items as unknown[]).map(String);
      return { id: node.id.replace(/_x\d+$/, "_p"), type: "paragraph", props: { text: items.join(" "), html: items.join("<br />") } } as BlockNode;
    }
    return node.children ? { ...node, children: node.children.map((child) => walk(child, isNarrow)) } : node;
  };
  return { blocks: blocks.map((node) => walk(node, false)), reverted };
}


const imageId = (url: unknown) => (typeof url === "string" ? url.split("?")[0]!.split("/").pop() ?? "" : "");

/**
 * Görselleri düzenler: galeride aynı görselin tekrarı (kaynaktaki kaydırıcı kopyaları) kalkar; boş alt metni olan görsel,
 * kendinden önceki son başlığın (yoksa sayfa başlığının) metnini alır. Alt metin erişilebilirlik ve görsel SEO içindir.
 */
export function tidyImages(blocks: BlockNode[], pageTitle: string): { blocks: BlockNode[]; deduped: number; alts: number } {
  let deduped = 0;
  let alts = 0;
  let lastHeading = "";
  const walk = (node: BlockNode): BlockNode => {
    let next = node;
    if (node.type === "heading" && typeof node.props?.text === "string") lastHeading = stripTags(node.props.text);
    const label = lastHeading || pageTitle;
    if (node.type === "gallery" && Array.isArray(node.props?.items)) {
      const seen = new Set<string>();
      const items = (node.props.items as Array<Record<string, unknown>>).filter((item) => {
        const key = imageId(item.url);
        if (!key) return true;
        if (seen.has(key)) {
          deduped += 1;
          return false;
        }
        seen.add(key);
        return true;
      }).map((item, index) => {
        if (typeof item.alt === "string" && item.alt.trim()) return item;
        alts += 1;
        return { ...item, alt: `${label} – ${index + 1}` };
      });
      next = { ...node, props: { ...node.props, items } };
    }
    if (node.type === "image_figure" && !String(node.props?.altText ?? "").trim() && node.props?.url) {
      alts += 1;
      next = { ...node, props: { ...node.props, altText: label } };
    }
    return next.children ? { ...next, children: next.children.map(walk) } : next;
  };
  return { blocks: blocks.map(walk), deduped, alts };
}

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

  const convertLists = (node: BlockNode, narrow = false): BlockNode => {
    let next = node;
    const isNarrow = narrow || (node.type === "column" && typeof node.props?.widthPct === "number" && node.props.widthPct <= 50);
    if (!isNarrow && node.type === "list_element" && Array.isArray(node.props?.items) && node.props.items.length >= minItems) {
      const type = String(node.props.listType ?? "check");
      if (type !== "numbered" && type !== "cards") {
        lists += 1;
        next = { ...node, props: { ...node.props, listType: "cards" } };
      }
    }
    return next.children ? { ...next, children: next.children.map((child) => convertLists(child, isNarrow)) } : next;
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

  const split = explodeLineParagraphs(blocks);
  const plainPage = countRich(split.blocks) <= 1;
  let out = split.blocks.map((node) => convertLists(node));
  lists += split.exploded;
  if (plainPage) {
    const rooted = out.map(walk);
    out = group(rooted);
  }
  // Dar sütundaki bölünmüş listeler (eski çalıştırmalardan kalanlar dahil) düz paragrafa döner
  const healed = revertNarrowExploded(out);
  out = healed.blocks;
  lists = Math.max(0, lists - healed.reverted);
  return { blocks: out, lists, groups };
}
