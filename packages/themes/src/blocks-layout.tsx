import React from "react";
import { ICON_PATHS, type BlockNode } from "@nexpress/core";
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
          className={`${size} ${ink ? "text-white" : "text-nx-fg"} ${alignClass}`}
        />
      );
    }

    case "paragraph":
    case "paragraph_element":
    case "text_div": {
      return (
        <RichBlock
          as="div"
          className={`nx-rich text-base leading-relaxed ${themeId === INK_GRID_ID ? "text-zinc-400" : "text-nx-soft"}`}
          html={p.html}
          text={p.text}
        />
      );
    }

    case "section": {
      const children = Array.isArray(block.children) ? block.children : [];
      const containerMode = String(p.containerMode ?? "boxed");
      // Arka plan videosu: yalnızca site içi (/…) ya da https mp4/webm; kapak görseli yedektir (mobil/hareket azaltma/yükleme)
      const safeMedia = (v: unknown, re: RegExp) => (typeof v === "string" && /^(\/(?!\/)|https:\/\/)/.test(v.trim()) && re.test(v.trim().split("?")[0]!) ? v.trim() : "");
      const video = safeMedia(p.bgVideo, /\.(mp4|webm)$/i);
      const poster = safeMedia(p.bgPoster, /\.(jpe?g|png|webp|avif|gif)$|^\/media\//i);
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
            ...(video && poster ? { backgroundImage: `url("${poster.replace(/"/g, "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
          }}
          className={`relative ${video ? "isolate overflow-hidden" : ""}`}
        >
          {video ? (
            <>
              <video className="nx-bgvideo absolute inset-0 -z-10 h-full w-full object-cover" src={video} poster={poster || undefined} autoPlay muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
              <style>{"@media (max-width:640px),(prefers-reduced-motion:reduce){.nx-bgvideo{display:none}}"}</style>
            </>
          ) : null}
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
                className="text-2xl font-bold text-nx-fg"
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
          className={`flex ${p.mobileReverse ? "flex-col-reverse" : "flex-col"} ${p.stackAt === "tablet" ? "lg:flex-row" : "md:flex-row"} ${alignItems} ${themeId === INK_GRID_ID ? "border-b border-white/15" : ""}`}
        >
          {children.map((col, idx) => {
            const widthPct =
              col.props?.widthPct !== undefined
                ? `${col.props.widthPct}%`
                : (widths[idx] ?? `${(100 / Math.max(1, children.length)).toFixed(2)}%`);
            return (
              <div
                key={col.id}
                style={{
                  flexBasis: widthPct,
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
            );
          })}
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
      const iconPath = typeof p.icon === "string" ? ICON_PATHS[p.icon] : undefined;
      const iconSide = String(p.iconSide ?? "right");
      const icon = (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ margin: iconSide === "left" ? "0 8px 0 -4px" : "0 -4px 0 8px" }}>
          <path d={iconPath} />
        </svg>
      );
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
            {iconPath && iconSide === "left" ? icon : null}
            {String(p.label ?? "Buton")}
            {iconPath && iconSide !== "left" ? icon : null}
          </a>
        </div>
      );
    }

    case "media_file": {
      const rawUrl = String(p.url ?? "");
      // yalnızca site içi (/…) veya http(s) adresleri: javascript:/data: bağlantıları yazılmaz
      const url = /^(\/(?!\/)|https?:\/\/)/i.test(rawUrl) ? rawUrl : "";
      if (!url) return null;
      const kind = String(p.kind ?? "document");
      const title = String(p.title ?? "").trim() || "Dosya";
      const description = typeof p.description === "string" ? p.description : "";
      const size = typeof p.size === "string" ? p.size : "";
      return (
        <figure className="space-y-2">
          {kind === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video controls preload="metadata" playsInline poster={typeof p.poster === "string" ? p.poster : undefined} className="w-full" style={{ borderRadius: tokens.geometry.borderRadius }}>
              <source src={url} type={typeof p.mime === "string" ? p.mime : undefined} />
              <a href={url}>{title}</a>
            </video>
          ) : kind === "audio" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls preload="none" className="w-full">
              <source src={url} type={typeof p.mime === "string" ? p.mime : undefined} />
              <a href={url}>{title}</a>
            </audio>
          ) : (
            <a
              href={url}
              download
              style={{ borderColor: tokens.colors.border, borderRadius: tokens.geometry.borderRadius, color: tokens.colors.foreground }}
              className="flex items-center gap-3 border p-4 no-underline"
            >
              <span aria-hidden="true" className="text-2xl">📄</span>
              <span className="min-w-0">
                <span className="block font-semibold">{title}</span>
                {size && <span className="block text-xs opacity-70">{size}</span>}
              </span>
            </a>
          )}
          {(description || kind !== "document") && (
            <figcaption className="text-sm opacity-80">
              {kind !== "document" && title !== "Dosya" ? <strong className="block">{title}</strong> : null}
              {description}
            </figcaption>
          )}
        </figure>
      );
    }

    case "image_figure": {
      const url = String(p.url ?? "");
      const altText = String(p.altText ?? "");
      const titleText = typeof p.titleText === "string" ? p.titleText : undefined;
      const caption = typeof p.caption === "string" ? p.caption : undefined;
      const link = typeof p.link === "string" && p.link.trim() ? p.link.trim() : undefined;
      const linkTarget = p.linkTarget === "_blank" ? "_blank" : undefined;

      const align = String(p.align ?? "left");
      const widthVal = p.width
        ? typeof p.width === "number"
          ? `${p.width}px`
          : String(p.width)
        : "100%";
      const maxWidthVal = typeof p.maxWidth === "string" && p.maxWidth ? p.maxWidth : "100%";
      const heightVal = p.height
        ? typeof p.height === "number"
          ? `${p.height}px`
          : String(p.height)
        : "auto";

      const aspectMap: Record<string, string> = {
        "1:1": "1 / 1",
        "16:9": "16 / 9",
        "4:3": "4 / 3",
        "3:2": "3 / 2",
        "21:9": "21 / 9",
        "9:16": "9 / 16",
      };
      const aspectStyle =
        p.aspectRatio && aspectMap[String(p.aspectRatio)]
          ? aspectMap[String(p.aspectRatio)]
          : undefined;
      const objectFit =
        (p.objectFit as React.CSSProperties["objectFit"]) ?? "cover";

      const radiusMap: Record<string, string> = {
        none: "0px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      };
      const radius =
        p.borderRadius && radiusMap[String(p.borderRadius)]
          ? radiusMap[String(p.borderRadius)]
          : typeof p.borderRadius === "string" && p.borderRadius
            ? p.borderRadius
            : tokens.geometry.borderRadius;

      const shadowClass =
        p.shadow === "sm"
          ? "shadow-xs"
          : p.shadow === "md"
            ? "shadow-md"
            : p.shadow === "lg"
              ? "shadow-lg"
              : p.shadow === "xl"
                ? "shadow-2xl"
                : "";

      const alignClass =
        align === "center"
          ? "mx-auto text-center"
          : align === "right"
            ? "ml-auto text-right"
            : align === "full"
              ? "w-full text-left"
              : "mr-auto text-left";

      const imgElement = url ? (
        <ResponsiveImage
          src={url}
          alt={altText}
          title={titleText}
          width={typeof p.width === "number" ? p.width : undefined}
          height={typeof p.height === "number" ? p.height : undefined}
          priority={block.id === lcpBlockId}
          focal={mediaFocal}
          className="w-full h-full"
          style={{
            objectFit,
            aspectRatio: aspectStyle,
          }}
        />
      ) : null;

      return (
        <figure
          className={`space-y-2.5 ${alignClass}`}
          style={{
            width: widthVal,
            maxWidth: maxWidthVal,
          }}
        >
          <div
            style={{
              borderRadius: radius,
              borderColor: tokens.colors.border,
              height: heightVal !== "auto" ? heightVal : undefined,
              aspectRatio: aspectStyle,
            }}
            className={`overflow-hidden border bg-nx-subtle ${shadowClass}`}
          >
            {link ? (
              <a
                href={link}
                target={linkTarget}
                rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                className="block w-full h-full"
              >
                {imgElement}
              </a>
            ) : (
              imgElement
            )}
          </div>
          {caption && (
            <figcaption className="text-xs text-nx-muted italic">
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
