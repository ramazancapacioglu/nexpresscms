import React from "react";
import { ICON_PATHS, megaChildLayout, type DesignTokens, type MegaMenuConfig, type NavigationLink, type NavigationMenuItem } from "@nexpress/core";

/**
 * Ziyaretçi menüsü (RSC, istemci JS'i yok). Masaüstü: açılır alt menü ve mega menü yalnızca CSS ile (hover + klavye odağı).
 * Mobil: `<details>` ile açılan iç içe liste. Bağlantılar düz `<a>`'dır (yönlendirici JS'i yüklenmez).
 */
const WIDTH: Record<NonNullable<MegaMenuConfig["width"]>, string> = { narrow: "w-[min(440px,92vw)]", wide: "w-[min(760px,92vw)]", full: "w-[min(1120px,92vw)]" };
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
const SHOW = "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

const rel = (l: NavigationLink) => (l.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {});

function NavSvgIcon({ name, size = 15, className = "" }: { name?: string; size?: number; className?: string }) {
  const path = name ? ICON_PATHS[name] : undefined;
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={path} />
    </svg>
  );
}

export function MenuList(props: { links: NavigationLink[] }) {
  return <SubList links={props.links} />;
}

function SubList({ links, depth = 0 }: { links: NavigationLink[]; depth?: number }) {
  return (
    <ul className={depth ? "mt-0.5 space-y-0.5 border-l border-current/15 pl-3" : "space-y-0.5"}>
      {links.map((l) => (
        <li key={l.id}>
          <a href={l.href} {...rel(l)} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm opacity-90 hover:bg-black/5 hover:opacity-100">
            <NavSvgIcon name={l.icon} size={14} className="opacity-75" />
            <span>{l.label}</span>
            {l.badge ? <span className="ml-auto rounded bg-black/10 px-1.5 py-px text-[10px] font-bold uppercase">{l.badge}</span> : null}
          </a>
          {l.children?.length ? <SubList links={l.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

function MegaPanel({ item, tokens }: { item: NavigationMenuItem; tokens: DesignTokens }) {
  const mega = item.megaMenu!;
  const layout = megaChildLayout(item);
  const cols = COLS[Math.min(4, Math.max(1, mega.columns))] ?? "grid-cols-3";
  const kids = item.children ?? [];
  return (
    <div
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border, backgroundColor: tokens.colors.background, color: tokens.colors.foreground }}
      className={`nx-mega absolute left-1/2 top-full z-50 -translate-x-1/2 ${WIDTH[mega.width ?? "wide"]} border p-5 shadow-xl transition-all duration-150 ${SHOW}`}
    >
      {layout === "cards" || layout === "cards-and-list" ? (
        <div className={`grid gap-3.5 ${cols}`}>
          {mega.items.map((sub) => (
            <a key={sub.id} href={sub.href} className="group/card flex items-start gap-3 rounded-xl border border-transparent p-3 transition hover:border-current/15 hover:bg-black/5">
              {sub.icon && ICON_PATHS[sub.icon] ? (
                <span
                  style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }}
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <NavSvgIcon name={sub.icon} size={18} />
                </span>
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{sub.label}</span>
                  {sub.badge ? (
                    <span style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }} className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase">
                      {sub.badge}
                    </span>
                  ) : null}
                </div>
                {sub.description ? <p className="text-xs leading-snug opacity-70">{sub.description}</p> : null}
              </div>
            </a>
          ))}
        </div>
      ) : null}
      {layout === "columns" ? (
        <div className={`grid gap-6 ${cols}`}>
          {kids.map((col) => (
            <div key={col.id}>
              <a href={col.href} {...rel(col)} className="nx-mega-title flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline">
                <NavSvgIcon name={col.icon} size={14} />
                <span>{col.label}</span>
                {col.badge ? (
                  <span style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }} className="ml-1 rounded px-1.5 py-px text-[9px] font-bold uppercase">
                    {col.badge}
                  </span>
                ) : null}
              </a>
              {col.description ? <p className="mt-0.5 text-xs opacity-70">{col.description}</p> : null}
              {col.children?.length ? <div className="mt-2"><SubList links={col.children} /></div> : null}
            </div>
          ))}
        </div>
      ) : null}
      {layout === "list" || layout === "cards-and-list" ? (
        <div className={layout === "cards-and-list" ? "mt-4 border-t border-current/10 pt-3" : ""}>
          <SubList links={kids} />
        </div>
      ) : null}
      {mega.promoBanner && mega.promoBanner.title ? (
        <div style={{ backgroundColor: tokens.colors.muted, borderRadius: tokens.geometry.borderRadius }} className="mt-4 flex items-center justify-between gap-3 p-3.5">
          <div>
            <div className="text-xs font-bold">{mega.promoBanner.title}</div>
            {mega.promoBanner.subtitle ? <div className="text-xs opacity-70">{mega.promoBanner.subtitle}</div> : null}
          </div>
          <a href={mega.promoBanner.ctaHref} style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold">
            {mega.promoBanner.ctaText || "İncele"}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function DesktopNav({ menu, tokens, ink, align }: { menu: NavigationMenuItem[]; tokens: DesignTokens; ink: boolean; align: "left" | "center" | "right" }) {
  const linkCls = ink ? "text-zinc-300 hover:text-white" : "text-nx-soft hover:text-nx-fg";
  return (
    <nav aria-label="Ana menü" className={`hidden items-stretch gap-6 self-stretch md:flex ${align === "center" ? "justify-self-center" : align === "right" ? "ml-auto" : ""}`}>
      {menu.map((item) => {
        const hasPanel = Boolean(item.megaMenu?.enabled) || Boolean(item.children?.length);
        return (
          <div key={item.id} className={`group flex h-full items-center ${item.megaMenu?.enabled ? "static" : "relative"}`}>
            <a href={item.href} {...rel(item)} aria-haspopup={hasPanel ? "true" : undefined} className={`flex items-center gap-1 whitespace-nowrap text-[13px] font-medium ${linkCls}`}>
              <NavSvgIcon name={item.icon} size={13} className="opacity-80" />
              <span>{item.label}</span>
              {item.badge ? (
                <span style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }} className="rounded px-1.5 py-px text-[9px] font-bold uppercase">
                  {item.badge}
                </span>
              ) : null}
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

/** Mobil dal: çocuğu olan satır kapalı gelir, JS'siz `<details>` ile açılır. */
function MobileBranch({ item, allLabel }: { item: NavigationLink; allLabel: string }) {
  const kids = item.children ?? [];
  if (kids.length === 0) {
    return (
      <a href={item.href} {...rel(item)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] leading-snug hover:bg-black/5">
        <NavSvgIcon name={item.icon} size={14} className="opacity-70" />
        <span>{item.label}</span>
      </a>
    );
  }
  return (
    <details className="border-b border-black/5 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        <span>{item.label}</span>
        <span aria-hidden="true" className="text-[10px] opacity-50">▼</span>
      </summary>
      <div className="space-y-0.5 pb-2 pl-2">
        <a href={item.href} {...rel(item)} className="block rounded-lg px-3 py-2 text-[13px] font-medium text-[#0071e3]">
          {allLabel}
        </a>
        {kids.map((child) => (
          <MobileBranch key={child.id} item={child} allLabel={allLabel} />
        ))}
      </div>
    </details>
  );
}

/** Mobil menü: JS'siz panel. Kökler kapalı, altlar isteyince açılır. */
export function MobileNav({ menu, extra, label, allLabel }: { menu: NavigationMenuItem[]; extra?: NavigationLink[]; label: string; allLabel: string }) {
  const seen = new Set(menu.map((item) => `${item.label}|${item.href}`));
  const items: NavigationLink[] = [...menu, ...(extra ?? []).filter((item) => !seen.has(`${item.label}|${item.href}`))];
  if (items.length === 0) return null;
  return (
    <details className="nx-mobile-nav group relative md:hidden">
      <summary className="flex h-10 cursor-pointer list-none items-center rounded-md border border-current/20 px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">{label}</summary>
      <nav aria-label="Mobil menü" className="absolute right-0 top-full z-50 mt-2 max-h-[80vh] w-[min(380px,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-current/10 bg-white p-2 text-nx-fg shadow-xl">
        {items.map((item) => (
          <MobileBranch key={item.id} item={item} allLabel={allLabel} />
        ))}
      </nav>
    </details>
  );
}
