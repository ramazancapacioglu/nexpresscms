import React from "react";
import {
  DEFAULT_HEADER_ZONES,
  FOOTER_LAYOUT_PRESETS,
  expandFooterText,
  footerRowColors,
  resolveFooterStyle,
  isSafeMenuHref,
  resolveFooterWidgets,
  hasExplicitMobileZones,
  resolveHeaderZones,
  resolveMobileHeaderZones,
  type DesignTokens,
  type FooterConfig,
  type HeaderConfig,
  type HeaderWidgetId,
  type HeaderZones,
  type NavigationLink,
  type NavigationMenuItem,
  type SiteSettings,
} from "@nexpress/core";
import type { PublicWidgetFeed } from "@/lib/public-data";
import { RenderPublicWidget } from "./public-widgets";
import { DesktopNav, MobileNav } from "./site-nav";

interface HeaderProps {
  siteName: string;
  tagline?: string | null;
  locale: string;
  /** Dilin kök adresi; tek dilli sitede boş. */
  lb?: string;
  menu: NavigationMenuItem[];
  tokens: DesignTokens;
  ink: boolean;
  header: HeaderConfig | undefined;
  custom: SiteSettings["customizer"]["header"];
  menuLabel: string;
  menuAllLabel: string;
  searchLabel: string;
  /** "Sepet" öğesinin etiketi. */
  cartLabel?: string;
  /** "Sosyal bağlantılar" öğesi: SEO > Kuruluş > sameAs adreslerinden türetilir. */
  social?: Array<{ label: string; href: string }>;
  /** Yazılım firması teması: arama ikonu sayfa yerine canlı sonuç penceresi açar. */
  liveSearch?: boolean;
  /** Sayfa seçeneği "şeffaf header": şerit içeriğin üstüne biner, yazı rengi `light` (beyaz) veya `dark` (koyu). */
  overlay?: "light" | "dark";
}

/** Üst çubuk + ana şerit + menü (RSC). Geliştirme amaçlı rozet, tema bilgisi ve yönetim bağlantısı ziyaretçiye gösterilmez. */
export function SiteHeader({ siteName, tagline, locale, lb, menu, tokens, ink, header, custom, menuLabel, menuAllLabel, searchLabel, cartLabel = "Sepet", social = [], liveSearch, overlay }: HeaderProps) {
  const main = header?.mainBar;
  const top = header?.topBar;
  const bottom = header?.bottomBar;
  const bottomLinks = bottom?.links ?? [];
  const ctaLabel = (custom.ctaLabel || main?.ctaLabel || "").trim();
  const ctaHref = (custom.ctaHref || main?.ctaHref || "").trim();
  const showCta = custom.showCta !== false && ctaLabel !== "" && isSafeMenuHref(ctaHref) && !ctaHref.startsWith("/admin");
  const options = header?.options ?? {};
  const secondaryHref = (options.secondaryHref ?? "").trim();
  const secondaryLabel = (options.secondaryLabel ?? "").trim();
  const showSecondary = secondaryLabel !== "" && isSafeMenuHref(secondaryHref) && !secondaryHref.startsWith("/admin");
  const logoText = custom.logoText.trim() || siteName;
  const sticky = main?.sticky ?? custom.sticky;
  const glass = main?.glassmorphism ?? custom.glass;
  const align = custom.menuAlign;
  const topZones = resolveHeaderZones(top, DEFAULT_HEADER_ZONES.top);
  const mainZones = resolveHeaderZones(main, DEFAULT_HEADER_ZONES.main);
  const mobileZones = resolveMobileHeaderZones(main, mainZones);
  const bottomZones = resolveHeaderZones(bottom, DEFAULT_HEADER_ZONES.bottom);
  const topMobile = resolveMobileHeaderZones(top, topZones);
  const bottomMobile = resolveMobileHeaderZones(bottom, bottomZones);
  const widget = (id: HeaderWidgetId, viewport: "desktop" | "mobile") => {
    if (id === "announcement") return top?.announcementText ? <span className="font-medium">{top.announcementText}</span> : null;
    if (id === "contact") {
      const phone = top?.contactPhone?.trim();
      const email = top?.contactEmail?.trim();
      if (!phone && !email) return null;
      return (
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] opacity-90">
          {phone ? <a className="nx-header-phone" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a> : null}
          {email ? <a href={`mailto:${email}`}>{email}</a> : null}
        </span>
      );
    }
    if (id === "logo") {
      const home = (lb ?? `/${locale}`) || "/";
      const lockup = logoText.split(" - ");
      const branded = !custom.logoImage && lockup.length > 1;
      return (
        <a href={home} className="nx-logo flex min-w-0 items-center gap-2.5 no-underline">
          {custom.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={custom.logoImage} alt={logoText} className="h-8 w-auto" />
          ) : /^[A-ZÇĞİÖŞÜ]{3,}SOFT$/.test(logoText) ? (
            <span className="truncate text-[18px] font-extrabold tracking-tight"><span style={{ color: "#084f9e" }}>{logoText.slice(0, -4)}</span><span style={{ color: "#00ac48" }}>SOFT</span></span>
          ) : branded ? (
            <span className="nx-logo-lockup truncate text-[17px] font-bold leading-tight">
              <span className="nx-logo-brand underline">{lockup[0]}</span>
              <span className="nx-logo-suffix font-semibold no-underline">{" - "}{lockup.slice(1).join(" - ")}</span>
            </span>
          ) : (
            <span style={{ fontFamily: tokens.typography.headingFont, color: ink ? tokens.colors.foreground : undefined }} className="truncate text-lg font-bold tracking-tight">{logoText}</span>
          )}
          {custom.showTagline && tagline ? <span className="hidden truncate text-[11px] font-medium text-nx-muted lg:block">{tagline}</span> : null}
        </a>
      );
    }
    if (id === "menu") {
      return viewport === "mobile"
        ? <MobileNav menu={menu} extra={bottomLinks} label={menuLabel} allLabel={menuAllLabel} />
        : <DesktopNav menu={menu} tokens={tokens} ink={ink} align={align} />;
    }
    if (id === "search") {
      if (liveSearch) {
        return (
          <button type="button" popoverTarget="nx-yf-search" className="nx-header-search whitespace-nowrap text-sm font-medium opacity-80 hover:opacity-100" aria-label={searchLabel}>
            {searchLabel}
          </button>
        );
      }
      return (
        <a href={`${lb ?? `/${locale}`}/ara`} className="nx-header-search whitespace-nowrap text-sm font-medium opacity-80 hover:opacity-100">
          {searchLabel}
        </a>
      );
    }
    if (id === "cta" && showCta) {
      const variant = ink ? "outline" : options.ctaStyle ?? "solid";
      const filled = variant === "solid";
      return (
        <a
          href={ctaHref}
          style={{
            backgroundColor: filled ? tokens.colors.primary : "transparent",
            color: filled ? tokens.colors.primaryForeground : ink ? tokens.colors.foreground : tokens.colors.primary,
            borderRadius: tokens.geometry.borderRadius,
            border: variant === "ghost" ? "1px solid transparent" : filled ? "1px solid transparent" : ink ? "1px solid rgba(255,255,255,0.25)" : `1px solid ${tokens.colors.primary}`,
          }}
          className="nx-header-cta inline-flex items-center whitespace-nowrap px-4 py-2 text-sm font-semibold"
        >
          {ctaLabel}
        </a>
      );
    }
    if (id === "button2" && showSecondary) {
      return (
        <a
          href={secondaryHref}
          style={{ color: ink ? tokens.colors.foreground : tokens.colors.primary, borderRadius: tokens.geometry.borderRadius, border: `1px solid ${ink ? "rgba(255,255,255,0.25)" : tokens.colors.primary}` }}
          className="nx-header-button2 inline-flex items-center whitespace-nowrap px-4 py-2 text-sm font-semibold"
        >
          {secondaryLabel}
        </a>
      );
    }
    if (id === "phone") {
      const phone = top?.contactPhone?.trim();
      return phone ? <a className="nx-header-phone whitespace-nowrap text-sm font-medium" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a> : null;
    }
    if (id === "email") {
      const email = top?.contactEmail?.trim();
      return email ? <a className="nx-header-email whitespace-nowrap text-sm font-medium" href={`mailto:${email}`}>{email}</a> : null;
    }
    if (id === "social") {
      return social.length > 0 ? (
        <span className="nx-header-social flex items-center gap-3 text-sm font-medium">
          {social.map((item) => (
            <a key={item.href} href={item.href} rel="noopener noreferrer me" target="_blank" className="opacity-80 hover:opacity-100">{item.label}</a>
          ))}
        </span>
      ) : null;
    }
    if (id === "cart") {
      return <a href={`${lb ?? `/${locale}`}/magaza/sepet`} className="nx-header-cart whitespace-nowrap text-sm font-medium opacity-80 hover:opacity-100">{cartLabel}</a>;
    }
    if (id === "html") {
      const text = (options.htmlText ?? "").trim();
      return text ? <span className="nx-header-text text-sm">{text}</span> : null;
    }
    if (id === "divider") {
      return <span aria-hidden="true" className="nx-header-divider h-5 w-px bg-current opacity-20" />;
    }
    if (id === "links" && bottomLinks.length > 0) {
      return (
        <span className="nx-utility-links flex flex-wrap items-center gap-x-5 gap-y-1">
          {bottomLinks.map((link) => (
            <span key={link.id} className="group relative">
              <a href={link.href} className="nx-utility-link whitespace-nowrap text-sm">{link.label}</a>
              {link.children?.length ? (
                <span className="invisible absolute left-0 top-full z-50 min-w-52 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <span className="block rounded-lg border border-black/10 bg-white p-2 text-sm shadow-lg">
                    {link.children.map((child) => (
                      <a key={child.id} href={child.href} className="block rounded px-2 py-1.5 hover:bg-black/5">{child.label}</a>
                    ))}
                  </span>
                </span>
              ) : null}
            </span>
          ))}
        </span>
      );
    }
    return null;
  };

  const row = (zones: HeaderZones, className: string, viewport: "desktop" | "mobile", collapseEmpty = false) => {
    const sides = (["left", "center", "right"] as const).filter((side) => !collapseEmpty || zones[side].length > 0);
    return (
      <div className={className}>
        {sides.map((side) => (
          <div key={side} className={`flex min-w-0 items-center gap-3 ${side === "center" ? "justify-center" : side === "right" ? "justify-end" : ""}`}>
            {zones[side].map((id) => {
              const node = widget(id, viewport);
              return node ? <React.Fragment key={id}>{node}</React.Fragment> : null;
            })}
          </div>
        ))}
      </div>
    );
  };
  /** Şeritte gerçekten çizilecek bir öğe var mı (boş duyuru/telefon şeridi görünmez). */
  const hasContent = (zones: HeaderZones) =>
    [...zones.left, ...zones.center, ...zones.right].some((id) => {
      if (id === "announcement") return Boolean(top?.announcementText);
      if (id === "contact") return Boolean(top?.contactPhone || top?.contactEmail);
      if (id === "phone") return Boolean(top?.contactPhone);
      if (id === "email") return Boolean(top?.contactEmail);
      if (id === "links") return bottomLinks.length > 0;
      if (id === "social") return social.length > 0;
      if (id === "html") return Boolean((options.htmlText ?? "").trim());
      if (id === "button2") return showSecondary;
      if (id === "cta") return showCta;
      return true;
    });
  const topVisible = Boolean(top?.enabled && hasContent(topZones));
  const bottomVisible = Boolean(bottom?.enabled && hasContent(bottomZones));
  const shell = ink ? "100%" : tokens.geometry.containerMaxWidth;

  const shellSticky = sticky !== false && !ink;
  const searchAction = `${lb ?? `/${locale}`}/ara`;
  return (
    <div className={overlay ? "nx-header-shell absolute inset-x-0 top-0 z-40" : shellSticky ? "nx-header-shell sticky top-0 z-40" : "nx-header-shell"}>
      {liveSearch ? (
        <div id="nx-yf-search" popover="auto" className="nx-yf-search">
          <form action={searchAction} method="get" role="search" className="nx-yf-search-panel">
            <input name="q" type="search" placeholder={searchLabel} autoComplete="off" aria-label={searchLabel} enterKeyHint="search" />
            <div id="nx-yf-search-results" />
          </form>
        </div>
      ) : null}
      {topVisible ? (
        <div style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground }} className="nx-header-top border-b border-white/10 px-4 py-2 text-xs">
          <div style={{ maxWidth: shell }} className="mx-auto">
            {hasExplicitMobileZones(top) ? (
              <>
                {row(topZones, "hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3", "desktop")}
                {row(topMobile, "grid grid-cols-1 items-start gap-1 md:hidden", "mobile", true)}
              </>
            ) : (
              row(topZones, "grid grid-cols-1 items-start gap-1 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3", "desktop")
            )}
          </div>
        </div>
      ) : null}

      <header
        data-nx-overlay={overlay}
        style={
          overlay
            ? { borderColor: "transparent", backgroundColor: "transparent", color: overlay === "dark" ? "#0b0d12" : "#ffffff" }
            : { borderColor: tokens.colors.border, backgroundColor: ink || glass === false ? tokens.colors.background : `color-mix(in srgb, ${tokens.colors.background} 92%, transparent)` }
        }
        className={
          ink
            ? "nx-public-header sticky top-0 z-40 border-b"
            : `nx-public-header relative z-40 border-b ${glass === false || overlay ? "" : "backdrop-blur-md"}`
        }
      >
        <div style={{ maxWidth: shell, minHeight: custom.height || 64 }} className="relative mx-auto flex items-center px-4 sm:px-6">
          {row(mainZones, "hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-4 md:grid", "desktop")}
          {row(mobileZones, "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 md:hidden", "mobile")}
        </div>
        {bottomVisible ? (
          hasExplicitMobileZones(bottom) ? (
            <>
              <div className="hidden border-t border-white/10 text-xs md:block">
                <div style={{ maxWidth: shell }} className="mx-auto px-4 py-2 sm:px-6">
                  {row(bottomZones, "grid grid-cols-[1fr_auto_1fr] items-center gap-3", "desktop")}
                </div>
              </div>
              {hasContent(bottomMobile) ? (
                <div className="border-t border-white/10 text-xs md:hidden">
                  <div style={{ maxWidth: shell }} className="mx-auto px-4 py-2">
                    {row(bottomMobile, "grid grid-cols-[1fr_auto_1fr] items-center gap-3", "mobile")}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="border-t border-white/10 text-xs">
              <div style={{ maxWidth: shell }} className="mx-auto px-4 py-2 sm:px-6">
                {row(bottomZones, "grid grid-cols-[1fr_auto_1fr] items-center gap-3", "desktop")}
              </div>
            </div>
          )
        ) : null}
      </header>
    </div>
  );
}

export function SiteFooter({
  siteName,
  siteDna,
  locale,
  lb,
  tokens,
  footer,
  fallbackText,
  backToTopLabel,
  widgetFeed,
  menuLibrary,
}: {
  siteName: string;
  siteDna?: string | null;
  locale: string;
  lb?: string;
  tokens: DesignTokens;
  footer: FooterConfig | undefined;
  fallbackText: string;
  backToTopLabel: string;
  widgetFeed?: PublicWidgetFeed;
  menuLibrary?: Record<string, NavigationLink[]>;
}) {
  const layout =
    FOOTER_LAYOUT_PRESETS.find((p) => p.id === (footer?.layoutPreset ?? "brand-wide-4")) ??
    FOOTER_LAYOUT_PRESETS[0]!;
  const allWidgets = resolveFooterWidgets(footer, siteName, siteDna || fallbackText);
  const style = resolveFooterStyle(footer?.options);
  const mainColors = footerRowColors(style.main, tokens.colors);
  const bottomColors = footerRowColors(style.bottom, tokens.colors);
  // Alt çubuk menüsü: yalnızca güvenli adresler, ilk düzey, en çok 6 öğe
  const bottomMenu = (style.bottom.menuId ? (menuLibrary?.[style.bottom.menuId] ?? []) : []).filter((l) => isSafeMenuHref(l.href)).slice(0, 6);
  const copyright = expandFooterText(footer?.copyrightText, siteName, new Date().getFullYear());
  const maxWidth = tokens.geometry.containerMaxWidth;
  const rowBox = (r: typeof style.main, c: ReturnType<typeof footerRowColors>) => ({
    outer: { borderColor: tokens.colors.border } as const,
    // `contained`: zemin kapsayıcı genişliğinde ve köşeleri yuvarlak; `full`: ekranın tamamı
    inner: {
      maxWidth: r.full ? undefined : maxWidth,
      backgroundColor: c.background ?? undefined,
      color: c.color ?? undefined,
      borderRadius: r.full || !c.background ? undefined : tokens.geometry.borderRadius,
      paddingTop: r.paddingY,
      paddingBottom: r.paddingY,
    },
  });
  const main = rowBox(style.main, mainColors);
  const bottom = rowBox(style.bottom, bottomColors);

  return (
    <footer className="nx-footer mt-16">
      {footer?.topBanner?.enabled ? (
        <div className="px-4 sm:px-6">
          <div
            style={{
              maxWidth,
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.primaryForeground,
              borderRadius: tokens.geometry.borderRadius,
            }}
            className="mx-auto mb-10 flex flex-wrap items-center justify-between gap-4 px-6 py-5"
          >
            <div className="space-y-1">
              {footer.topBanner.badge ? (
                <span className="inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {footer.topBanner.badge}
                </span>
              ) : null}
              <div className="text-base font-bold">{footer.topBanner.title}</div>
              {footer.topBanner.subtitle ? (
                <p className="text-xs opacity-90">{footer.topBanner.subtitle}</p>
              ) : null}
            </div>
            {footer.topBanner.ctaLabel && isSafeMenuHref(footer.topBanner.ctaHref) ? (
              <a
                href={footer.topBanner.ctaHref}
                className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-900"
              >
                {footer.topBanner.ctaLabel} →
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        data-footer-row="main"
        style={{ ...main.outer, backgroundColor: style.main.full ? (mainColors.background ?? undefined) : undefined, color: style.main.full ? (mainColors.color ?? undefined) : undefined }}
        className={`${style.main.divider ? "border-t" : ""} px-4 sm:px-6`}
      >
        <div
          style={{ ...main.inner, ...(style.main.full ? { backgroundColor: undefined, color: undefined } : {}) }}
          className={`mx-auto ${style.main.full || !mainColors.background ? "" : "px-6"}`}
        >
          <div
            style={{ maxWidth: style.main.full ? maxWidth : undefined, columnGap: style.gapPx, rowGap: style.gapPx }}
            className="mx-auto grid grid-cols-1 md:grid-cols-12"
          >
            {layout.colSpans.map((span, colIdx) => {
              const colWidgets = allWidgets.filter(
                (w) =>
                  w.enabled &&
                  Math.min(layout.columnCount - 1, w.columnIndex ?? 0) === colIdx
              );
              return (
                <div
                  key={colIdx}
                  style={{ gridColumn: `span ${span} / span ${span}` }}
                  className="space-y-5"
                >
                  {colWidgets.map((w) => (
                    <RenderPublicWidget
                      key={w.id}
                      widget={w}
                      locale={locale}
                      lb={lb}
                      tokens={tokens}
                      feed={widgetFeed}
                      cardStyle="footer"
                      menuLibrary={menuLibrary}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        data-footer-row="bottom"
        style={{ ...bottom.outer, backgroundColor: style.bottom.full ? (bottomColors.background ?? undefined) : undefined, color: style.bottom.full ? (bottomColors.color ?? undefined) : undefined }}
        className={`${style.bottom.divider ? "border-t" : ""} px-4 sm:px-6`}
      >
        <div
          style={{ ...bottom.inner, ...(style.bottom.full ? { backgroundColor: undefined, color: undefined } : {}) }}
          className={`mx-auto ${style.bottom.full || !bottomColors.background ? "" : "px-6"}`}
        >
          <div
            style={{ maxWidth: style.bottom.full ? maxWidth : undefined }}
            className={`mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${style.bottom.centered ? "justify-center text-center" : "justify-between"}`}
          >
            <span className="opacity-80">{copyright}</span>
            <div className={`flex flex-wrap gap-x-4 gap-y-1 ${style.bottom.centered ? "justify-center" : ""}`}>
              {(footer?.bottomLinks ?? []).map((link) => (
                <a key={`${link.href}|${link.label}`} href={link.href} className="underline-offset-2 hover:underline">
                  {link.label}
                </a>
              ))}
              {bottomMenu.map((link) => (
                <a key={link.id} href={link.href} {...(link.target === "_blank" ? { target: "_blank", rel: "noopener" } : {})} className="underline-offset-2 hover:underline">
                  {link.label}
                </a>
              ))}
              {style.bottom.socials.map((s) => (
                <a key={s.id} href={s.href} rel="noopener me" aria-label={s.label} className="underline-offset-2 hover:underline">
                  {s.label}
                </a>
              ))}
              {style.bottom.backToTop ? (
                <a href="#" className="underline-offset-2 hover:underline">
                  {backToTopLabel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
