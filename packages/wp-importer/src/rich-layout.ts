import { DomUtils, parseDocument } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import type { BlockNode, BlockStyle } from "@nexpress/core";
import { toEmbedUrl, type ConvertResult } from "./html";
import { isDarkColor, parseInlineLayoutStyles, resolvePaletteToken, type ParsedInlineStyles } from "./rich-layout-styles";
import {
  cls,
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

export function compileRichWpHtml(rawHtml: string, opts: { baseUrl?: string } = {}): ConvertResult {
  const base = opts.baseUrl || "https://www.akinsoftizmir.com.tr";
  const styles: ParsedInlineStyles = parseInlineLayoutStyles(rawHtml, base);
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
        out.push(...compileRow(el, inColumn));
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
        const query = qMatch ? decodeURIComponent(qMatch[1]!) : "Akınsoft İzmir Ana Bayi";
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
          out.push({ id: id(), type: "map_embed", props: { title: "Konum & Harita", query: "İzmir", embedUrl: src } });
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

  const findColumnWrap = (rowEl: Element): Element | null => {
    for (const ch of rowEl.children) {
      if (ch.type === "tag" && (hasCls(ch as Element, "kt-row-column-wrap") || hasCls(ch as Element, "wp-block-columns"))) {
        return ch as Element;
      }
    }
    return DomUtils.findOne((e) => hasCls(e, "kt-row-column-wrap"), rowEl.children) ?? (hasCls(rowEl, "wp-block-columns") ? rowEl : null);
  };

  const directColumnsOf = (wrapEl: Element): Element[] =>
    wrapEl.children.filter((ch): ch is Element => ch.type === "tag" && (hasCls(ch as Element, "wp-block-kadence-column") || hasCls(ch as Element, "wp-block-column")));

  const unwrapSingleInnerColumn = (colEl: Element): Element => {
    const inner = DomUtils.getChildren(colEl).find((c): c is Element => c.type === "tag" && hasCls(c as Element, "kt-inside-inner-col")) ?? colEl;
    const tagChildren = DomUtils.getChildren(inner).filter((c): c is Element => c.type === "tag" && !["style", "script"].includes((c as Element).name));
    if (tagChildren.length === 1 && hasCls(tagChildren[0]!, "wp-block-kadence-column")) {
      return unwrapSingleInnerColumn(tagChildren[0]!);
    }
    return colEl;
  };

  const compileColumnChildren = (colEl: Element, childInColumn: boolean): { blocks: BlockNode[]; colStyle?: ReturnType<typeof styles.cols.get> } => {
    const unwrapped = unwrapSingleInnerColumn(colEl);
    const colId = extractClassToken(unwrapped, "kadence-column") || extractClassToken(colEl, "kadence-column");
    const colStyle = colId ? styles.cols.get(colId) : undefined;
    const inner = DomUtils.getChildren(unwrapped).find((c): c is Element => c.type === "tag" && hasCls(c as Element, "kt-inside-inner-col")) ?? unwrapped;
    const compiled = compileNodes(inner.children, childInColumn);
    const meaningful = compiled.filter((b) => b.type !== "divider_spacer");
    if (meaningful.length === 0 && colStyle?.backgroundImage) {
      addImage(colStyle.backgroundImage);
      return {
        colStyle,
        blocks: [{ id: id(), type: "image_figure", props: { url: colStyle.backgroundImage, altText: "", borderRadius: "lg" } }],
      };
    }
    return { colStyle, blocks: meaningful.length > 0 ? compiled : [] };
  };

  const compileRow = (rowEl: Element, inColumn: boolean): BlockNode[] => {
    const rowId = extractClassToken(rowEl, "kb-row-layout-id");
    const rowStyle = rowId ? styles.rows.get(rowId) : undefined;
    const anchorId = rowEl.attribs?.id?.trim();

    if (rowId.startsWith("kb-row-layout-id6211")) {
      return [
        {
          id: id(),
          type: "cta_banner",
          props: {
            title: "Ücretsiz Demo Kurulumu",
            subtitle: "Programları ücretsiz tanıtmak ve bilgi vermek için sizi arayalım.",
            buttonLabel: "Demo Talep Formu",
            buttonHref: "/akinsoft-demo-talebi",
          },
        },
      ];
    }

    const wrap = findColumnWrap(rowEl);
    if (!wrap) return compileNodes(rowEl.children, inColumn);

    const rawCols = directColumnsOf(wrap);
    if (rawCols.length === 0) return compileNodes(wrap.children, inColumn);

    const wrapCls = cls(wrap);
    const preSingleStack =
      rawCols.length === 1 || hasCls(wrap, "kt-has-1-columns") || hasCls(wrap, "kt-row-layout-row") || rowStyle?.singleColumn === true;

    const compiledCols = rawCols
      .map((colEl, idx) => {
        const res = compileColumnChildren(colEl, inColumn || !preSingleStack);
        return { colEl, origIdx: idx, colStyle: res.colStyle, blocks: res.blocks };
      })
      .filter((c) => c.blocks.length > 0);

    if (compiledCols.length === 0) return [];

    const effectiveRowStyle = {
      ...rowStyle,
      ...(compiledCols.length === 1 && !rowStyle?.backgroundColor && compiledCols[0]!.colStyle?.backgroundColor
        ? { backgroundColor: compiledCols[0]!.colStyle.backgroundColor, textColor: compiledCols[0]!.colStyle.textColor }
        : {}),
    };

    const allInfoBoxes = compiledCols.every((c) => c.blocks.every((b) => b.type === "info_box"));
    const totalInfoBoxes = allInfoBoxes ? compiledCols.reduce((acc, c) => acc + c.blocks.length, 0) : 0;
    if (allInfoBoxes && totalInfoBoxes >= 2) {
      const cards = compiledCols.flatMap((c) =>
        c.blocks.map((b) => ({
          title: String(b.props?.title ?? ""),
          description: String(b.props?.description ?? b.props?.text ?? ""),
          ...(b.props?.image ? { image: String(b.props.image) } : { icon: String(b.props?.icon ?? "layers") }),
          ...(b.props?.href ? { href: String(b.props.href) } : {}),
        }))
      );
      const gridCols =
        wrapCls.includes("kt-has-4-columns") || compiledCols.length === 4
          ? 4
          : wrapCls.includes("kt-has-3-columns") || wrapCls.includes("kt-row-layout-three-grid") || compiledCols.length === 3 || cards.length % 3 === 0
            ? 3
            : 2;
      const bento: BlockNode = { id: id(), type: "bento_features", props: { columns: gridCols, items: cards } };
      return !inColumn ? [wrapInSection([bento], rowEl, effectiveRowStyle, anchorId)] : [bento];
    }

    const allIconLists = compiledCols.length >= 2 && compiledCols.every((c) => c.blocks.every((b) => b.type === "icon_list"));
    if (allIconLists) {
      const mergedItems = compiledCols.flatMap((c) => c.blocks.flatMap((b) => (Array.isArray(b.props?.items) ? b.props.items : [])));
      const mergedList: BlockNode = { id: id(), type: "icon_list", props: { columns: Math.min(3, compiledCols.length), items: mergedItems } };
      return !inColumn ? [wrapInSection([mergedList], rowEl, effectiveRowStyle, anchorId)] : [mergedList];
    }

    const allAccordions = compiledCols.length >= 2 && compiledCols.every((c) => c.blocks.every((b) => b.type === "faq_accordion"));
    if (allAccordions) {
      const mergedFaqs = compiledCols.flatMap((c) => c.blocks.flatMap((b) => (Array.isArray(b.props?.items) ? b.props.items : [])));
      const mergedAcc: BlockNode = { id: id(), type: "faq_accordion", props: { title: "Sıkça Sorulan Sorular", items: mergedFaqs, openMode: "first" } };
      return !inColumn ? [wrapInSection([mergedAcc], rowEl, effectiveRowStyle, anchorId)] : [mergedAcc];
    }

    const allButtons = compiledCols.length >= 2 && compiledCols.every((c) => c.blocks.length === 1 && c.blocks[0]!.type === "button_element");
    if (allButtons) {
      const buttons = compiledCols.map((c) => {
        const b = c.blocks[0]!;
        return { label: String(b.props?.label ?? "Buton"), href: String(b.props?.href ?? "#"), variant: b.props?.styleVariant === "outline" ? "ghost" : "primary" };
      });
      const btnRow: BlockNode = { id: id(), type: "button_row", props: { buttons } };
      return !inColumn ? [wrapInSection([btnRow], rowEl, effectiveRowStyle, anchorId)] : [btnRow];
    }

    const allImages = compiledCols.every((c) => c.blocks.every((b) => b.type === "image_figure"));
    const totalImages = allImages ? compiledCols.reduce((acc, c) => acc + c.blocks.length, 0) : 0;
    if (inColumn && allImages && totalImages >= 2) {
      const imgItems = compiledCols.flatMap((c) =>
        c.blocks.map((b) => ({ url: String(b.props?.url ?? ""), alt: String(b.props?.altText ?? ""), caption: String(b.props?.caption ?? "") }))
      );
      return [{ id: id(), type: "gallery", props: { variant: imgItems.length === 3 ? "collage" : "grid", items: imgItems } }];
    }

    const isSingleStack = preSingleStack || compiledCols.length === 1;
    if (isSingleStack) {
      const flat = mergeConsecutiveIconLists(compiledCols.flatMap((c) => c.blocks));
      if (anchorId === "akinsoft-kampanyalar" && !flat.some((b) => b.type === "dynamic_list" || b.type === "post_grid")) {
        flat.push({
          id: id(),
          type: "dynamic_list",
          props: { source: "posts", categorySlug: "akinsoft-kampanyalar", limit: 3, columns: 3, layout: "cards", showImage: true, showExcerpt: true, showDate: false },
        });
      }
      if (inColumn) return flat;
      if (flat.length === 1 && flat[0]!.type === "section") {
        const innerSec = flat[0]!;
        const outerSec = wrapInSection(innerSec.children ?? [], rowEl, effectiveRowStyle, anchorId);
        return [{ ...innerSec, props: { ...outerSec.props, ...innerSec.props }, style: { ...outerSec.style, ...innerSec.style } }];
      }
      const unpacked = flat.flatMap((b) => (b.type === "section" ? b.children ?? [] : [b]));
      return [wrapInSection(unpacked, rowEl, effectiveRowStyle, anchorId)];
    }

    if (inColumn) {
      return mergeConsecutiveIconLists(compiledCols.flatMap((c) => c.blocks));
    }

    const { layout, spans } = resolveColumnLayout(wrapCls, effectiveRowStyle?.colRatios, compiledCols.length);
    const columnsBlock: BlockNode = {
      id: id(),
      type: "columns",
      props: { layout, gap: "24px", verticalAlign: wrapCls.includes("kt-row-valign-middle") ? "center" : "stretch" },
      children: compiledCols.map((col, idx) => {
        const span = spans[idx] ?? Math.max(3, Math.floor(12 / compiledCols.length));
        return {
          id: id(),
          type: "column",
          props: { widthPct: Math.round((span / 12) * 100) },
          gridSpan: { desktop: span, tablet: 12, mobile: 12 },
          children: col.blocks,
        };
      }),
    };

    return [wrapInSection([columnsBlock], rowEl, effectiveRowStyle, anchorId)];
  };

  const resolveColumnLayout = (wrapCls: string, ratios: number[] | undefined, colCount: number): { layout: string; spans: number[] } => {
    if (colCount === 2) {
      if (wrapCls.includes("kt-row-layout-left-golden") || (ratios && ratios[0]! >= 60)) return { layout: "8+4", spans: [8, 4] };
      if (wrapCls.includes("kt-row-layout-right-golden") || (ratios && ratios[1]! >= 60)) return { layout: "4+8", spans: [4, 8] };
      return { layout: "6+6", spans: [6, 6] };
    }
    if (colCount === 3) {
      if (ratios && ratios[0]! >= 45 && ratios[1]! <= 30) return { layout: "6+3+3", spans: [6, 3, 3] };
      return { layout: "4+4+4", spans: [4, 4, 4] };
    }
    if (colCount === 4) return { layout: "3+3+3+3", spans: [3, 3, 3, 3] };
    return { layout: "6+6", spans: Array.from({ length: colCount }, () => Math.max(3, Math.floor(12 / colCount))) };
  };

  const wrapInSection = (children: BlockNode[], rowEl: Element, rowStyle: ReturnType<typeof styles.rows.get>, anchorId?: string): BlockNode => {
    const rowClasses = cls(rowEl);
    let bgColor = rowStyle?.backgroundColor;
    const paletteClassMatch = /has-theme-palette(\d)-background-color/.exec(rowClasses);
    if (!bgColor && paletteClassMatch) bgColor = resolvePaletteToken(`palette${paletteClassMatch[1]}`, styles.palette);
    const bgGradient = rowStyle?.backgroundGradient;
    const dark = isDarkColor(bgColor) || (bgGradient ? isDarkColor(bgGradient.match(/#[0-9a-fA-F]{3,8}/)?.[0]) : false);
    const hasBg = Boolean(bgColor && bgColor !== "#ffffff") || Boolean(bgGradient);
    const style: BlockStyle = {
      paddingTop: hasBg ? "40px" : "24px",
      paddingBottom: hasBg ? "40px" : "24px",
      ...(hasBg ? { paddingLeft: "28px", paddingRight: "28px", borderRadius: "16px" } : {}),
      ...(bgColor && bgColor !== "#ffffff" ? { backgroundColor: bgColor } : {}),
      ...(bgGradient ? { backgroundGradient: bgGradient } : {}),
      ...(dark ? { textColor: "#ffffff" } : {}),
      ...(anchorId ? { anchorId } : {}),
    };
    return {
      id: id(),
      type: "section",
      props: { containerMode: "boxed", ...(anchorId ? { anchorId } : {}) },
      style,
      children,
    };
  };

  const blocks = compileNodes(doc.children, false);
  return { blocks, images, strippedShortcodes: 0, warnings, firstParagraph };
}
