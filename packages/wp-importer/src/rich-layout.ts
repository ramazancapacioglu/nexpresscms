import { DomUtils, parseDocument } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import type { BlockNode } from "@nexpress/core";
import { toEmbedUrl, type ConvertResult } from "./html";
import { parseInlineLayoutStyles, type ParsedInlineStyles } from "./rich-layout-styles";
import { compileLayoutRow } from "./rich-layout-rows";
import {
  extractAccordionNode,
  extractButtonsFrom,
  extractClassToken,
  extractEmbeddedFormNode,
  extractIconListNode,
  extractInfoBoxNode,
  extractTableNode,
  hasCls,
  mergeConsecutiveIconLists,
  plainText,
  resolveImgSrc,
  resolveLinkHref,
  richInlineHtml,
  squash,
  trimEdgeSpacers,
} from "./rich-layout-extractors";

export function hasRichBlockMarkup(html: string): boolean {
  return /kb-row-layout-wrap|wp-block-kadence-|wp-block-columns|kt-blocks-info-box|kt-accordion|kt-svg-icon-list/i.test(html);
}

export function compileRichWpHtml(rawHtml: string, opts: { baseUrl?: string; palette?: Record<string, string> } = {}): ConvertResult {
  const base = opts.baseUrl?.trim() || "";
  const styles: ParsedInlineStyles = parseInlineLayoutStyles(rawHtml, base, opts.palette);
  const warnings: string[] = [];
  const images: string[] = [];
  let firstParagraph = "";
  let n = 0;
  const id = () => `wp_${++n}`;
  const addImage = (url: string) => {
    const clean = url.split("?")[0]!;
    if (clean && !images.includes(clean)) images.push(clean);
  };

  const cleanedHtml = rawHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .trim();

  const doc = parseDocument(cleanedHtml, { decodeEntities: true });

  const compileNodes = (nodes: AnyNode[], inColumn: boolean): BlockNode[] => {
    const out: BlockNode[] = [];
    let lastHeadingText = "";

    for (const node of nodes) {
      if (node.type !== "tag") continue;
      const el = node as Element;
      const tag = el.name.toLowerCase();
      if (["script", "style", "noscript", "svg", "form", "input", "select", "textarea"].includes(tag)) continue;

      if (hasCls(el, "kb-row-layout-wrap") || hasCls(el, "wp-block-kadence-rowlayout") || hasCls(el, "wp-block-columns")) {
        out.push(...compileLayoutRow(el, inColumn, { styles, id, addImage, compileNodes }));
        continue;
      }

      if (hasCls(el, "wp-block-kadence-advanced-form")) {
        out.push(extractEmbeddedFormNode(el, id));
        continue;
      }

      if (hasCls(el, "wp-block-kadence-infobox")) {
        const box = extractInfoBoxNode(el, base, id, addImage);
        if (box) out.push(box);
        continue;
      }

      if (hasCls(el, "wp-block-kadence-iconlist")) {
        const list = extractIconListNode(el, base, id);
        if (list) out.push(list);
        continue;
      }

      if (hasCls(el, "wp-block-kadence-accordion")) {
        const acc = extractAccordionNode(el, id, lastHeadingText || "Sıkça Sorulan Sorular");
        if (acc) {
          const prev = out[out.length - 1];
          if (prev && prev.type === "heading" && squash(String(prev.props?.text ?? "")) === lastHeadingText) {
            out.pop();
          }
          out.push(acc);
        }
        continue;
      }

      if (hasCls(el, "wp-block-kadence-googlemaps")) {
        const iframe = DomUtils.findOne((e) => e.name === "iframe" && Boolean(e.attribs?.src), [el]);
        const embedUrl = iframe?.attribs?.src?.trim() ?? "";
        const qMatch = /[?&]q=([^&]+)/.exec(embedUrl);
        const query = qMatch ? decodeURIComponent(qMatch[1]!) : "Konum";
        out.push({
          id: id(),
          type: "map_embed",
          props: { title: "Konum & Harita", query, ...(embedUrl ? { embedUrl } : {}) },
        });
        continue;
      }

      if (hasCls(el, "wp-block-kadence-advancedbtn") || hasCls(el, "wp-block-buttons") || (tag === "a" && hasCls(el, "kb-button"))) {
        const btns = tag === "a" ? extractButtonsFrom({ ...el, children: [el] } as Element, base) : extractButtonsFrom(el, base);
        if (btns.length === 1) {
          const b = btns[0]!;
          out.push({
            id: id(),
            type: "button_element",
            props: { label: b.label, href: b.href, styleVariant: b.variant === "ghost" ? "outline" : "primary" },
          });
        } else if (btns.length > 1) {
          out.push({ id: id(), type: "button_row", props: { buttons: btns } });
        }
        continue;
      }

      if (hasCls(el, "wp-block-kadence-advancedgallery") || hasCls(el, "wp-block-gallery")) {
        const imgs = DomUtils.findAll((e) => e.name === "img", [el]);
        const items = imgs
          .map((img) => {
            const url = resolveImgSrc(img, base);
            if (!url) return null;
            addImage(url);
            return { url, alt: squash(img.attribs?.alt ?? ""), caption: "" };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));
        if (items.length > 0) {
          out.push({
            id: id(),
            type: "gallery",
            props: { variant: items.length === 3 ? "collage" : "grid", items },
          });
        }
        continue;
      }

      if (hasCls(el, "wp-block-kadence-spacer") || tag === "hr") {
        const hasVisibleHr = tag === "hr" || Boolean(DomUtils.findOne((e) => e.name === "hr", [el]));
        out.push({ id: id(), type: "divider_spacer", props: { style: hasVisibleHr ? "line" : "space" } });
        continue;
      }

      if (/^h[1-6]$/.test(tag)) {
        const text = plainText(el.children);
        if (!text) continue;
        lastHeadingText = text;
        const hId = extractClassToken(el, "kt-adv-heading");
        const hStyle = hId ? styles.headings.get(hId) : undefined;
        const level = tag === "h1" ? "h1" : tag === "h3" ? "h3" : tag === "h4" || tag === "h5" || tag === "h6" ? "h4" : "h2";
        const anchorId = el.attribs?.id?.trim();
        out.push({
          id: id(),
          type: "heading",
          props: {
            level,
            text,
            ...(hStyle?.align ? { align: hStyle.align } : {}),
            ...(anchorId ? { anchorId } : {}),
          },
          ...(hStyle?.color ? { style: { textColor: hStyle.color } } : {}),
        });
        continue;
      }

      if (tag === "p" || (tag === "div" && hasCls(el, "wp-block-kadence-advancedheading"))) {
        const text = plainText(el.children);
        const inlineImgs = DomUtils.findAll((e) => e.name === "img", [el]);
        if (!text && inlineImgs.length > 0) {
          for (const img of inlineImgs) {
            const url = resolveImgSrc(img, base);
            if (url) {
              addImage(url);
              out.push({ id: id(), type: "image_figure", props: { url, altText: squash(img.attribs?.alt ?? "") } });
            }
          }
          continue;
        }
        if (!text) continue;
        if (!firstParagraph && text.length >= 40) firstParagraph = text;
        const htmlOut = richInlineHtml(el.children, base);
        const hId = extractClassToken(el, "kt-adv-heading");
        const hStyle = hId ? styles.headings.get(hId) : undefined;
        out.push({
          id: id(),
          type: "paragraph",
          props: /<[a-z]/i.test(htmlOut) ? { html: htmlOut, text } : { text },
          ...(hStyle?.align || hStyle?.color
            ? { style: { ...(hStyle?.align ? { textAlign: hStyle.align } : {}), ...(hStyle?.color ? { textColor: hStyle.color } : {}) } }
            : {}),
        });
        continue;
      }

      if (tag === "ul" || tag === "ol") {
        if (hasCls(el, "kt-svg-icon-list")) {
          const list = extractIconListNode(el, base, id);
          if (list) out.push(list);
          continue;
        }
        const liNodes = DomUtils.getChildren(el).filter((c): c is Element => c.type === "tag" && c.name === "li");
        const hasLinks = liNodes.some((li) => Boolean(DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs?.href), [li])));
        if (hasLinks && tag === "ul") {
          const items = liNodes
            .map((li) => {
              const title = plainText(li.children);
              const a = DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs?.href), [li]);
              const href = resolveLinkHref(a?.attribs?.href, base);
              return title ? { title, icon: "check", ...(href ? { href } : {}) } : null;
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));
          if (items.length > 0) {
            out.push({ id: id(), type: "icon_list", props: { columns: 1, items } });
            continue;
          }
        }
        const items = liNodes.map((li) => plainText(li.children)).filter(Boolean);
        if (items.length > 0) {
          out.push({
            id: id(),
            type: "list_element",
            props: { items, listType: tag === "ol" ? "numbered" : "check", ordered: tag === "ol" },
          });
        }
        continue;
      }

      if (tag === "figure" || tag === "img") {
        const img = tag === "img" ? el : DomUtils.findOne((e) => e.name === "img", [el]);
        if (img) {
          const url = resolveImgSrc(img, base);
          if (url) {
            addImage(url);
            const cap = tag === "figure" ? DomUtils.findOne((e) => e.name === "figcaption", [el]) : null;
            const linkEl = tag === "figure" ? DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs?.href), [el]) : null;
            const link = resolveLinkHref(linkEl?.attribs?.href, base);
            out.push({
              id: id(),
              type: "image_figure",
              props: {
                url,
                altText: squash(img.attribs?.alt ?? ""),
                ...(img.attribs?.title ? { titleText: squash(img.attribs.title) } : {}),
                ...(cap ? { caption: plainText(cap.children) } : {}),
                ...(link && !/\.(?:webp|png|jpe?g|gif|svg)$/i.test(link) ? { link } : {}),
              },
            });
          }
          continue;
        }
        const tbl = DomUtils.findOne((e) => e.name === "table", [el]);
        if (tbl) {
          const tableBlock = extractTableNode(tbl, id);
          if (tableBlock) out.push(tableBlock);
          continue;
        }
      }

      if (tag === "table") {
        const tableBlock = extractTableNode(el, id);
        if (tableBlock) out.push(tableBlock);
        continue;
      }

      if (tag === "blockquote") {
        const text = plainText(el.children);
        if (text) out.push({ id: id(), type: "quote", props: { text } });
        continue;
      }

      if (tag === "pre") {
        const code = DomUtils.textContent(el).trim();
        if (code) out.push({ id: id(), type: "code_block", props: { language: "text", code } });
        continue;
      }

      if (tag === "iframe") {
        const src = el.attribs?.src?.trim() ?? "";
        if (/google\.com\/maps|maps\.google\.com/i.test(src)) {
          const qMatch = /[?&]q=([^&]+)/.exec(src);
          const query = qMatch ? decodeURIComponent(qMatch[1]!) : "Konum";
          out.push({ id: id(), type: "map_embed", props: { title: "Konum & Harita", query, embedUrl: src } });
        } else {
          const embed = toEmbedUrl(src);
          if (embed) out.push({ id: id(), type: "video_embed", props: { url: embed, title: "Video" } });
        }
        continue;
      }

      if (el.children?.length) {
        out.push(...compileNodes(el.children, inColumn));
      }
    }

    return trimEdgeSpacers(mergeConsecutiveIconLists(out));
  };

  const blocks = compileNodes(doc.children, false);
  return { blocks, images, strippedShortcodes: 0, warnings, firstParagraph };
}
