import React from "react";
import { ICON_PATHS, safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";

/**
 * Sekme ve akordeon blokları: yalnızca CSS ile çalışır (radyo düğmesi ve `<details>`), istemci JavaScript'i yoktur.
 * Görünüm `tabStyle` ve `accordionStyle` ile seçilir; renkler tema jetonlarından gelir.
 */
const text = (value: unknown, fallback = ""): string => (typeof value === "string" && value.trim() ? value : fallback);
const rows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object") : [];

export const ACCORDION_STYLES = ["classic", "cards", "flush", "filled", "accent", "numbered", "pills", "bold"] as const;
export const TAB_STYLES = ["pills", "underline", "boxed", "segmented", "vertical", "cards", "steps"] as const;

function accordionCss(cls: string, style: string, tokens: DesignTokens, icon: string): string {
  const { primary, border, muted, foreground } = tokens.colors;
  const r = tokens.geometry.borderRadius;
  const base = `
    .${cls}{counter-reset:acc}
    .${cls} details{counter-increment:acc}
    .${cls} summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:14px;font-weight:600;color:${foreground}}
    .${cls} summary::-webkit-details-marker{display:none}
    .${cls} .nx-acc-q{flex:1}
    .${cls} .nx-acc-a{line-height:1.7;opacity:.85}
    .${cls} .nx-acc-i{flex:none;width:20px;height:20px;position:relative;transition:transform .2s}
    ${
      icon === "plus"
        ? `.${cls} .nx-acc-i::before,.${cls} .nx-acc-i::after{content:"";position:absolute;left:3px;right:3px;top:9px;height:2px;background:currentColor;border-radius:2px;transition:transform .2s}
           .${cls} .nx-acc-i::after{transform:rotate(90deg)}
           .${cls} details[open] .nx-acc-i::after{transform:rotate(0)}`
        : icon === "none"
          ? `.${cls} .nx-acc-i{display:none}`
          : `.${cls} .nx-acc-i::before{content:"";position:absolute;left:5px;top:3px;width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg)}
             .${cls} details[open] .nx-acc-i{transform:rotate(180deg)}`
    }
    .${cls} .nx-acc-n::before{content:counter(acc,decimal-leading-zero)}`;
  const per: Record<string, string> = {
    classic: `.${cls}{display:grid;gap:8px} .${cls} details{border:1px solid ${border};border-radius:${r};background:var(--nx-card,#fff);padding:14px 18px} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin-top:10px}`,
    cards: `.${cls}{display:grid;gap:14px} .${cls} details{border:1px solid ${border};border-radius:20px;background:var(--nx-card,#fff);padding:20px 24px;box-shadow:0 6px 20px rgba(15,23,42,.06);transition:transform .2s,box-shadow .2s} .${cls} details:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(15,23,42,.1)} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin-top:12px}`,
    flush: `.${cls} details{border-bottom:1px solid ${border};padding:18px 4px} .${cls} details:first-child{border-top:1px solid ${border}} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin-top:10px}`,
    filled: `.${cls}{display:grid;gap:10px} .${cls} details{background:${muted};border-radius:16px;padding:18px 22px;transition:background .2s} .${cls} details[open]{background:color-mix(in srgb,${primary} 10%,${muted})} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin-top:10px}`,
    accent: `.${cls}{display:grid;gap:10px} .${cls} details{border:1px solid ${border};border-left:4px solid ${border};border-radius:${r};background:var(--nx-card,#fff);padding:16px 20px;transition:border-color .2s} .${cls} details[open]{border-left-color:${primary}} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin-top:10px}`,
    numbered: `.${cls} details{border-bottom:1px solid ${border};padding:20px 4px} .${cls} .nx-acc-n{flex:none;width:38px;height:38px;border-radius:999px;background:color-mix(in srgb,${primary} 12%,transparent);color:${primary};display:grid;place-items:center;font-size:13px;font-weight:700} .${cls} details[open] .nx-acc-n{background:${primary};color:#fff} .${cls} .nx-acc-a{margin:12px 0 0 52px}`,
    pills: `.${cls}{display:grid;gap:10px} .${cls} summary{border:1px solid ${border};border-radius:999px;padding:12px 22px;background:var(--nx-card,#fff);transition:background .2s,color .2s} .${cls} details[open] summary{background:${primary};color:#fff;border-color:${primary}} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-a{margin:10px 8px 6px;padding:14px 20px;border-radius:20px;background:${muted}}`,
    bold: `.${cls} details{border-bottom:1px solid ${border};padding:26px 0} .${cls} summary{font-size:1.35rem;font-weight:800;letter-spacing:-.01em} .${cls} .nx-acc-n{display:none} .${cls} .nx-acc-i{width:36px;height:36px;border-radius:999px;border:1px solid ${border};display:grid;place-items:center} .${cls} .nx-acc-a{margin-top:14px;font-size:1.05rem;max-width:46rem}`,
  };
  return base + (per[style] ?? per.classic);
}

export function AccordionView({ block, tokens, items }: { block: BlockNode; tokens: DesignTokens; items?: Array<{ q: string; a: string }> }) {
  const p = block.props ?? {};
  const raw = rows(p.items);
  const list = items ?? raw.map((item, i) => ({ q: text(item.question, text(item.title, `Madde ${i + 1}`)), a: text(item.answer, text(item.body)) }));
  const style = (ACCORDION_STYLES as readonly string[]).includes(String(p.accordionStyle)) ? String(p.accordionStyle) : "classic";
  const icon = p.icon === "plus" || p.icon === "none" ? String(p.icon) : "chevron";
  const openMode = p.openMode === "none" || p.openMode === "all" ? String(p.openMode) : p.openFirst === false ? "none" : "first";
  const exclusive = p.exclusive === true && openMode !== "all";
  const cls = `nx-acc-${safeBlockDomId(block.id)}`;
  return (
    <div className="space-y-4">
      {text(p.title) ? <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-lg font-bold text-nx-fg">{text(p.title)}</h3> : null}
      <div className={cls}>
        {list.map((item, index) => (
          <details key={index} open={openMode === "all" || (openMode === "first" && index === 0)} {...(exclusive ? ({ name: cls } as Record<string, string>) : {})}>
            <summary>
              <span className="nx-acc-n" aria-hidden="true" />
              <span className="nx-acc-q">{item.q}</span>
              <span className="nx-acc-i" aria-hidden="true" />
            </summary>
            <p className="nx-acc-a">{item.a}</p>
          </details>
        ))}
        <style>{accordionCss(cls, style, tokens, icon)}</style>
      </div>
    </div>
  );
}

function tabsCss(name: string, style: string, tokens: DesignTokens, count: number): string {
  const { primary, primaryForeground, border, muted } = tokens.colors;
  const active = (sel: string) => Array.from({ length: count }, (_, i) => `.${name} input:nth-of-type(${i + 1}):checked ~ .nx-tabbar .${name}-tab-${i}${sel}`).join(",");
  const panels = Array.from({ length: count }, (_, i) => `.${name} input:nth-of-type(${i + 1}):checked ~ .${name}-panel-${i}{display:block}`).join("");
  const base = `.${name} [class*="${name}-panel-"]{display:none}${panels}`;
  const lab = `.${name} .nx-tabbar label`;
  const per: Record<string, string> = {
    pills: `${active("{background:" + primary + ";color:" + primaryForeground + ";border-color:" + primary + "}")}`,
    boxed: `${active("{background:" + primary + ";color:" + primaryForeground + ";border-color:" + primary + "}")}`,
    underline: `${active("{border-bottom-color:" + primary + ";color:" + primary + "}")}`,
    segmented: `.${name} .nx-tabbar{display:inline-flex;background:${muted};border-radius:999px;padding:5px;gap:2px;max-width:100%;overflow-x:auto} ${lab}{border:0!important;border-radius:999px!important;background:transparent;padding:9px 20px} ${active("{background:var(--nx-card,#fff);color:" + primary + ";box-shadow:0 2px 10px rgba(15,23,42,.14)}")}`,
    vertical: `@media(min-width:768px){.${name}{display:grid;grid-template-columns:minmax(190px,270px) 1fr;column-gap:28px;align-items:start} .${name}>h3{grid-column:1/-1} .${name} .nx-tabbar{grid-column:1;grid-row:2/span 60;flex-direction:column;flex-wrap:nowrap;align-items:stretch} .${name} [class*="${name}-panel-"]{grid-column:2;grid-row:2}} ${lab}{justify-content:flex-start!important;text-align:left;border-radius:12px} ${active("{background:" + primary + ";color:" + primaryForeground + ";border-color:" + primary + "}")}`,
    cards: `.${name} .nx-tabbar{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px} ${lab}{flex-direction:column;align-items:flex-start!important;justify-content:flex-start!important;text-align:left;padding:18px!important;border-radius:18px!important;background:var(--nx-card,#fff);gap:8px;min-height:96px} ${active("{border-color:" + primary + ";background:color-mix(in srgb," + primary + " 10%,transparent);box-shadow:0 8px 22px color-mix(in srgb," + primary + " 22%,transparent)}")}`,
    steps: `.${name}{counter-reset:tab} ${lab}{counter-increment:tab;border-radius:999px!important;padding:8px 18px 8px 10px!important;background:var(--nx-card,#fff)} ${lab}::before{content:counter(tab);display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${muted};font-size:12px;font-weight:800} ${active("{border-color:" + primary + ";color:" + primary + "}")} ${active("::before{background:" + primary + ";color:" + primaryForeground + "}")}`,
  };
  void border;
  return base + (per[style] ?? per.pills);
}

export function TabsView({ block, tokens, renderChild }: { block: BlockNode; tokens: DesignTokens; renderChild?: (child: BlockNode) => React.ReactElement | null }) {
  const p = block.props ?? {};
  const items = rows(p.items);
  const name = `nx-tabs-${safeBlockDomId(block.id)}`;
  const panes = Array.isArray(block.children) ? block.children : [];
  const count = Math.max(items.length, panes.length);
  const style = (TAB_STYLES as readonly string[]).includes(String(p.tabStyle)) ? String(p.tabStyle) : "pills";
  const align = String(p.align ?? "left");
  const frameBox: React.CSSProperties = { borderColor: tokens.colors.border, borderRadius: tokens.geometry.borderRadius };
  const tabs = Array.from({ length: count }, (_, index) => {
    const pane = panes[index];
    const item = items[index] ?? {};
    return {
      index,
      label: text(pane?.props?.label, text(item.label, `Sekme ${index + 1}`)),
      iconName: text(pane?.props?.icon, text(item.icon)),
      subtitle: text(pane?.props?.subtitle, text(item.subtitle)),
      itemTitle: text(pane?.props?.title, text(item.title)),
      body: text(pane?.props?.body, text(item.body)),
      children: Array.isArray(pane?.children) ? pane.children : [],
    };
  });
  const justify = align === "center" ? "justify-center" : align === "stretch" ? "grid grid-cols-2 sm:grid-cols-3 md:flex" : "justify-start";
  const bar = style === "underline" ? "border-b pb-0" : style === "boxed" ? "rounded-xl bg-nx-subtle p-1.5" : "";
  const flat = style === "underline" ? "-mb-px border-b-2 border-transparent" : "rounded-lg border";
  return (
    <div className={`${name} space-y-4`}>
      {text(p.title) ? <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl font-bold text-nx-fg">{text(p.title)}</h3> : null}
      {tabs.map(({ index }) => (
        <input key={`i${index}`} id={`${name}-${index}`} name={name} type="radio" defaultChecked={index === 0} className="sr-only" />
      ))}
      <div className={`nx-tabbar flex flex-wrap gap-2 ${justify} ${bar}`} style={{ borderColor: tokens.colors.border }}>
        {tabs.map(({ index, label, iconName, subtitle }) => {
          const iconPath = iconName ? ICON_PATHS[iconName] : undefined;
          return (
            <label key={`t${index}`} htmlFor={`${name}-${index}`} className={`${name}-tab-${index} inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition select-none ${align === "stretch" ? "flex-1 text-center" : ""} ${flat}`} style={style === "underline" ? undefined : frameBox}>
              {iconPath ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPath} /></svg>
              ) : null}
              <span>{label}</span>
              {subtitle ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-medium opacity-80">{subtitle}</span> : null}
            </label>
          );
        })}
      </div>
      {tabs.map(({ index, itemTitle, body, children }) => (
        <div key={`p${index}`} style={frameBox} className={`${name}-panel-${index} rounded-xl border bg-nx-card p-6 text-sm leading-relaxed text-nx-soft`}>
          {children.length > 0 && renderChild ? (
            <div className="space-y-4">{children.map((child) => <React.Fragment key={child.id}>{renderChild(child)}</React.Fragment>)}</div>
          ) : (
            <div className="space-y-2">
              {itemTitle ? <h4 className="text-base font-bold text-nx-fg">{itemTitle}</h4> : null}
              {body ? <p className="whitespace-pre-line">{body}</p> : null}
            </div>
          )}
        </div>
      ))}
      <style>{tabsCss(name, style, tokens, count)}</style>
    </div>
  );
}
