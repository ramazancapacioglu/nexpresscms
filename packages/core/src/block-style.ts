import type { BlockNode, BlockStyle, BlockStyleValues } from "./types";

export const BREAKPOINTS = {
  tabletMax: 1024,
  mobileMax: 640,
} as const;

export const CONTAINER_BLOCK_TYPES = ["section", "columns", "column"] as const;

export function isContainerBlock(type: string): boolean {
  return (CONTAINER_BLOCK_TYPES as readonly string[]).includes(type);
}

export function safeBlockDomId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 4px 12px rgba(0,0,0,.10)",
  lg: "0 10px 30px rgba(0,0,0,.14)",
  xl: "0 20px 50px rgba(0,0,0,.20)",
};

function cssSafe(value: string): string {
  // Stil enjeksiyonunu engelle: `;`, `{`, `}`, `<` ve `@import` yasak.
  return value.replace(/[;{}<>]/g, "").replace(/@import/gi, "").trim();
}

function valuesToDeclarations(v: BlockStyleValues | undefined): string {
  if (!v) return "";
  const d: string[] = [];
  const push = (prop: string, val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return;
    d.push(`${prop}:${typeof val === "number" ? val : cssSafe(String(val))}`);
  };
  push("padding-top", v.paddingTop);
  push("padding-right", v.paddingRight);
  push("padding-bottom", v.paddingBottom);
  push("padding-left", v.paddingLeft);
  push("margin-top", v.marginTop);
  push("margin-bottom", v.marginBottom);
  if (v.backgroundColor) push("background-color", v.backgroundColor);
  if (v.backgroundGradient) push("background-image", v.backgroundGradient);
  if (v.background) push("background", v.background);
  if (v.backgroundImage) {
    const url = cssSafe(v.backgroundImage).replace(/"/g, "%22");
    d.push(`background-image:url("${url}")`);
    d.push("background-size:cover");
    d.push("background-position:center");
  }
  push("color", v.textColor);
  push("text-align", v.textAlign);
  push("font-size", v.fontSize);
  push("max-width", v.maxWidth);
  push("min-height", v.minHeight);
  push("gap", v.gap);
  if (v.borderWidth) {
    d.push(`border-width:${cssSafe(v.borderWidth)}`);
    d.push("border-style:solid");
    d.push(`border-color:${cssSafe(v.borderColor || "var(--nx-border, #e5e7eb)")}`);
  }
  push("border-radius", v.borderRadius);
  if (v.boxShadow) push("box-shadow", SHADOWS[v.boxShadow]);
  push("opacity", v.opacity);
  return d.join(";");
}

function collect(blocks: BlockNode[], parentType: string | null, out: string[]): void {
  for (const b of blocks) {
    const sel = `[data-nx-b="${safeBlockDomId(b.id)}"]`;
    const s: BlockStyle | undefined = b.style;

    // Sütun genişlikleri (Columns > Column)
    if (b.type === "column") {
      const g = b.gridSpan ?? { desktop: 6, tablet: 12, mobile: 12 };
      out.push(`${sel}{grid-column:span 12}`);
      out.push(
        `@media (min-width:${BREAKPOINTS.tabletMax + 1}px){${sel}{grid-column:span ${g.desktop}}}`
      );
      out.push(
        `@media (min-width:${BREAKPOINTS.mobileMax + 1}px) and (max-width:${BREAKPOINTS.tabletMax}px){${sel}{grid-column:span ${g.tablet}}}`
      );
      out.push(
        `@media (max-width:${BREAKPOINTS.mobileMax}px){${sel}{grid-column:span ${g.mobile}}}`
      );
    }

    if (s) {
      const base = valuesToDeclarations(s);
      const extra: string[] = [];
      if (s.fullWidth && parentType === null) {
        extra.push("width:100vw", "position:relative", "left:50%", "margin-left:-50vw");
      }
      const all = [base, ...extra].filter(Boolean).join(";");
      if (all) out.push(`${sel}{${all}}`);

      if (s.backgroundOverlay && s.backgroundImage) {
        out.push(
          `${sel}{position:relative}${sel}::before{content:"";position:absolute;inset:0;background:${cssSafe(
            s.backgroundOverlay
          )};border-radius:inherit;pointer-events:none}${sel}>*{position:relative}`
        );
      }

      const tablet = valuesToDeclarations(s.tablet);
      if (tablet) {
        out.push(
          `@media (min-width:${BREAKPOINTS.mobileMax + 1}px) and (max-width:${BREAKPOINTS.tabletMax}px){${sel}{${tablet}}}`
        );
      }
      const mobile = valuesToDeclarations(s.mobile);
      if (mobile) {
        out.push(`@media (max-width:${BREAKPOINTS.mobileMax}px){${sel}{${mobile}}}`);
      }

      const hideRaw = s.hideOn;
      const hideDesktop = Array.isArray(hideRaw)
        ? hideRaw.includes("desktop")
        : Boolean(hideRaw?.desktop);
      const hideTablet = Array.isArray(hideRaw)
        ? hideRaw.includes("tablet")
        : Boolean(hideRaw?.tablet);
      const hideMobile = Array.isArray(hideRaw)
        ? hideRaw.includes("mobile")
        : Boolean(hideRaw?.mobile);

      if (hideDesktop) {
        out.push(`@media (min-width:${BREAKPOINTS.tabletMax + 1}px){${sel}{display:none!important}}`);
      }
      if (hideTablet) {
        out.push(
          `@media (min-width:${BREAKPOINTS.mobileMax + 1}px) and (max-width:${BREAKPOINTS.tabletMax}px){${sel}{display:none!important}}`
        );
      }
      if (hideMobile) {
        out.push(`@media (max-width:${BREAKPOINTS.mobileMax}px){${sel}{display:none!important}}`);
      }

      if (s.customCss && s.customCss.trim()) {
        const scoped = s.customCss
          .replace(/<\/?style[^>]*>/gi, "")
          .replace(/@import[^;]*;?/gi, "")
          .replace(/\bselector\b/g, sel);
        out.push(scoped);
      }
    }

    if (b.children && b.children.length > 0) {
      collect(b.children, b.type, out);
    }
  }
}

/**
 * Blok ağacındaki tüm `style` tanımlarını (aygıt bazlı medya sorgularıyla) tek bir saf CSS metnine derler.
 * Hem 0-KB RSC ön yüzde hem de editör kanvasında aynı çıktıyı üretir (gerçek WYSIWYG).
 */
export function compileBlockStylesToCss(blocks: BlockNode[]): string {
  const out: string[] = [];
  collect(blocks, null, out);
  return out.join("\n");
}
