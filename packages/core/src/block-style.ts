import type { BlockAnimationName, BlockHoverValues, BlockNode, BlockStyle, BlockStyleValues } from "./types";

export const BREAKPOINTS = {
  tabletMax: 1024,
  mobileMax: 640,
} as const;

export const CONTAINER_BLOCK_TYPES = ["section", "columns", "column", "tabs"] as const;

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

const TEXT_SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.25)",
  md: "0 2px 8px rgba(0,0,0,.35)",
  lg: "0 4px 18px rgba(0,0,0,.45)",
};

/** Giriş animasyonu anahtar kareleri: `animation-timeline: view()` ile kaydırmaya bağlı, JS gerektirmez. */
const ANIMATION_FRAMES: Record<string, string> = {
  "fade-in": "from{opacity:0}to{opacity:1}",
  "fade-up": "from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}",
  "fade-down": "from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}",
  "fade-left": "from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}",
  "fade-right": "from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}",
  "zoom-in": "from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}",
};
export const BLOCK_ANIMATIONS = Object.keys(ANIMATION_FRAMES) as BlockAnimationName[];

function cssSafe(value: string): string {
  // Stil enjeksiyonunu engelle: `;`, `{`, `}`, `<` ve `@import` yasak.
  return value.replace(/[;{}<>]/g, "").replace(/@import/gi, "").trim();
}

const TEXT_LEAF = new Set(["heading", "heading_element", "paragraph", "paragraph_element", "text_div"]);
const BORDER_STYLES = new Set(["solid", "dashed", "dotted", "double"]);
const TEXT_TRANSFORMS = new Set(["none", "uppercase", "lowercase", "capitalize"]);

function transformOf(v: Pick<BlockStyleValues, "translateY" | "scale" | "rotate">): string {
  const t: string[] = [];
  if (v.translateY) t.push(`translateY(${cssSafe(v.translateY)})`);
  if (typeof v.scale === "number" && Number.isFinite(v.scale) && v.scale > 0 && v.scale <= 3) t.push(`scale(${v.scale})`);
  if (v.rotate) t.push(`rotate(${cssSafe(v.rotate)})`);
  return t.join(" ");
}

function hoverDeclarations(h: BlockHoverValues | undefined): string {
  if (!h) return "";
  const d: string[] = [];
  const push = (prop: string, val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return;
    d.push(`${prop}:${typeof val === "number" ? val : cssSafe(String(val))}`);
  };
  push("color", h.textColor);
  push("background-color", h.backgroundColor);
  push("border-color", h.borderColor);
  if (h.boxShadow) push("box-shadow", SHADOWS[h.boxShadow]);
  push("opacity", h.opacity);
  const tf = transformOf(h);
  if (tf) d.push(`transform:${tf}`);
  return d.join(";");
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
  push("margin-left", v.marginLeft);
  push("margin-right", v.marginRight);
  if (v.borderStyle && v.borderWidth) d.push(`border-style:${BORDER_STYLES.has(v.borderStyle) ? v.borderStyle : "solid"}`);
  push("font-family", v.fontFamily);
  push("font-weight", v.fontWeight && /^[1-9]00$/.test(v.fontWeight) ? v.fontWeight : undefined);
  push("line-height", v.lineHeight);
  push("letter-spacing", v.letterSpacing);
  if (v.textTransform && TEXT_TRANSFORMS.has(v.textTransform)) d.push(`text-transform:${v.textTransform}`);
  if (v.textShadow) push("text-shadow", TEXT_SHADOWS[v.textShadow]);
  if (v.backgroundSize && ["cover", "contain", "auto"].includes(v.backgroundSize)) d.push(`background-size:${v.backgroundSize}`);
  push("background-position", v.backgroundPosition);
  if (v.backgroundFixed) d.push("background-attachment:fixed");
  const tf = transformOf(v);
  if (tf) d.push(`transform:${tf}`);
  return d.join(";");
}

function collect(blocks: BlockNode[], parentType: string | null, out: string[], used: Set<string>): void {
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
      const width = s.blockWidth === "site" || s.blockWidth === "full" ? s.blockWidth : s.fullWidth && parentType === null ? "full" : null;
      if (width === "full") {
        extra.push("width:100vw", "max-width:100vw", "position:relative", "left:50%", "margin-left:-50vw");
      }
      if (width === "site") {
        extra.push("width:100%", "max-width:var(--nx-container,1200px)", "margin-left:auto", "margin-right:auto");
      }
      const all = [base, ...extra].filter(Boolean).join(";");
      if (all) out.push(`${sel}{${all}}`);
      // Metin rengi kapsayıcıda yazılınca içteki başlık ve paragraflar da onu alır (bloklar kendi sınıf rengini taşıdığından kalıtım gerekir)
      if (s.textColor) out.push(`${sel} :is(h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,.nx-rich){color:inherit}`);
      // Metin bloklarında yazı ölçüsü ve ağırlığı da içteki öğeye geçer (başlık/paragraf kendi sınıf boyutunu taşır)
      if (TEXT_LEAF.has(b.type)) {
        const inherit = (["fontSize", "fontWeight", "lineHeight", "letterSpacing"] as const)
          .filter((k) => s[k] || s.tablet?.[k] || s.mobile?.[k])
          .map((k) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:inherit`);
        if (inherit.length) out.push(`${sel} :is(h1,h2,h3,h4,p,div){${inherit.join(";")}}`);
      }

      if (s.backgroundOverlay && s.backgroundImage) {
        out.push(
          `${sel}{position:relative}${sel}::before{content:"";position:absolute;inset:0;background:${cssSafe(
            s.backgroundOverlay
          )};border-radius:inherit;pointer-events:none}${sel}>*{position:relative}`
        );
      }

      const hover = hoverDeclarations(s.hover);
      if (hover) {
        const ms = Number.isFinite(s.transitionMs) ? Math.min(Math.max(Number(s.transitionMs), 0), 3000) : 200;
        out.push(`${sel}{transition:all ${ms}ms ease}`);
        out.push(`@media (hover:hover){${sel}:hover{${hover}}}`);
      }
      if (s.animation && ANIMATION_FRAMES[s.animation]) {
        used.add(s.animation);
        const ms = Number.isFinite(s.transitionMs) ? Math.min(Math.max(Number(s.transitionMs), 0), 3000) : 0;
        out.push(
          `@supports (animation-timeline:view()){${sel}{animation:nx-${s.animation} linear both;animation-timeline:view();animation-range:entry 0% entry ${ms > 0 ? Math.round(ms / 20) : 60}%}}`
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
      collect(b.children, b.type, out, used);
    }
  }
}

/**
 * Blok ağacındaki tüm `style` tanımlarını (aygıt bazlı medya sorgularıyla) tek bir saf CSS metnine derler.
 * Hem 0-KB RSC ön yüzde hem de editör kanvasında aynı çıktıyı üretir (gerçek WYSIWYG).
 */
export function compileBlockStylesToCss(blocks: BlockNode[]): string {
  const out: string[] = [];
  const used = new Set<string>();
  collect(blocks, null, out, used);
  const frames = [...used].map((n) => `@keyframes nx-${n}{${ANIMATION_FRAMES[n]}}`);
  return [...frames, ...out].join("\n");
}

export interface GradientStop { color: string; pos: number }
export interface GradientSpec { type: "linear" | "radial"; angle: number; stops: GradientStop[] }

const GRADIENT_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/]+\)|var\(--[a-z0-9-]+(,\s*#[0-9a-f]{3,8})?\)|[a-z]{3,20})$/i;

/** Görsel gradyan oluşturucunun çıktısı: doğrulanmış CSS gradyan metni (geçersiz renk/duraklar atılır; en az 2 durak yoksa boş). */
export function buildGradient(spec: GradientSpec): string {
  const stops = spec.stops
    .filter((s) => typeof s.color === "string" && GRADIENT_COLOR.test(s.color.trim()))
    .slice(0, 5)
    .map((s) => `${s.color.trim()} ${Math.min(100, Math.max(0, Math.round(Number.isFinite(s.pos) ? s.pos : 0)))}%`);
  if (stops.length < 2) return "";
  const angle = Math.round((((Number(spec.angle) || 0) % 360) + 360) % 360);
  return spec.type === "radial" ? `radial-gradient(circle at center, ${stops.join(", ")})` : `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}
