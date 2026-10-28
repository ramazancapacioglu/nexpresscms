import { DomUtils, parseDocument } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import { sanitizeInlineHtml, type BlockNode } from "@nexpress/core";

/**
 * WordPress HTML'ini (klasik editör, Gutenberg, sayfa oluşturucu kalıntıları) NexPress blok AST'sine çevirir.
 * Saf mantık: ağ yok. Çıktı yalnızca bilinen blok türlerinden oluşur; betik, stil, form ve yabancı iframe atılır.
 */
export interface ConvertResult {
  blocks: BlockNode[];
  /** Bloklarda geçen görsel adresleri (mutlak, tekil) */
  images: string[];
  strippedShortcodes: number;
  warnings: string[];
  firstParagraph: string;
}

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre", "figure", "hr", "table", "iframe", "img"]);
const CONTAINER_TAGS = new Set(["div", "section", "article", "main", "aside", "header", "footer", "center", "details", "summary", "body", "html", "figcaption"]);
const SKIP_TAGS = new Set(["script", "style", "noscript", "form", "input", "button", "select", "textarea", "svg", "object", "embed", "template"]);
const BUILDER_SHORTCODE = /\[\/?(?:vc_[a-z0-9_]+|et_pb_[a-z0-9_]+|elementor[a-z0-9_-]*|rev_slider[a-z0-9_]*|fusion_[a-z0-9_]+|av_[a-z0-9_]+)(?:\s[^\]]*)?\]/gi;
const GUTENBERG_COMMENT = /<!--\s*\/?wp:[\s\S]*?-->/gi;
const ANY_SHORTCODE = /\[(\/?)([a-z][a-z0-9_-]*)(?:\s[^\]]*)?\]/gi;

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function toEmbedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id && /^\d{4,12}$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

function wpautop(s: string): string {
  if (/<(p|div|h[1-6]|ul|ol|table|blockquote|pre|figure|section|article)\b/i.test(s)) return s;
  return s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`).join("\n");
}

function absolute(url: string, base: string): string | null {
  const u = url.trim();
  if (!u || u.startsWith("data:") || u.startsWith("#")) return null;
  try {
    const abs = new URL(u, base || undefined);
    return abs.protocol === "http:" || abs.protocol === "https:" ? abs.toString() : null;
  } catch {
    return null;
  }
}

export function convertWpHtml(rawHtml: string, opts: { baseUrl?: string } = {}): ConvertResult {
  const base = opts.baseUrl ?? "";
  const warnings: string[] = [];
  const unknown = new Set<string>();
  let stripped = 0;

  let html = rawHtml.replace(GUTENBERG_COMMENT, () => (stripped++, ""));
  html = html.replace(BUILDER_SHORTCODE, () => (stripped++, ""));
  // [caption]…[/caption] içeriği korunur; [embed]url[/embed] düz adrese döner; diğerleri atılır ve bildirilir
  html = html.replace(/\[embed[^\]]*\]([\s\S]*?)\[\/embed\]/gi, (_m, url: string) => `<p>${url.trim()}</p>`);
  html = html.replace(ANY_SHORTCODE, (_m, _close: string, name: string) => {
    if (name.toLowerCase() === "caption") return "";
    stripped++;
    unknown.add(name.toLowerCase());
    return "";
  });
  if (unknown.size) warnings.push(`Desteklenmeyen kısa kodlar atıldı: ${[...unknown].slice(0, 10).join(", ")}`);
  html = wpautop(html.trim());

  const doc = parseDocument(html, { decodeEntities: true });
  const blocks: BlockNode[] = [];
  const images: string[] = [];
  let n = 0;
  let firstParagraph = "";
  const id = () => `wp_${++n}`;
  const push = (type: BlockNode["type"], props: Record<string, unknown>) => blocks.push({ id: id(), type, props } as BlockNode);
  const addImage = (url: string) => { if (!images.includes(url)) images.push(url); };

  const imageBlock = (el: Element, caption = ""): boolean => {
    const src = [el.attribs["data-src"], el.attribs["data-lazy-src"], el.attribs.src].map((s) => (s ? absolute(s, base) : null)).find(Boolean);
    if (!src) return false;
    addImage(src);
    const props: Record<string, unknown> = { url: src, altText: squash(el.attribs.alt ?? "") };
    if (el.attribs.title) props.titleText = squash(el.attribs.title);
    if (caption) props.caption = caption;
    push("image_figure", props);
    return true;
  };

  const rawText = (nodes: AnyNode[]): string =>
    nodes.map((nd) => (nd.type === "text" ? nd.data : nd.type === "tag" ? (nd.name === "br" ? " " : rawText(nd.children)) : "")).join("");
  const plain = (nodes: AnyNode[]) => squash(rawText(nodes));

  let run: AnyNode[] = [];
  const flush = () => {
    const nodes = run;
    run = [];
    if (nodes.length === 0) return;
    const imgs = nodes.flatMap((nd) => (nd.type === "tag" ? (nd.name === "img" ? [nd as Element] : DomUtils.findAll((e) => e.name === "img", [nd]).map((e) => e as Element)) : []));
    for (const img of imgs) DomUtils.removeElement(img);
    const live = nodes.filter((nd) => !(nd.type === "tag" && nd.name === "img"));
    const htmlOut = sanitizeInlineHtml(live.map((nd) => DomUtils.getOuterHTML(nd, { encodeEntities: "utf8" })).join("")).replace(/\s*(<br \/>\s*)+$/g, "").trim();
    const textOut = plain(live);
    if (textOut) {
      const embed = /^https?:\/\/\S+$/.test(textOut) ? toEmbedUrl(textOut) : null;
      if (embed) push("video_embed", { url: embed, title: "Video" });
      else {
        if (!firstParagraph && textOut.length >= 40) firstParagraph = textOut;
        push("paragraph", /<[a-z]/i.test(htmlOut) ? { html: htmlOut, text: textOut } : { text: textOut });
      }
    }
    for (const img of imgs) imageBlock(img);
  };

  const walk = (nodes: AnyNode[]) => {
    for (const node of nodes) {
      if (node.type === "comment" || node.type === "directive") continue;
      if (node.type === "text") { run.push(node); continue; }
      if (node.type !== "tag") continue; // script/style düğümleri de burada düşer
      const el = node as Element;
      const tag = el.name.toLowerCase();
      if (SKIP_TAGS.has(tag)) continue;
      if (!BLOCK_TAGS.has(tag) && !CONTAINER_TAGS.has(tag)) { run.push(el); continue; } // satır içi (a, strong, span…)
      flush();
      if (CONTAINER_TAGS.has(tag)) { walk(el.children); flush(); continue; }
      switch (tag) {
        case "p": { run = [...el.children]; flush(); break; }
        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
          const text = plain(el.children);
          if (text) push("heading", { level: tag === "h3" ? "h3" : tag === "h1" || tag === "h2" ? "h2" : "h4", text });
          break;
        }
        case "ul": case "ol": {
          const items = DomUtils.getChildren(el).filter((c): c is Element => c.type === "tag" && c.name === "li").map((li) => plain(li.children)).filter(Boolean);
          if (items.length) push("list_element", { items, listType: tag === "ol" ? "numbered" : "bullet", ordered: tag === "ol" });
          break;
        }
        case "blockquote": {
          const cite = DomUtils.findOne((e) => e.name === "cite" || e.name === "footer", el.children);
          const author = cite ? plain([cite]).replace(/^[—–-]\s*/, "") : "";
          if (cite) DomUtils.removeElement(cite);
          const paras = DomUtils.findAll((e) => e.name === "p", el.children).map((p) => plain(p.children)).filter(Boolean);
          const text = paras.length ? paras.join("\n") : plain(el.children);
          if (text) push("quote", author ? { text, author } : { text });
          break;
        }
        case "pre": {
          const code = DomUtils.findOne((e) => e.name === "code", el.children);
          const cls = `${el.attribs.class ?? ""} ${code?.attribs.class ?? ""}`;
          const lang = /(?:language|lang)-([\w+#-]+)/i.exec(cls)?.[1]?.toLowerCase() ?? "text";
          const body = DomUtils.textContent(code ? [code] : el.children).replace(/\n+$/, "");
          if (body.trim()) push("code_block", { language: lang, code: body });
          break;
        }
        case "figure": {
          const img = DomUtils.findOne((e) => e.name === "img", el.children);
          const cap = DomUtils.findOne((e) => e.name === "figcaption", el.children);
          if (img) imageBlock(img, cap ? plain(cap.children) : "");
          else {
            const iframe = DomUtils.findOne((e) => e.name === "iframe", el.children);
            const embed = iframe?.attribs.src ? toEmbedUrl(iframe.attribs.src) : null;
            if (embed) push("video_embed", { url: embed, title: "Video" });
            else walk(el.children);
          }
          break;
        }
        case "img": imageBlock(el); break;
        case "hr": push("divider_spacer", {}); break;
        case "iframe": {
          const embed = el.attribs.src ? toEmbedUrl(el.attribs.src) : null;
          if (embed) push("video_embed", { url: embed, title: squash(el.attribs.title ?? "") || "Video" });
          else warnings.push("Desteklenmeyen iframe atıldı (yalnızca YouTube/Vimeo alınır).");
          break;
        }
        case "table": {
          const rows = DomUtils.findAll((e) => e.name === "tr", el.children);
          const cells = (tr: Element) => DomUtils.getChildren(tr).filter((c): c is Element => c.type === "tag" && (c.name === "td" || c.name === "th")).map((c) => plain(c.children));
          const grid = rows.map(cells).filter((r) => r.length);
          const headRow = rows.find((r) => DomUtils.getChildren(r).some((c) => c.type === "tag" && (c as Element).name === "th"));
          const headers = headRow ? cells(headRow) : grid[0] ?? [];
          const body = headRow ? rows.filter((r) => r !== headRow).map(cells).filter((r) => r.length) : grid.slice(1);
          if (headers.length) push("data_table", { headers, rows: body });
          break;
        }
      }
    }
  };
  walk(doc.children);
  flush();
  return { blocks, images, strippedShortcodes: stripped, warnings: [...new Set(warnings)], firstParagraph };
}
