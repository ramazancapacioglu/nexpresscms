import React from "react";
import { isSafeMenuHref, type DesignTokens, type FooterConfig, type HeaderConfig, type NavigationMenuItem, type SiteSettings } from "@nexpress/core";
import { DesktopNav, MobileNav } from "./site-nav";

interface HeaderProps {
  siteName: string;
  tagline?: string | null;
  locale: string;
  menu: NavigationMenuItem[];
  tokens: DesignTokens;
  ink: boolean;
  header: HeaderConfig | undefined;
  custom: SiteSettings["customizer"]["header"];
  menuLabel: string;
}

/** Üst çubuk + ana şerit + menü (RSC). Geliştirme amaçlı rozet, tema bilgisi ve yönetim bağlantısı ziyaretçiye gösterilmez. */
export function SiteHeader({ siteName, tagline, locale, menu, tokens, ink, header, custom, menuLabel }: HeaderProps) {
  const main = header?.mainBar;
  const top = header?.topBar;
  const bottomLinks = header?.bottomBar.links ?? [];
  const ctaLabel = (custom.ctaLabel || main?.ctaLabel || "").trim();
  const ctaHref = (custom.ctaHref || main?.ctaHref || "").trim();
  const showCta = custom.showCta !== false && ctaLabel !== "" && isSafeMenuHref(ctaHref) && !ctaHref.startsWith("/admin");
  const logoText = custom.logoText.trim() || siteName;
  const sticky = main?.sticky ?? custom.sticky;
  const glass = main?.glassmorphism ?? custom.glass;
  const align = custom.menuAlign;

  return (
    <>
      {top?.enabled && (top.announcementText || top.contactPhone || top.contactEmail) ? (
        <div style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground }} className="border-b border-white/10 px-4 py-2 text-xs">
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{top.announcementText}</span>
            <div className="flex items-center gap-4 text-[11px] opacity-90">
              {top.contactPhone ? <a href={`tel:${top.contactPhone.replace(/[^\d+]/g, "")}`}>{top.contactPhone}</a> : null}
              {top.contactEmail ? <a href={`mailto:${top.contactEmail}`}>{top.contactEmail}</a> : null}
            </div>
          </div>
        </div>
      ) : null}

      <header
        style={{ borderColor: tokens.colors.border, backgroundColor: ink ? tokens.colors.background : undefined }}
        className={
          ink
            ? "nx-public-header sticky top-0 z-40 border-b"
            : `nx-public-header z-40 border-b ${sticky === false ? "relative" : "sticky top-0"} ${glass === false ? "bg-white" : "bg-white/90 backdrop-blur-md"}`
        }
      >
        <div style={{ maxWidth: ink ? "100%" : tokens.geometry.containerMaxWidth, minHeight: custom.height || 64 }} className="mx-auto flex items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <a href={`/${locale}`} className="flex min-w-0 items-center gap-2.5">
              {custom.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={custom.logoImage} alt={logoText} className="h-8 w-auto" />
              ) : (
                <span style={{ fontFamily: tokens.typography.headingFont, color: ink ? tokens.colors.foreground : undefined }} className="truncate text-lg font-bold tracking-tight">{logoText}</span>
              )}
              {custom.showTagline && tagline ? <span className="hidden truncate text-[11px] font-medium text-slate-500 lg:block">{tagline}</span> : null}
            </a>
            <DesktopNav menu={menu} tokens={tokens} ink={ink} align={align} />
          </div>
          <div className="flex items-center gap-3">
            {showCta ? (
              <a
                href={ctaHref}
                style={{ backgroundColor: ink ? "transparent" : tokens.colors.primary, color: ink ? tokens.colors.foreground : tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius, border: ink ? "1px solid rgba(255,255,255,0.2)" : undefined }}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold"
              >
                {ctaLabel}
              </a>
            ) : null}
            <MobileNav menu={menu} label={menuLabel} />
          </div>
        </div>
        {header?.bottomBar.enabled && bottomLinks.length > 0 ? (
          <div className="border-t border-white/10">
            <div style={{ maxWidth: ink ? "100%" : tokens.geometry.containerMaxWidth }} className="mx-auto flex gap-4 overflow-x-auto px-4 py-2 text-xs sm:px-6">
              {bottomLinks.map((link) => (
                <a key={link.id} href={link.href} className="whitespace-nowrap text-zinc-400 hover:text-current">{link.label}</a>
              ))}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export function SiteFooter({ siteName, siteDna, locale, tokens, footer, fallbackText }: { siteName: string; siteDna?: string | null; locale: string; tokens: DesignTokens; footer: FooterConfig | undefined; fallbackText: string }) {
  const columns = footer?.columns ?? [];
  return (
    <footer style={{ borderColor: tokens.colors.border }} className="mt-16 border-t px-4 py-12 sm:px-6">
      <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <span className="text-base font-bold">{siteName}</span>
          <p className="max-w-md text-xs leading-relaxed opacity-80">{siteDna || fallbackText}</p>
          {footer?.showNewsletter ? (
            <form action={`/${locale}/kurumsal`} className="flex max-w-sm border border-current/15">
              <label className="sr-only" htmlFor="nx-footer-email">E-posta</label>
              <input id="nx-footer-email" name="email" type="email" required placeholder="E-posta" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs outline-none" />
              <button type="submit" className="px-3 text-xs">Kaydol</button>
            </form>
          ) : null}
        </div>
        {columns.map((col) => (
          <div key={col.id} className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider">{col.title}</div>
            <ul className="space-y-2 text-xs opacity-80">
              {col.links.map((lnk, i) => (
                <li key={`${col.id}-${i}`}><a href={lnk.href} className="hover:opacity-100">{lnk.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-6 text-xs opacity-70">
        <span>{footer?.copyrightText}</span>
        <div className="flex gap-3">
          {(footer?.bottomLinks ?? []).map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
