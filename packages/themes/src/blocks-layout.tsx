import React from "react";
import type { BlockNode } from "@nexpress/core";
import type { BlockRenderContext } from "./block-context";
import { INK_GRID_ID } from "./ink-grid";
import { ResponsiveImage } from "./responsive-image";
import { RichBlock } from "./rich-block";
import { getColumnWidthsFromLayout } from "./column-layout";

/** Metin ve yerleşim blokları: başlık, paragraf, bölüm, sütunlar, düğme, görsel. Tanımsız dönerse sıradaki grup denenir. */
export function renderLayoutBlock({ block, themeId, tokens, isEditorial, isCommerce, lcpBlockId, mediaFocal, renderChild }: BlockRenderContext): React.ReactElement | null | undefined {
  const p = block.props ?? {};
  const RenderChild = ({ block: child }: { block: BlockNode } & Record<string, unknown>) =>
    renderChild(child);

  switch (block.type) {
    case "heading":
    case "heading_element": {
      const rawLevel = String(p.level ?? "h2").toLowerCase();
      const align = String(p.align ?? "left");
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      const tag = rawLevel === "3" || rawLevel === "h3" ? "h3" : rawLevel === "4" || rawLevel === "h4" ? "h4" : "h2";
      const ink = themeId === INK_GRID_ID;
      const size = ink
        ? tag === "h3"
          ? "text-xl font-medium"
          : tag === "h4"
            ? "text-lg font-medium"
            : "text-3xl md:text-4xl font-semibold tracking-tight"
        : tag === "h3"
          ? "text-xl font-bold"
          : tag === "h4"
            ? "text-lg font-semibold"
            : "text-2xl md:text-3xl font-bold";
      return (
        <RichBlock
          as={tag}
          html={p.html}
          text={p.text}
          style={{ fontFamily: tokens.typography.headingFont }}
          className={`${size} ${ink ? "text-white" : "text-slate-900"} ${alignClass}`}
        />
      );
    }

    case "paragraph":
    case "paragraph_element":
    case "text_div": {
      return (
        <RichBlock
          as="div"
          className={`nx-rich text-base leading-relaxed ${themeId === INK_GRID_ID ? "text-zinc-400" : "text-slate-700"}`}
          html={p.html}
          text={p.text}
        />
      );
    }

    case "section": {
      const children = Array.isArray(block.children) ? block.children : [];
      const containerMode = String(p.containerMode ?? "boxed");
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
          }}
          className="relative"
        >
          <div
            style={{
              maxWidth:
                containerMode === "full"
                  ? "100%"
                  : containerMode === "narrow"
                    ? "840px"
                    : tokens.geometry.containerMaxWidth,
            }}
            className="mx-auto space-y-6"
          >
            {typeof p.title === "string" && p.title.trim() ? (
              <h2
                style={{ fontFamily: tokens.typography.headingFont }}
                className="text-2xl font-bold text-slate-900"
              >
                {p.title}
              </h2>
            ) : null}
            {children.map((child) => (
              <RenderChild
                key={child.id}
                block={child}
                themeId={themeId}
                tokens={tokens}
                isEditorial={isEditorial}
                isCommerce={isCommerce}
              />
            ))}
          </div>
        </section>
      );
    }

    case "columns": {
      const children = Array.isArray(block.children) ? block.children : [];
      const layout = String(p.layout ?? "6+6");
      const gap = String(p.gap ?? "24px");
      const vAlign = String(p.verticalAlign ?? "stretch");
      const widths = getColumnWidthsFromLayout(layout, Math.max(1, children.length));
      const alignItems =
        vAlign === "center"
          ? "items-center"
          : vAlign === "bottom"
            ? "items-end"
            : vAlign === "top"
              ? "items-start"
              : "items-stretch";

      return (
        <div
          style={{ gap: themeId === INK_GRID_ID ? "0px" : gap }}
          className={`flex flex-col md:flex-row ${alignItems} ${themeId === INK_GRID_ID ? "border-b border-white/15" : ""}`}
        >
          {children.map((col, idx) => (
            <div
              key={col.id}
              style={{
                flexBasis: widths[idx] ?? "50%",
              }}
              className={
                themeId === INK_GRID_ID
                  ? "min-w-0 flex-1 border-white/15 px-6 py-12 sm:px-10 md:border-r"
                  : "flex-1 min-w-0"
              }
            >
              <RenderChild
                block={col}
                themeId={themeId}
                tokens={tokens}
                isEditorial={isEditorial}
                isCommerce={isCommerce}
              />
            </div>
          ))}
        </div>
      );
    }

    case "column": {
      const children = Array.isArray(block.children) ? block.children : [];
      return (
        <div className="space-y-4 h-full">
          {children.map((child) => (
            <RenderChild
              key={child.id}
              block={child}
              themeId={themeId}
              tokens={tokens}
              isEditorial={isEditorial}
              isCommerce={isCommerce}
            />
          ))}
        </div>
      );
    }

    case "button_element": {
      const styleVariant = String(p.styleVariant ?? "primary");
      const align = String(p.align ?? "left");
      return (
        <div
          className={`flex ${
            align === "center"
              ? "justify-center"
              : align === "right"
                ? "justify-end"
                : "justify-start"
          }`}
        >
          <a
            href={String(p.href ?? "#")}
            target={p.openInNewTab ? "_blank" : undefined}
            rel={p.openInNewTab ? "noopener noreferrer" : undefined}
            style={{
              backgroundColor:
                styleVariant === "primary"
                  ? tokens.colors.primary
                  : styleVariant === "secondary"
                    ? tokens.colors.secondary
                    : "transparent",
              color:
                styleVariant === "outline"
                  ? tokens.colors.foreground
                  : tokens.colors.primaryForeground,
              borderColor: tokens.colors.border,
              borderRadius: tokens.geometry.borderRadius,
            }}
            className={`inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition hover:opacity-90 ${
              styleVariant === "outline" ? "border-2" : "shadow-xs"
            }`}
          >
            {String(p.label ?? "Buton")}
          </a>
        </div>
      );
    }

    case "image_figure": {
      const url = String(p.url ?? "");
      const altText = String(p.altText ?? "");
      const titleText = typeof p.titleText === "string" ? p.titleText : undefined;
      const caption = typeof p.caption === "string" ? p.caption : undefined;
      return (
        <figure className="space-y-2.5">
          <div
            style={{
              borderRadius: tokens.geometry.borderRadius,
              borderColor: tokens.colors.border,
            }}
            className="overflow-hidden border bg-slate-100"
          >
            {url ? (
              <ResponsiveImage
                src={url}
                alt={altText}
                title={titleText}
                width={typeof p.width === "number" ? p.width : undefined}
                height={typeof p.height === "number" ? p.height : undefined}
                priority={block.id === lcpBlockId}
                focal={mediaFocal}
                className="w-full h-auto object-cover"
              />
            ) : null}
          </div>
          {caption && (
            <figcaption className="text-xs text-slate-500 text-center italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "divider_spacer": {
      const showLine = p.style !== "space";
      return (
        <div className="py-4">
          {showLine ? (
            <hr style={{ borderColor: tokens.colors.border }} className="border-t" />
          ) : null}
        </div>
      );
    }

    default:
      return undefined;
  }
}
