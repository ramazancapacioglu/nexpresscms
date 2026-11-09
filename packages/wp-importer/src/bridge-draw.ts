import type { BlockNode } from "@nexpress/core";
import { convertWpHtml } from "./html";
import { resolveAssetUrl } from "./links";

/** Başlık ile gövde boşluksuz yapışmışsa ayırır. Marka içindeki büyük harfe (OctoCloud) dokunmaz. */
export function splitGluedTitle(text: string): { title: string; body: string } | null {
  const match = text.match(/^(.{4,70}?)([ıüğşöç])([A-ZÇĞİÖŞÜ].{8,})$/);
  if (!match) return null;
  const title = `${match[1]}${match[2]}`.trim();
  const body = match[3]!.trim();
  if (title.length < 4 || body.length < 8 || /[.!?:]$/.test(title)) return null;
  return { title, body };
}

/** WordPress eklentisinin gönderdiği yerleşim düğümü. Ürün adı taşımaz. */
export interface LayoutNode {
  type?: string;
  text?: string;
  html?: string;
  level?: number;
  url?: string;
  alt?: string;
  href?: string;
  label?: string;
  full?: boolean;
  background?: string;
  overlay?: string;
  color?: string;
  padding?: number;
  ordered?: boolean;
  wpId?: string;
  items?: unknown;
  children?: LayoutNode[];
}

export interface DrawResult {
  blocks: BlockNode[];
  unknown: number;
  images: string[];
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const clip = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

function hex(value: unknown): string | undefined {
  const v = typeof value === "string" ? value.trim() : "";
  return HEX.test(v) ? v : undefined;
}

function spans(count: number, ratio: number[]): number[] {
  const raw = ratio.length === count ? ratio : Array.from({ length: count }, () => 1);
  const sum = raw.reduce((a, b) => a + (b > 0 ? b : 1), 0) || count;
  const out = raw.map((n) => Math.max(1, Math.round(((n > 0 ? n : 1) / sum) * 12)));
  let drift = out.reduce((a, b) => a + b, 0) - 12;
  for (let i = out.length - 1; i >= 0 && drift !== 0; i -= 1) {
    const next = out[i]! - Math.sign(drift);
    if (next >= 1 && next <= 12) {
      out[i] = next;
      drift -= Math.sign(drift);
    }
  }
  return out;
}

/** Yerleşim ağacını blok ağacına çizer. Tanınmayan düğüm düz metne düşer ve sayılır. */
export function drawLayout(nodes: LayoutNode[], opts: { baseUrl?: string } = {}): DrawResult {
  const images: string[] = [];
  let unknown = 0;
  let n = 0;
  let budget = 400;
  const id = () => `br_${++n}`;
  const addImage = (url: string) => {
    const abs = opts.baseUrl ? resolveAssetUrl(url, opts.baseUrl) : url;
    if (abs.startsWith("http://") || abs.startsWith("https://")) {
      if (!images.includes(abs)) images.push(abs);
    }
    return abs;
  };

  const walk = (node: LayoutNode, depth: number): BlockNode[] => {
    if (budget <= 0 || depth > 8) return [];
    budget -= 1;
    const type = (node.type ?? "").toLowerCase();
    const children = Array.isArray(node.children) ? node.children : [];

    if (type === "section" || type === "cover" || type === "group") {
      const inner = children.flatMap((child) => walk(child, depth + 1));
      const style: NonNullable<BlockNode["style"]> = {};
      const background = hex(node.background);
      const overlay = hex(node.overlay);
      const color = hex(node.color);
      if (background) style.backgroundColor = background;
      if (overlay) style.backgroundOverlay = overlay;
      if (color) style.textColor = color;
      if (typeof node.padding === "number" && node.padding > 0 && node.padding <= 160) {
        style.paddingTop = `${Math.round(node.padding)}px`;
        style.paddingBottom = `${Math.round(node.padding)}px`;
      }
      if (node.full) style.blockWidth = "full";
      const blocks: BlockNode[] = [];
      if (type === "cover") {
        blocks.push({ id: id(), type: "tpl_post_title", props: { level: "h1", align: "left", showTldr: true } });
        blocks.push({ id: id(), type: "tpl_featured_image", props: {} });
      }
      blocks.push({ id: id(), type: "section", props: {}, style, children: inner });
      return blocks;
    }

    if (type === "columns" || type === "row") {
      const cols = children.filter((child) => (child.type ?? "").toLowerCase() === "column");
      const source = cols.length > 0 ? cols : children;
      if (source.length === 0) return [];
      const width = spans(source.length, source.map((col) => (typeof col.level === "number" ? col.level : 1)));
      return [{
        id: id(),
        type: "columns",
        props: {},
        children: source.slice(0, 6).map((col, index) => ({
          id: id(),
          type: "column" as const,
          props: {},
          gridSpan: { desktop: width[index] ?? 12, tablet: 12, mobile: 12 },
          children: (Array.isArray(col.children) ? col.children : [col]).flatMap((child) => walk(child, depth + 1)),
        })),
      }];
    }

    if (type === "column") return children.flatMap((child) => walk(child, depth + 1));

    if (type === "heading") {
      const text = clip(node.text, 4000);
      if (!text) return [];
      // Uzun gövde metni başlık gibi gelirse paragrafta kalır; aksi halde dev puntoda akar.
      if (text.length > 90) return [{ id: id(), type: "paragraph", props: { text } }];
      const level = node.level === 1 || node.level === 3 || node.level === 4 ? String(node.level) : "2";
      return [{ id: id(), type: "heading", props: { text, level } }];
    }

    if (type === "paragraph" || type === "text") {
      const html = clip(node.html, 8000);
      const text = clip(node.text, 4000);
      const plain = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const glued = plain && !html.includes("<img") ? splitGluedTitle(plain) : null;
      if (glued) {
        return [
          { id: id(), type: "heading", props: { text: glued.title, level: "3" } },
          { id: id(), type: "paragraph", props: { text: glued.body } },
        ];
      }
      if (!html && !text) return [];
      return [{ id: id(), type: "paragraph", props: html ? { html } : { text } }];
    }

    if (type === "image") {
      const url = addImage(clip(node.url, 500));
      if (!url) return [];
      return [{ id: id(), type: "image_figure", props: { url, altText: clip(node.alt, 180) } }];
    }

    if (type === "button") {
      const label = clip(node.label || node.text, 80);
      const href = clip(node.href, 500);
      if (!label || !href) return [];
      return [{ id: id(), type: "button_row", props: { buttons: [{ label, href }] } }];
    }

    if (type === "list") {
      const items = Array.isArray(node.items) ? node.items.map((item) => clip(item, 300)).filter(Boolean).slice(0, 40) : [];
      if (items.length === 0) return [];
      return [{ id: id(), type: "list_element", props: { items, listType: node.ordered ? "numbered" : "bullet" } }];
    }

    if (type === "accordion") {
      const items = Array.isArray(node.items)
        ? node.items
            .map((item) => {
              const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
              return { title: clip(row.title, 200), body: clip(row.text ?? row.body, 2000) };
            })
            .filter((item) => item.title)
            .slice(0, 20)
        : [];
      if (items.length === 0) return [];
      return [{ id: id(), type: "accordion", props: { items } }];
    }

    if (type === "card") {
      const url = addImage(clip(node.url, 500));
      const desc = clip(node.html, 500);
      return [
        {
          id: id(),
          type: "info_box",
          props: {
            title: clip(node.text, 160) || "Bilgi",
            text: desc,
            description: desc,
            ...(url ? { image: url } : {}),
            href: clip(node.href, 500),
            linkLabel: clip(node.label, 40),
          },
        },
      ];
    }

    if (type === "form") {
      const formId = `frm_wp_${clip(node.wpId, 20).replace(/[^a-z0-9_]/gi, "")}`;
      if (!/^frm_wp_[a-z0-9_]+$/.test(formId)) return [];
      return [{ id: id(), type: "form_block", props: { formId } }];
    }

    if (type === "html") {
      const html = typeof node.html === "string" ? node.html.slice(0, 350_000) : "";
      if (!html.trim()) return [];
      const converted = convertWpHtml(html, { baseUrl: opts.baseUrl });
      for (const image of converted.images) addImage(image);
      if (converted.warnings.length) unknown += 1;
      return converted.blocks;
    }

    const text = clip(node.text, 500) || clip(node.html, 500);
    if (text) {
      unknown += 1;
      return [{ id: id(), type: "paragraph", props: { text } }];
    }
    if (children.length) {
      unknown += 1;
      return children.flatMap((child) => walk(child, depth + 1));
    }
    if (type) unknown += 1;
    return [];
  };

  return { blocks: nodes.flatMap((node) => walk(node, 0)), unknown, images };
}
