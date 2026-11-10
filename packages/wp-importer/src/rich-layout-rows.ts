import { DomUtils } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import type { BlockNode, BlockStyle } from "@nexpress/core";
import { isDarkColor, resolvePaletteToken, type ParsedInlineStyles } from "./rich-layout-styles";
import { cls, extractClassToken, hasCls, mergeConsecutiveIconLists } from "./rich-layout-extractors";

export interface RowCompileContext {
  styles: ParsedInlineStyles;
  id: () => string;
  addImage: (url: string) => void;
  compileNodes: (nodes: AnyNode[], inColumn: boolean) => BlockNode[];
}

/** Tek başlık, isteğe bağlı açıklama ve tek düğme koyu bir bantta çağrı bandına katlanır. */
function foldSingleActionBanner(blocks: BlockNode[], id: () => string): BlockNode[] | null {
  const meaningful = blocks.filter((block) => block.type !== "divider_spacer");
  if (meaningful.length < 2 || meaningful.length > 3) return null;
  const heading = meaningful.find((block) => block.type === "heading");
  const paragraph = meaningful.find((block) => block.type === "paragraph");
  const button = meaningful.find((block) => block.type === "button_element");
  const known = [heading, paragraph, button].filter(Boolean);
  if (!heading || !button || known.length !== meaningful.length) return null;
  const subtitle = paragraph ? String(paragraph.props?.text ?? "").trim() : "";
  return [
    {
      id: id(),
      type: "cta_banner",
      props: {
        title: String(heading.props?.text ?? ""),
        ...(subtitle ? { subtitle } : {}),
        buttonLabel: String(button.props?.label ?? ""),
        buttonHref: String(button.props?.href ?? "#"),
      },
    },
  ];
}

/** Satır yerleşimini sütun, kart, liste veya düz bölüme çevirir. */
export function compileLayoutRow(rowEl: Element, inColumn: boolean, ctx: RowCompileContext): BlockNode[] {
  const { styles, id, addImage, compileNodes } = ctx;
  const rowId = extractClassToken(rowEl, "kb-row-layout-id");
  const rowStyle = rowId ? styles.rows.get(rowId) : undefined;
  const anchorId = rowEl.attribs?.id?.trim();

  const findColumnWrap = (el: Element): Element | null => {
    for (const child of el.children) {
      if (child.type === "tag" && (hasCls(child as Element, "kt-row-column-wrap") || hasCls(child as Element, "wp-block-columns"))) {
        return child as Element;
      }
    }
    return DomUtils.findOne((node) => hasCls(node, "kt-row-column-wrap"), el.children) ?? (hasCls(el, "wp-block-columns") ? el : null);
  };

  const directColumnsOf = (wrapEl: Element): Element[] =>
    wrapEl.children.filter(
      (child): child is Element =>
        child.type === "tag" && (hasCls(child as Element, "wp-block-kadence-column") || hasCls(child as Element, "wp-block-column"))
    );

  const unwrapSingleInnerColumn = (colEl: Element): Element => {
    const inner =
      DomUtils.getChildren(colEl).find((child): child is Element => child.type === "tag" && hasCls(child as Element, "kt-inside-inner-col")) ??
      colEl;
    const tagChildren = DomUtils.getChildren(inner).filter(
      (child): child is Element => child.type === "tag" && !["style", "script"].includes((child as Element).name)
    );
    if (tagChildren.length === 1 && hasCls(tagChildren[0]!, "wp-block-kadence-column")) {
      return unwrapSingleInnerColumn(tagChildren[0]!);
    }
    return colEl;
  };

  const compileColumnChildren = (colEl: Element, childInColumn: boolean) => {
    const unwrapped = unwrapSingleInnerColumn(colEl);
    const colId = extractClassToken(unwrapped, "kadence-column") || extractClassToken(colEl, "kadence-column");
    const colStyle = colId ? styles.cols.get(colId) : undefined;
    const inner =
      DomUtils.getChildren(unwrapped).find((child): child is Element => child.type === "tag" && hasCls(child as Element, "kt-inside-inner-col")) ??
      unwrapped;
    const compiled = compileNodes(inner.children, childInColumn);
    const meaningful = compiled.filter((block) => block.type !== "divider_spacer");
    if (meaningful.length === 0 && colStyle?.backgroundImage) {
      addImage(colStyle.backgroundImage);
      return {
        colStyle,
        blocks: [{ id: id(), type: "image_figure", props: { url: colStyle.backgroundImage, altText: "", borderRadius: "lg" } }] as BlockNode[],
      };
    }
    return { colStyle, blocks: meaningful.length > 0 ? compiled : [] };
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

  const wrapInSection = (children: BlockNode[], styleSource: ReturnType<typeof styles.rows.get>): BlockNode => {
    const rowClasses = cls(rowEl);
    let bgColor = styleSource?.backgroundColor;
    const paletteClassMatch = /has-theme-palette(\d)-background-color/.exec(rowClasses);
    if (!bgColor && paletteClassMatch) bgColor = resolvePaletteToken(`palette${paletteClassMatch[1]}`, styles.palette);
    const bgGradient = styleSource?.backgroundGradient;
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

  const wrap = findColumnWrap(rowEl);
  if (!wrap) return compileNodes(rowEl.children, inColumn);

  const rawCols = directColumnsOf(wrap);
  if (rawCols.length === 0) return compileNodes(wrap.children, inColumn);

  const wrapCls = cls(wrap);
  const preSingleStack =
    rawCols.length === 1 || hasCls(wrap, "kt-has-1-columns") || hasCls(wrap, "kt-row-layout-row") || rowStyle?.singleColumn === true;

  const compiledCols = rawCols
    .map((colEl) => {
      const res = compileColumnChildren(colEl, inColumn || !preSingleStack);
      return { colStyle: res.colStyle, blocks: res.blocks };
    })
    .filter((col) => col.blocks.length > 0);

  if (compiledCols.length === 0) return [];

  const effectiveRowStyle = {
    ...rowStyle,
    ...(compiledCols.length === 1 && !rowStyle?.backgroundColor && compiledCols[0]!.colStyle?.backgroundColor
      ? { backgroundColor: compiledCols[0]!.colStyle.backgroundColor, textColor: compiledCols[0]!.colStyle.textColor }
      : {}),
  };

  const allInfoBoxes = compiledCols.every((col) => col.blocks.every((block) => block.type === "info_box"));
  const totalInfoBoxes = allInfoBoxes ? compiledCols.reduce((acc, col) => acc + col.blocks.length, 0) : 0;
  if (allInfoBoxes && totalInfoBoxes >= 2) {
    const cards = compiledCols.flatMap((col) =>
      col.blocks.map((block) => ({
        title: String(block.props?.title ?? ""),
        description: String(block.props?.description ?? block.props?.text ?? ""),
        ...(block.props?.image ? { image: String(block.props.image) } : { icon: String(block.props?.icon ?? "layers") }),
        ...(block.props?.href ? { href: String(block.props.href) } : {}),
      }))
    );
    const gridCols =
      wrapCls.includes("kt-has-4-columns") || compiledCols.length === 4
        ? 4
        : wrapCls.includes("kt-has-3-columns") || wrapCls.includes("kt-row-layout-three-grid") || compiledCols.length === 3 || cards.length % 3 === 0
          ? 3
          : 2;
    const bento: BlockNode = { id: id(), type: "bento_features", props: { columns: gridCols, items: cards } };
    return !inColumn ? [wrapInSection([bento], effectiveRowStyle)] : [bento];
  }

  const allIconLists = compiledCols.length >= 2 && compiledCols.every((col) => col.blocks.every((block) => block.type === "icon_list"));
  if (allIconLists) {
    const mergedItems = compiledCols.flatMap((col) => col.blocks.flatMap((block) => (Array.isArray(block.props?.items) ? block.props.items : [])));
    const mergedList: BlockNode = { id: id(), type: "icon_list", props: { columns: Math.min(3, compiledCols.length), items: mergedItems } };
    return !inColumn ? [wrapInSection([mergedList], effectiveRowStyle)] : [mergedList];
  }

  const allAccordions = compiledCols.length >= 2 && compiledCols.every((col) => col.blocks.every((block) => block.type === "faq_accordion"));
  if (allAccordions) {
    const mergedFaqs = compiledCols.flatMap((col) => col.blocks.flatMap((block) => (Array.isArray(block.props?.items) ? block.props.items : [])));
    const mergedAcc: BlockNode = { id: id(), type: "faq_accordion", props: { title: "Sıkça Sorulan Sorular", items: mergedFaqs, openMode: "first" } };
    return !inColumn ? [wrapInSection([mergedAcc], effectiveRowStyle)] : [mergedAcc];
  }

  const allButtons = compiledCols.length >= 2 && compiledCols.every((col) => col.blocks.length === 1 && col.blocks[0]!.type === "button_element");
  if (allButtons) {
    const buttons = compiledCols.map((col) => {
      const block = col.blocks[0]!;
      return {
        label: String(block.props?.label ?? "Buton"),
        href: String(block.props?.href ?? "#"),
        variant: block.props?.styleVariant === "outline" ? "ghost" : "primary",
      };
    });
    const btnRow: BlockNode = { id: id(), type: "button_row", props: { buttons } };
    return !inColumn ? [wrapInSection([btnRow], effectiveRowStyle)] : [btnRow];
  }

  const allImages = compiledCols.every((col) => col.blocks.every((block) => block.type === "image_figure"));
  const totalImages = allImages ? compiledCols.reduce((acc, col) => acc + col.blocks.length, 0) : 0;
  if (inColumn && allImages && totalImages >= 2) {
    const imgItems = compiledCols.flatMap((col) =>
      col.blocks.map((block) => ({
        url: String(block.props?.url ?? ""),
        alt: String(block.props?.altText ?? ""),
        caption: String(block.props?.caption ?? ""),
      }))
    );
    return [{ id: id(), type: "gallery", props: { variant: imgItems.length === 3 ? "collage" : "grid", items: imgItems } }];
  }

  const isSingleStack = preSingleStack || compiledCols.length === 1;
  if (isSingleStack) {
    let flat = mergeConsecutiveIconLists(compiledCols.flatMap((col) => col.blocks));
    const hasBand = Boolean(
      effectiveRowStyle?.backgroundColor ||
        effectiveRowStyle?.backgroundGradient ||
        /has-theme-palette\d-background-color/.test(cls(rowEl))
    );
    if (!inColumn && hasBand) {
      const folded = foldSingleActionBanner(flat, id);
      if (folded) flat = folded;
    }
    if (inColumn) return flat;
    if (flat.length === 1 && flat[0]!.type === "section") {
      const innerSec = flat[0]!;
      const outerSec = wrapInSection(innerSec.children ?? [], effectiveRowStyle);
      return [{ ...innerSec, props: { ...outerSec.props, ...innerSec.props }, style: { ...outerSec.style, ...innerSec.style } }];
    }
    const unpacked = flat.flatMap((block) => (block.type === "section" ? block.children ?? [] : [block]));
    return [wrapInSection(unpacked, effectiveRowStyle)];
  }

  if (inColumn) return mergeConsecutiveIconLists(compiledCols.flatMap((col) => col.blocks));

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

  return [wrapInSection([columnsBlock], effectiveRowStyle)];
}
