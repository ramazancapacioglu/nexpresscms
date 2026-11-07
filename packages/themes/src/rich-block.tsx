import React from "react";
import { markupForHeading, sanitizeInlineHtml } from "@nexpress/core";

export function RichBlock({
  html,
  text,
  className,
  style,
  as,
}: {
  html?: unknown;
  text?: unknown;
  className: string;
  style?: React.CSSProperties;
  as: "p" | "div" | "h1" | "h2" | "h3" | "h4";
}) {
  const Tag = as;
  const markup = typeof html === "string" ? html.trim() : "";
  if (!markup) {
    return (
      <Tag className={className} style={style}>
        {String(text ?? "")}
      </Tag>
    );
  }
  const safe = as === "div" ? sanitizeInlineHtml(markup) : markupForHeading(markup);
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: safe }} />;
}
