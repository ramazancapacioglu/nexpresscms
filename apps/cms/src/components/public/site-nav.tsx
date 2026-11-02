import React from "react";
import type { DesignTokens, MegaMenuConfig, NavigationLink, NavigationMenuItem } from "@nexpress/core";

/**
 * Ziyaretçi menüsü (RSC, istemci JS'i yok). Masaüstü: açılır alt menü ve mega menü yalnızca CSS ile (hover + klavye odağı).
 * Mobil: `<details>` ile açılan iç içe liste. Bağlantılar düz `<a>`'dır (yönlendirici JS'i yüklenmez).
 */
const WIDTH: Record<NonNullable<MegaMenuConfig["width"]>, string> = { narrow: "w-[420px]", wide: "w-[720px]", full: "w-[min(1100px,92vw)]" };
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
const SHOW = "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

const rel = (l: NavigationLink) => (l.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {});

function SubList({ links, depth = 0 }: { links: NavigationLink[]; depth?: number }) {
  return (
    <ul className={depth ? "mt-0.5 space-y-0.5 border-l border-current/15 pl-3" : "space-y-0.5"}>
      {links.map((l) => (
        <li key={l.id}>
          <a href={l.href} {...rel(l)} className="block rounded px-2 py-1.5 text-sm opacity-90 hover:bg-black/5 hover:opacity-100">
            {l.label}
            {l.badge ? <span className="ml-2 rounded bg-black/10 px-1.5 py-px text-[10px] font-bold uppercase">{l.badge}</span> : null}
          </a>
          {l.children?.length ? <SubList links={l.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

function MegaPanel({ item, tokens }: { item: NavigationMenuItem; tokens: DesignTokens }) {
  const mega = item.megaMenu!;
  const cols = COLS[Math.min(4, Math.max(1, mega.columns))] ?? "grid-cols-3";
  return (
    <div
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border, backgroundColor: tokens.colors.background, color: tokens.colors.foreground }}
      className={`absolute left-0 top-full z-50 ${WIDTH[mega.width ?? "wide"]} border p-5 shadow-xl transition-all duration-150 ${SHOW}`}
    >
      {(mega.mode ?? (mega.items.length > 0 ? "custom" : "children")) === "custom" ? (
        <div className={`grid gap-4 ${cols}`}>
          {mega.items.map((sub) => (
            <a key={sub.id} href={sub.href} className="block space-y-1 rounded-lg border border-transparent p-3 hover:border-current/15 hover:bg-black/5">
              {sub.badge ? <span style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }} className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase">{sub.badge}</span> : null}
              <div className="text-sm font-semibold">{sub.label}</div>
              {sub.description ? <p className="text-xs leading-snug opacity-70">{sub.description}</p> : null}
            </a>
          ))}
        </div>
      ) : (
        <div className={`grid gap-6 ${cols}`}>
          {(item.children ?? []).map((col) => (
            <div key={col.id}>
              <a href={col.href} {...rel(col)} className="block text-xs font-bold uppercase tracking-wider hover:underline">{col.label}</a>
              {col.description ? <p className="mt-0.5 text-xs opacity-70">{col.description}</p> : null}
              {col.children?.length ? <div className="mt-2"><SubList links={col.children} /></div> : null}
            </div>
          ))}
        </div>
      )}
      {mega.promoBanner ? (
        <div style={{ backgroundColor: tokens.colors.muted, borderRadius: tokens.geometry.borderRadius }} className="mt-4 flex items-center justify-between gap-3 p-3.5">
          <div>
            <div className="text-xs font-bold">{mega.promoBanner.title}</div>
            {mega.promoBanner.subtitle ? <div className="text-xs opacity-70">{mega.promoBanner.subtitle}</div> : null}
          </div>
          <a href={mega.promoBanner.ctaHref} style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold">
            {mega.promoBanner.ctaText}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function DesktopNav({ menu, tokens, ink, align }: { menu: NavigationMenuItem[]; tokens: DesignTokens; ink: boolean; align: "left" | "center" | "right" }) {
  const linkCls = ink ? "text-zinc-300 hover:text-white" : "text-slate-700 hover:text-slate-950";
  return (
    <nav aria-label="Ana menü" className={`hidden items-center gap-6 md:flex ${align === "center" ? "justify-self-center" : align === "right" ? "ml-auto" : ""}`}>
      {menu.map((item) => {
        const hasPanel = Boolean(item.megaMenu?.enabled) || Boolean(item.children?.length);
        return (
          <div key={item.id} className="group relative py-4">
            <a href={item.href} {...rel(item)} aria-haspopup={hasPanel ? "true" : undefined} className={`flex items-center gap-1 text-sm font-medium ${linkCls}`}>
              <span>{item.label}</span>
              {hasPanel ? <span aria-hidden="true" className="text-[9px] opacity-60">▼</span> : null}
            </a>
            {item.megaMenu?.enabled ? (
              <MegaPanel item={item} tokens={tokens} />
            ) : item.children?.length ? (
              <div style={{ backgroundColor: tokens.colors.background, color: tokens.colors.foreground, borderColor: tokens.colors.border }} className={`absolute left-0 top-full z-50 w-60 border p-2 shadow-lg ${SHOW}`}>
                <SubList links={item.children} />
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/** Mobil menü: JS'siz `<details>`; tüm ağaç iç içe liste olarak açılır. */
export function MobileNav({ menu, label }: { menu: NavigationMenuItem[]; label: string }) {
  if (menu.length === 0) return null;
  return (
    <details className="group relative md:hidden">
      <summary className="flex h-10 cursor-pointer list-none items-center rounded-md border border-current/20 px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">{label}</summary>
      <nav aria-label="Mobil menü" className="absolute right-0 top-full z-50 mt-2 max-h-[80vh] w-[min(320px,90vw)] overflow-y-auto rounded-lg border border-current/15 bg-white p-3 text-slate-900 shadow-xl">
        <SubList links={menu} />
      </nav>
    </details>
  );
}
