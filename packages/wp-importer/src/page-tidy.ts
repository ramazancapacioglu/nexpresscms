import type { BlockNode } from "@nexpress/core";
import { sanitizeInlineHtml } from "@nexpress/core";

/** İçe aktarılmış blok ağacını düzenleyen saf yardımcılar: renk paleti, SSS metni, çapa menüsü. Ağ ve veritabanı yoktur. */

const decode = (value: string) =>
  value
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&#8217;|&apos;/g, "'")
    .replace(/&quot;|&#8221;|&#8220;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export const stripTags = (value: string) => decode(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ renk */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseColor(value: string): Rgb | null {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/.exec(v);
  return rgb ? { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) } : null;
}

function hsl({ r, g, b }: Rgb): { s: number; l: number } {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  return { s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l };
}

/**
 * Renk tema paletinin içinde mi? Nötr (gri, beyaz, siyaha yakın), çok açık tonlar ve paletteki bir renge yakın değerler
 * serbesttir; geri kalan doygun renkler (ör. turuncu `#f76a0c`) palet dışıdır.
 */
export function colorInPalette(value: string, palette: string[]): boolean {
  const c = parseColor(value);
  if (!c) return true;
  const { s, l } = hsl(c);
  if (s < 0.22 || l > 0.92 || l < 0.1) return true;
  return palette.some((hex) => {
    const p = parseColor(hex);
    return p ? Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b) <= 48 : false;
  });
}

const COLOR_KEYS = new Set(["textColor", "backgroundColor", "borderColor", "color", "bgColor", "iconColor", "overlayColor"]);

/** Palet dışı renkleri kaldırır; blok kendi sınıfındaki (tema) rengine döner. Satır içi HTML'deki `color:` da temizlenir. */
export function sanitizeBlockColors(blocks: BlockNode[], palette: string[]): { blocks: BlockNode[]; removed: number } {
  let removed = 0;
  const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (COLOR_KEYS.has(key) && typeof value === "string" && !colorInPalette(value, palette)) {
        removed += 1;
        continue;
      }
      out[key] = typeof value === "string" && /style=/i.test(value) ? cleanHtml(value) : value;
    }
    return out;
  };
  const cleanHtml = (html: string) =>
    html.replace(/(\sstyle="[^"]*?)(?:^|;)?\s*color\s*:\s*([^;"]+)(;?)/gi, (full, head: string, color: string, tail: string) => {
      if (colorInPalette(color, palette)) return full;
      removed += 1;
      return `${head}${tail}`;
    });
  const walk = (node: BlockNode): BlockNode => ({
    ...node,
    props: cleanObject(node.props ?? {}),
    ...(node.style ? { style: cleanObject(node.style as Record<string, unknown>) as BlockNode["style"] } : {}),
    ...(node.children ? { children: node.children.map(walk) } : {}),
  });
  return { blocks: blocks.map(walk), removed };
}

/* ------------------------------------------------------------------- SSS */

/**
 * SSS maddeleri: soru düz metin olur (`<strong>` görünür yazı kalmaz), cevap izinli satır içi HTML'e süzülür.
 * Akordiyon tek açık kalır, ilk madde açık başlar; biçim ve simge yoksa kart tarzı eklenir.
 */
export function tidyFaqBlocks(blocks: BlockNode[]): { blocks: BlockNode[]; fixed: number } {
  let fixed = 0;
  const walk = (node: BlockNode): BlockNode => {
    let next = node;
    if (node.type === "faq_accordion" && Array.isArray(node.props?.items)) {
      const items = (node.props.items as Array<Record<string, unknown>>).map((item) => {
        const question = String(item?.question ?? "");
        const answer = String(item?.answer ?? "");
        const cleanQ = stripTags(question);
        const cleanA = /<[a-z]/i.test(answer) ? sanitizeInlineHtml(answer).trim() : answer;
        if (cleanQ !== question || cleanA !== answer) fixed += 1;
        return { ...item, question: cleanQ, answer: cleanA };
      });
      next = {
        ...node,
        props: {
          ...node.props,
          items,
          exclusive: node.props.exclusive ?? true,
          openMode: node.props.openMode ?? "first",
          accordionStyle: node.props.accordionStyle ?? "accent",
          icon: node.props.icon ?? "plus",
        },
      };
    }
    return next.children ? { ...next, children: next.children.map(walk) } : next;
  };
  return { blocks: blocks.map(walk), fixed };
}

/* ----------------------------------------------------------------- çapa */

const norm = (value: string) => stripTags(value).toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const anchorOf = (node: BlockNode): string => {
  const own = typeof node.style?.anchorId === "string" ? node.style.anchorId : typeof node.props?.anchorId === "string" ? node.props.anchorId : "";
  return own.replace(/^#+/, "").trim();
};

function walkAll(nodes: BlockNode[], visit: (node: BlockNode) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.children) walkAll(node.children, visit);
  }
}

/**
 * Sayfada aynı sayfadaki bölümlere (`#bolum`) giden bağlantılar ve hedef çapaları varsa yapışkan çapa menüsü.
 * Hedefi olmayan bağlantı atılır; üçten az bağlantı menü sayılmaz. Etiket kart/düğme başlığından gelir.
 */
export function buildAnchorNav(blocks: BlockNode[]): BlockNode | null {
  const targets = new Map<string, string>();
  walkAll(blocks, (node) => {
    const id = anchorOf(node);
    if (id) targets.set(id.toLowerCase(), id);
  });
  const items: Array<{ label: string; href: string }> = [];
  const seen = new Set<string>();
  const consider = (value: unknown, depth: number): void => {
    if (depth > 4 || !value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const entry of value) consider(entry, depth + 1);
      return;
    }
    const row = value as Record<string, unknown>;
    const href = typeof row.href === "string" ? row.href : "";
    if (href.startsWith("#")) {
      const target = targets.get(href.slice(1).toLowerCase());
      const label = stripTags(String(row.title ?? row.label ?? row.text ?? row.name ?? ""));
      if (target && label && !seen.has(target)) {
        seen.add(target);
        items.push({ label: label.slice(0, 40), href: `#${target}` });
      }
    }
    for (const entry of Object.values(row)) if (entry && typeof entry === "object") consider(entry, depth + 1);
  };
  walkAll(blocks, (node) => {
    if (node.type === "anchor_nav" || node.type === "toc") return;
    consider(node.props, 0);
  });
  if (items.length < 3) return null;
  return { id: "wp_anchor_nav", type: "anchor_nav", props: { title: "Bölümler", sticky: true, styleVariant: "underline", items: items.slice(0, 10) } };
}

export interface TocEntry {
  id: string;
  label: string;
}

/** Kaynak sayfadaki "İçindekiler" bloğunun (`kb-table-of-content-nav`) girdileri. */
export function parseTocEntries(html: string): TocEntry[] {
  const nav = /<nav[^>]*kb-table-of-content-nav[\s\S]*?<\/nav>/i.exec(html)?.[0] ?? "";
  const out: TocEntry[] = [];
  const seen = new Set<string>();
  for (const m of nav.matchAll(/<a [^>]*href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = decode(m[1] ?? "").trim();
    const label = stripTags(m[2] ?? "");
    if (id && label && !seen.has(id)) {
      seen.add(id);
      out.push({ id, label });
    }
  }
  return out;
}

/**
 * İçindekiler girdilerini aynı metinli başlıklara çapa olarak yazar; eşleşen girdilerle `toc` ya da (en çok 8 girdide, sayfada)
 * yapışkan `anchor_nav` bloğu döner.
 */
export function assignHeadingAnchors(blocks: BlockNode[], entries: TocEntry[]): { blocks: BlockNode[]; items: Array<{ label: string; href: string }> } {
  const byText = new Map(entries.map((entry) => [norm(entry.label), entry]));
  const matched = new Map<string, TocEntry>();
  const walk = (node: BlockNode): BlockNode => {
    let next = node;
    if (node.type === "heading" && typeof node.props?.text === "string") {
      const entry = byText.get(norm(node.props.text));
      if (entry && !matched.has(entry.id)) {
        matched.set(entry.id, entry);
        next = { ...node, style: { ...(node.style ?? {}), anchorId: entry.id } };
      }
    }
    return next.children ? { ...next, children: next.children.map(walk) } : next;
  };
  const out = blocks.map(walk);
  const items = entries.filter((entry) => matched.has(entry.id)).map((entry) => ({ label: entry.label.slice(0, 60), href: `#${entry.id}` }));
  return { blocks: out, items };
}
