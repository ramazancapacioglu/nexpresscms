import { DomUtils } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import { sanitizeInlineHtml, type BlockNode } from "@nexpress/core";
import { resolveAgainstBase, rewriteAbsoluteUrl } from "./links";

export const squash = (s: string) => s.replace(/\s+/g, " ").trim();
export const cls = (el: Element) => el.attribs?.class ?? "";
export const hasCls = (el: Element, token: string) => cls(el).split(/\s+/).includes(token) || cls(el).includes(token);

export function extractClassToken(el: Element, prefix: string): string {
  return cls(el).split(/\s+/).find((c) => c.startsWith(prefix)) ?? "";
}

export function plainText(nodes: AnyNode[]): string {
  const raw = nodes
    .map((nd) => {
      if (nd.type === "text") return nd.data;
      if (nd.type !== "tag") return "";
      const tag = (nd as Element).name.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "svg") return "";
      if (tag === "br") return " ";
      return plainText((nd as Element).children);
    })
    .join("");
  return squash(raw.replace(/Genişletmek/g, ""));
}

export function richInlineHtml(nodes: AnyNode[], baseUrl: string): string {
  const raw = nodes
    .map((nd) => DomUtils.getOuterHTML(nd, { encodeEntities: "utf8" }))
    .join("")
    .replace(/\s*(<br\s*\/?>\s*)+$/gi, "")
    .trim();
  const sanitized = sanitizeInlineHtml(raw);
  if (!baseUrl) return sanitized;
  return sanitized.replace(/href="([^"]+)"/g, (_m, href: string) => {
    const next = rewriteAbsoluteUrl(href, baseUrl, "");
    return `href="${next}"`;
  });
}

export function resolveImgSrc(el: Element, baseUrl: string): string {
  const candidates = [el.attribs?.["data-src"], el.attribs?.["data-lazy-src"], el.attribs?.src];
  for (const raw of candidates) {
    if (!raw) continue;
    const u = raw.trim();
    if (!u || u.startsWith("data:")) continue;
    const abs = resolveAgainstBase(u, baseUrl);
    if (abs) return abs;
  }
  return "";
}

export function resolveLinkHref(raw: string | undefined, baseUrl: string): string {
  if (!raw) return "";
  const u = raw.trim();
  if (!u || u === "#" || u.startsWith("javascript:")) return "";
  if (u.startsWith("tel:") || u.startsWith("mailto:") || u.startsWith("#")) return u;
  if (!baseUrl) return u;
  return rewriteAbsoluteUrl(u, baseUrl, "");
}

export function mergeConsecutiveIconLists(blocks: BlockNode[]): BlockNode[] {
  const out: BlockNode[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === "icon_list" && prev && prev.type === "icon_list") {
      const prevItems = Array.isArray(prev.props?.items) ? prev.props.items : [];
      const curItems = Array.isArray(b.props?.items) ? b.props.items : [];
      prev.props = {
        ...prev.props,
        columns: Math.max(Number(prev.props?.columns ?? 1), Number(b.props?.columns ?? 1)),
        items: [...prevItems, ...curItems],
      };
      continue;
    }
    out.push(b);
  }
  return out;
}

export function trimEdgeSpacers(blocks: BlockNode[]): BlockNode[] {
  let start = 0;
  let end = blocks.length;
  while (start < end && blocks[start]?.type === "divider_spacer" && blocks[start]?.props?.style === "space") start++;
  while (end > start && blocks[end - 1]?.type === "divider_spacer" && blocks[end - 1]?.props?.style === "space") end--;
  return blocks.slice(start, end);
}

export function extractInfoBoxNode(el: Element, base: string, id: () => string, addImage: (u: string) => void): BlockNode | null {
  const titleEl =
    DomUtils.findOne((e) => hasCls(e, "kt-blocks-info-box-title"), [el]) ??
    DomUtils.findOne((e) => /^h[1-6]$/.test(e.name), [el]);
  const textEl =
    DomUtils.findOne((e) => hasCls(e, "kt-blocks-info-box-text"), [el]) ??
    DomUtils.findOne((e) => e.name === "p", [el]);
  const title = titleEl ? plainText(titleEl.children) : "";
  const description = textEl ? plainText(textEl.children) : "";
  if (!title && !description) return null;

  const imgEl = DomUtils.findOne((e) => e.name === "img", [el]);
  const image = imgEl ? resolveImgSrc(imgEl, base) : "";
  if (image) addImage(image);

  const linkEl =
    DomUtils.findOne((e) => e.name === "a" && hasCls(e, "kt-blocks-info-box-link-wrap"), [el]) ??
    DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs?.href), [el]);
  const href = resolveLinkHref(linkEl?.attribs?.href, base);

  return {
    id: id(),
    type: "info_box",
    props: {
      title: title || description.slice(0, 60),
      text: description,
      description,
      ...(image ? { image } : { icon: "layers" }),
      ...(href ? { href } : {}),
    },
  };
}

export function extractIconListNode(el: Element, base: string, id: () => string): BlockNode | null {
  const c = cls(el);
  const colMatch = /kt-svg-icon-list-columns-(\d)/.exec(c);
  const columns = colMatch ? Math.min(3, Math.max(1, Number(colMatch[1]))) : 1;
  const liNodes = DomUtils.findAll((e) => e.name === "li" && hasCls(e, "wp-block-kadence-listitem"), [el]);
  const targets = liNodes.length > 0 ? liNodes : DomUtils.findAll((e) => e.name === "li", [el]);
  const items: Array<{ title: string; href?: string; icon: string }> = [];
  for (const li of targets) {
    const textSpan = DomUtils.findOne((e) => hasCls(e, "kt-svg-icon-list-text"), [li]);
    const title = plainText(textSpan ? textSpan.children : li.children);
    if (!title) continue;
    const linkEl =
      (li.parent?.type === "tag" && (li.parent as Element).name === "a" ? (li.parent as Element) : null) ??
      DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs?.href), [li]);
    const href = resolveLinkHref(linkEl?.attribs?.href, base);
    items.push({ title, icon: "check", ...(href ? { href } : {}) });
  }
  if (items.length === 0) return null;
  return {
    id: id(),
    type: "icon_list",
    props: { columns, items },
  };
}

export function extractAccordionNode(el: Element, id: () => string, fallbackTitle = "Sıkça Sorulan Sorular"): BlockNode | null {
  const panes = DomUtils.findAll((e) => hasCls(e, "wp-block-kadence-pane") || hasCls(e, "kt-accordion-pane"), [el]);
  const items: Array<{ question: string; answer: string }> = [];
  for (const pane of panes) {
    const qNode =
      DomUtils.findOne((e) => hasCls(e, "kt-blocks-accordion-title"), [pane]) ??
      DomUtils.findOne((e) => hasCls(e, "kt-blocks-accordion-header"), [pane]) ??
      DomUtils.findOne((e) => /^h[2-6]$/.test(e.name), [pane]);
    const panelNode =
      DomUtils.findOne((e) => hasCls(e, "kt-accordion-panel-inner"), [pane]) ??
      DomUtils.findOne((e) => hasCls(e, "kt-accordion-panel"), [pane]);
    const question = qNode ? plainText(qNode.children) : "";
    let answer = "";
    if (panelNode) {
      const paras = DomUtils.findAll((e) => e.name === "p" || e.name === "li", [panelNode])
        .map((p) => plainText(p.children))
        .filter(Boolean);
      answer = paras.length > 0 ? paras.join("\n\n") : plainText(panelNode.children);
    }
    if (question && answer) items.push({ question, answer });
  }
  if (items.length === 0) return null;
  return {
    id: id(),
    type: "faq_accordion",
    props: { title: fallbackTitle, items, openMode: "first" },
  };
}

export function extractEmbeddedFormNode(el: Element, id: () => string): BlockNode {
  const headingEl = DomUtils.findOne((e) => hasCls(e, "wp-block-kadence-advancedheading") || /^h[2-5]$/.test(e.name), [el]);
  const title = headingEl ? plainText(headingEl.children) : "Detaylı bilgi için sizi arayalım";
  const submitEl = DomUtils.findOne((e) => hasCls(e, "kb-forms-submit") || e.name === "button", [el]);
  const submitLabel = (submitEl ? plainText(submitEl.children) : "") || "Gönder";
  return {
    id: id(),
    type: "form_block",
    props: {
      title,
      submitLabel,
      successMessage: "Talebiniz başarıyla alındı. Uzman ekibimiz en kısa sürede sizinle iletişime geçecektir.",
      fields: [
        { id: "f_name", name: "ad_soyad", label: "Ad Soyad", type: "text", required: true, width: "half" },
        { id: "f_phone", name: "telefon", label: "Telefon Numarası", type: "tel", required: true, width: "half" },
        { id: "f_company", name: "firma", label: "Firma Adı", type: "text", required: false, width: "half" },
        { id: "f_email", name: "eposta", label: "E-posta Adresi", type: "email", required: false, width: "half" },
        { id: "f_msg", name: "mesaj", label: "Mesajınız / İlgilendiğiniz Program", type: "textarea", required: false, width: "full" },
      ],
    },
  };
}

export function extractButtonsFrom(el: Element, base: string): Array<{ label: string; href: string; variant: "primary" | "ghost" }> {
  const anchors = DomUtils.findAll((e) => e.name === "a" && (hasCls(e, "kb-button") || hasCls(e, "wp-block-button__link") || Boolean(e.attribs?.href)), [el]);
  const out: Array<{ label: string; href: string; variant: "primary" | "ghost" }> = [];
  for (const a of anchors) {
    const textNode = DomUtils.findOne((e) => hasCls(e, "kt-btn-inner-text"), [a]);
    const label = plainText(textNode ? textNode.children : a.children);
    const href = resolveLinkHref(a.attribs?.href, base) || "/iletisim";
    if (!label) continue;
    const isOutline = hasCls(a, "kb-btn-global-outline") || hasCls(a, "is-style-outline");
    out.push({ label, href, variant: isOutline ? "ghost" : "primary" });
  }
  return out;
}

export function extractTableNode(tbl: Element, id: () => string): BlockNode | null {
  const trs = DomUtils.findAll((e) => e.name === "tr", [tbl]);
  const cellsOf = (tr: Element) =>
    DomUtils.getChildren(tr)
      .filter((c): c is Element => c.type === "tag" && (c.name === "td" || c.name === "th"))
      .map((c) => plainText(c.children));
  const grid = trs.map(cellsOf).filter((r) => r.some((cell) => cell.length > 0));
  if (grid.length === 0) return null;
  const headTr = trs.find((r) => DomUtils.getChildren(r).some((c) => c.type === "tag" && (c as Element).name === "th"));
  const headers = headTr ? cellsOf(headTr) : grid[0]!;
  const rows = headTr ? trs.filter((r) => r !== headTr).map(cellsOf).filter((r) => r.some(Boolean)) : grid.slice(1);
  if (headers.every((h) => !h) && rows.length === 0) return null;
  return {
    id: id(),
    type: "data_table",
    props: { headers, rows, striped: true },
  };
}

