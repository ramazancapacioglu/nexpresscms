import React from "react";
import type { Metadata } from "next";
import { createTranslator } from "@nexpress/i18n";
import { headers } from "next/headers";
import { Link } from "@/components/public/link";
import { notFound } from "next/navigation";
import { getPublicNavigation, getPublicSite } from "@/lib/public-data";
import {
  compileDesignTokensToCssVars,
  getThemeManifest,
  INK_GRID_CSS,
  INK_GRID_ID,
} from "@nexpress/themes";
import { PluginSlot, type NavigationLink } from "@nexpress/core";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  return {
    alternates: {
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: `${site?.name ?? "NexPress"} — RSS` }],
        "application/atom+xml": [{ url: "/atom.xml", title: `${site?.name ?? "NexPress"} — Atom` }],
      },
    },
  };
}

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";

  const [site, nav] = await Promise.all([getPublicSite(siteId), getPublicNavigation(siteId, locale)]);

  // Tanımsız dil kökü ana sayfayı kopyalamasın: yalnızca site dilleri 200 döner.
  if (site && !site.supportedLocales.includes(locale)) notFound();

  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const isInk = activeTheme.id === INK_GRID_ID;
  const savedBg = site?.designTokens?.colors.background?.toLowerCase() ?? "";
  const savedIsLight = savedBg === "" || savedBg.startsWith("#fff") || savedBg === "#fcfcfd";
  const tokens =
    isInk && savedIsLight ? activeTheme.tokens : (site?.designTokens ?? activeTheme.tokens);
  const cssVars = compileDesignTokensToCssVars(tokens, site?.settings?.customizer);
  const menuItems = nav?.menuItems ?? [];
  const footerColumns = nav?.footerConfig.columns ?? [];
  const copyright = nav?.footerConfig.copyrightText;
  const showNewsletter = nav?.footerConfig.showNewsletter === true;
  const sidebar = nav?.sidebarConfig?.enabled ? nav.sidebarConfig : null;
  const bottomLinks = nav?.headerConfig.bottomBar.links ?? [];

  return (
    <div
      data-nx-skin={isInk ? "ink" : undefined}
      style={{
        backgroundColor: tokens.colors.background,
        color: tokens.colors.foreground,
        fontFamily: tokens.typography.bodyFont,
      }}
      className="min-h-screen flex flex-col"
    >
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {isInk ? <style dangerouslySetInnerHTML={{ __html: INK_GRID_CSS }} /> : null}
      <PluginSlot name="public.head.meta" siteId={siteId} />

      {/* 1. KATMAN: TOP BAR (3 Katmanlı Görsel Header Mimarisi) */}
      {nav?.headerConfig.topBar.enabled && (
        <div
          style={{
            backgroundColor: tokens.colors.secondary,
            color: tokens.colors.secondaryForeground,
          }}
          className="text-xs py-2 px-4 border-b border-white/10"
        >
          <div
            style={{ maxWidth: tokens.geometry.containerMaxWidth }}
            className="mx-auto flex flex-wrap items-center justify-between gap-2"
          >
            <span className="font-medium">
              {nav.headerConfig.topBar.announcementText}
            </span>
            <div className="flex items-center gap-4 text-[11px] opacity-90">
              {nav.headerConfig.topBar.contactPhone && (
                <span>📞 {nav.headerConfig.topBar.contactPhone}</span>
              )}
              <span>🌍 {t("site.language")}: {locale.toUpperCase()}</span>
              <Link
                href="/llms.txt"
                className="underline hover:opacity-100 font-mono"
              >
                /llms.txt
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. KATMAN: MAIN BAR + GÖRSEL MEGA-MENÜ (0-KB RSC CSS Hover) */}
      <header
        style={{
          borderColor: tokens.colors.border,
          backgroundColor: isInk ? tokens.colors.background : undefined,
        }}
        className={
          isInk
            ? "nx-public-header sticky top-0 z-40 border-b"
            : `nx-public-header z-40 border-b ${nav?.headerConfig.mainBar.sticky === false ? "relative" : "sticky top-0"} ${nav?.headerConfig.mainBar.glassmorphism === false ? "bg-white" : "bg-white/90 backdrop-blur-md"}`
        }
      >
        <div
          style={{ maxWidth: isInk ? "100%" : tokens.geometry.containerMaxWidth }}
          className={
            isInk
              ? "mx-auto grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6"
              : "mx-auto flex h-16 items-center justify-between px-4 sm:px-6"
          }
        >
          <div className={isInk ? "contents" : "flex items-center gap-8"}>
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <span
                style={{
                  backgroundColor: isInk ? "transparent" : tokens.colors.primary,
                  color: isInk ? tokens.colors.foreground : "#ffffff",
                  borderColor: isInk ? "rgba(255,255,255,0.2)" : "transparent",
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-black text-white"
              >
                NX
              </span>
              <div>
                <span
                  style={{
                    fontFamily: tokens.typography.headingFont,
                    color: isInk ? tokens.colors.foreground : undefined,
                  }}
                  className="text-base font-bold tracking-tight text-slate-900 block leading-none"
                >
                  {isInk ? "NexPress" : (site?.name ?? "NexPress CMS")}
                </span>
                {isInk ? null : (
                  <span className="text-[10px] font-medium text-slate-500">
                    Tema: {activeTheme.name}
                  </span>
                )}
              </div>
            </Link>

            <nav className={isInk ? "hidden md:flex items-center gap-6 justify-self-center" : "hidden md:flex items-center gap-6"}>
              {menuItems.map((item) => (
                <div key={item.id} className="relative group py-4">
                  <Link
                    href={item.href}
                    className={
                      isInk
                        ? "text-sm font-medium text-zinc-300 hover:text-white flex items-center gap-1"
                        : "text-sm font-medium text-slate-700 hover:text-slate-950 flex items-center gap-1"
                    }
                  >
                    <span>{item.label}</span>
                    {(item.children?.length || item.megaMenu?.enabled) && (
                      <span className="text-[10px] text-slate-400">▼</span>
                    )}
                  </Link>
                  {item.children && item.children.length > 0 ? (
                    <div className="invisible absolute left-0 top-full z-50 w-56 border bg-white p-2 opacity-0 shadow-lg group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {/* 0-KB RSC Görsel Mega-Menü */}
                  {item.megaMenu?.enabled && (
                    <div
                      style={{
                        borderRadius: tokens.geometry.borderRadius,
                        borderColor: tokens.colors.border,
                      }}
                      className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full w-[680px] border bg-white p-5 shadow-xl z-50"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {item.megaMenu.items.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            className="rounded-lg p-3 hover:bg-slate-50 transition block space-y-1 border border-transparent hover:border-slate-200"
                          >
                            {sub.badge && (
                              <span
                                style={{
                                  backgroundColor: tokens.colors.muted,
                                  color: tokens.colors.primary,
                                }}
                                className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                              >
                                {sub.badge}
                              </span>
                            )}
                            <div className="text-sm font-semibold text-slate-900">
                              {sub.label}
                            </div>
                            {sub.description && (
                              <p className="text-xs text-slate-500 leading-snug">
                                {sub.description}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                      {item.megaMenu.promoBanner && (
                        <div
                          style={{
                            backgroundColor: tokens.colors.muted,
                            borderRadius: tokens.geometry.borderRadius,
                          }}
                          className="mt-4 flex items-center justify-between p-3.5"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              🎁 {item.megaMenu.promoBanner.title}
                            </div>
                            <div className="text-xs text-slate-600">
                              {item.megaMenu.promoBanner.subtitle}
                            </div>
                          </div>
                          <Link
                            href={item.megaMenu.promoBanner.ctaHref}
                            style={{
                              backgroundColor: tokens.colors.primary,
                              color: tokens.colors.primaryForeground,
                            }}
                            className="rounded-md px-3 py-1.5 text-xs font-semibold shrink-0"
                          >
                            {item.megaMenu.promoBanner.ctaText}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className={`flex items-center gap-3 ${isInk ? "justify-self-end" : ""}`}>
            {isInk ? null : (
            <Link
              href="/admin/themes"
              className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              🎨 {t("site.themeSwitch")}
            </Link>
            )}
            <Link
              href={nav?.headerConfig.mainBar.ctaHref ?? "/admin"}
              style={{
                backgroundColor: isInk ? "transparent" : tokens.colors.primary,
                color: isInk ? tokens.colors.foreground : tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
                border: isInk ? "1px solid rgba(255,255,255,0.2)" : undefined,
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold"
            >
              {nav?.headerConfig.mainBar.ctaLabel ?? t("site.adminCta")}
            </Link>
          </div>
        </div>
        {nav?.headerConfig.bottomBar.enabled && bottomLinks.length > 0 ? (
          <div className="border-t border-white/10">
            <div
              style={{ maxWidth: isInk ? "100%" : tokens.geometry.containerMaxWidth }}
              className="mx-auto flex gap-4 overflow-x-auto px-4 py-2 text-xs sm:px-6"
            >
              {bottomLinks.map((link) => (
                <Link key={link.id} href={link.href} className="whitespace-nowrap text-zinc-400 hover:text-current">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div className={sidebar ? "mx-auto flex w-full flex-1" : "contents"}>
        {sidebar?.position === "left" ? (
          <PublicSideColumn title={sidebar.title} links={sidebar.links} />
        ) : null}
        <main
          style={{ maxWidth: isInk || sidebar ? "100%" : tokens.geometry.containerMaxWidth }}
          className={isInk ? "mx-auto w-full flex-1" : "mx-auto w-full flex-1 px-4 py-10 sm:px-6"}
        >
          {children}
        </main>
        {sidebar?.position === "right" ? (
          <PublicSideColumn title={sidebar.title} links={sidebar.links} />
        ) : null}
      </div>

      <footer
        style={{ borderColor: tokens.colors.border }}
        className="mt-16 border-t px-4 py-12 sm:px-6"
      >
        <div
          style={{ maxWidth: tokens.geometry.containerMaxWidth }}
          className="mx-auto grid grid-cols-1 gap-8 md:grid-cols-4"
        >
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: tokens.colors.primary }}
                className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
              >
                NX
              </span>
              <span className="font-bold">{site?.name ?? "NexPress CMS"}</span>
            </div>
            <p className="max-w-md text-xs leading-relaxed opacity-80">
              {site?.siteDna ??
                t("site.footerDefault")}
            </p>
            {showNewsletter ? (
              <form action={`/${locale}/kurumsal`} className="flex max-w-sm border border-current/15">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="E-posta"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs outline-none"
                />
                <button type="submit" className="px-3 text-xs">
                  Kaydol
                </button>
              </form>
            ) : null}
          </div>
          {footerColumns.map((col) => (
            <div key={col.id} className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider">{col.title}</div>
              <ul className="space-y-2 text-xs opacity-80">
                {col.links.map((lnk, i) => (
                  <li key={`${col.id}-${i}`}>
                    <Link href={lnk.href} className="hover:opacity-100">
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{ maxWidth: tokens.geometry.containerMaxWidth }}
          className="mx-auto mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-6 text-xs opacity-70"
        >
          <span>{copyright}</span>
          <div className="flex gap-3">
            {(nav?.footerConfig.bottomLinks ?? []).map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function PublicSideColumn({ title, links }: { title: string; links: NavigationLink[] }) {
  return (
    <aside className="hidden w-56 shrink-0 px-4 py-10 md:block">
      <div className="text-xs font-semibold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.id}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}


