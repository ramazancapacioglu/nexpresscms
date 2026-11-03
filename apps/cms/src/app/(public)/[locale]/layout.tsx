import React from "react";
import type { Metadata } from "next";
import { createTranslator } from "@nexpress/i18n";
import { getActiveSkin, getPreviewTheme } from "@/lib/public-theme";
import { redirectOrNotFound } from "@/lib/redirect-runtime";
import { runScheduler } from "@/lib/scheduler";
import { after } from "next/server";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { PublicSidebarWidgetArea } from "@/components/public/public-widgets";
import { templateFor } from "@/lib/templates";
import { buildTemplateContext } from "@/lib/template-context";
import { getResolvedMenu } from "@/lib/menu-data";
import { getPublicNavigation, getPublicSite, getPublicWidgetFeed } from "@/lib/public-data";
import {
  compileDesignTokensToCssVars,
  getThemeManifest,
  INK_GRID_CSS,
  INK_GRID_ID,
} from "@nexpress/themes";
import { PluginSlot, resolveSiteSettings, toCssVarTokens } from "@nexpress/core";
import { RscBlockRenderer } from "@nexpress/themes";

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
  // Zamanlanmış yayın tetikleyicisi: yanıttan sonra, dakikada en çok bir kez (bkz. lib/scheduler.ts)
  after(() => runScheduler(siteId).then(() => undefined));

  const [site, nav, widgetFeed] = await Promise.all([
    getPublicSite(siteId),
    getPublicNavigation(siteId, locale),
    getPublicWidgetFeed(siteId, locale),
  ]);

  // Tanımsız dil kökü ana sayfayı kopyalamasın: yalnızca site dilleri 200 döner.
  // Tek segmentli bilinmeyen yollar (`/eski-adres`) buraya düşer: yönlendirme kuralı varsa uygula, yoksa 404 izleyiciye yaz
  if (site && !site.supportedLocales.includes(locale)) return redirectOrNotFound(siteId, `/${locale}`);

  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const isInk = activeTheme.id === INK_GRID_ID;
  const savedBg = site?.designTokens?.colors.background?.toLowerCase() ?? "";
  const savedIsLight = savedBg === "" || savedBg.startsWith("#fff") || savedBg === "#fcfcfd";
  const tokens =
    isInk && savedIsLight ? activeTheme.tokens : (site?.designTokens ?? activeTheme.tokens);
  const preview = await getPreviewTheme(siteId);
  const skin = preview ? { themeId: preview.themeId, css: preview.css } : await getActiveSkin(siteId);
  const cssVars = compileDesignTokensToCssVars(preview?.tokens ?? tokens, resolveSiteSettings(site?.settings).customizer);
  // Düzen bileşenleri renkleri CSS değişkeninden okur (palet/karanlık mod değişince bileşen kodu aynı kalır)
  const vt = toCssVarTokens(preview?.tokens ?? tokens);
  const menu = await getResolvedMenu(siteId, locale);
  // Tema oluşturucu şablonları: varsayılan header/footer/kenar çubuğu şablonu varsa yerleşik olanın yerine geçer
  // Koşullar yalnızca dil ve sayfa adresiyle eşleşebilir (içerik türü/kategori bilgisi bu katmanda yoktur)
  const segs = (reqHeaders.get("x-nexpress-pathname") ?? "").split("/").filter(Boolean);
  const chromeCtx = { locale, slug: segs.length >= 2 ? decodeURIComponent(segs[1]!) : "ana-sayfa" };
  const [headerTpl, footerTpl, sidebarTpl] = await Promise.all([templateFor(siteId, "header", null, chromeCtx), templateFor(siteId, "footer", null, chromeCtx), templateFor(siteId, "sidebar", null, chromeCtx)]);
  const resolvedCustomizer = resolveSiteSettings(site?.settings).customizer;
  const cust = resolvedCustomizer.header;
  const headerBehavior = headerTpl?.meta.behavior ?? {};
  const tplCtx = headerTpl || footerTpl || sidebarTpl ? buildTemplateContext({ site: site ? { name: site.name, tagline: site.tagline, logoText: cust.logoText, logoImage: cust.logoImage } : null, locale, copyright: nav?.footerConfig.copyrightText, menu, tokens, menuLabel: t("site.menu") }) : null;
  const sidebar = nav?.sidebarConfig?.enabled ? nav.sidebarConfig : null;
  const effectiveSidebarPos: "none" | "left" | "right" =
    resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
      ? resolvedCustomizer.layout.sidebarPosition
      : sidebar
        ? sidebar.position
        : sidebarTpl
          ? "right"
          : "none";
  const hasSidebar = effectiveSidebarPos !== "none" && Boolean(sidebarTpl || sidebar);
  const sidebarWidth = resolvedCustomizer.layout.sidebarWidth || "288px";

  return (
    <div
      data-nx-skin={skin?.themeId ?? (isInk ? "ink" : undefined)}
      style={{
        backgroundColor: vt.colors.background,
        color: vt.colors.foreground,
        fontFamily: (preview?.tokens ?? tokens).typography.bodyFont,
      }}
      className="relative min-h-screen flex flex-col"
    >
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {skin?.css ? <style dangerouslySetInnerHTML={{ __html: skin.css }} /> : null}
      {preview ? (
        <div role="status" className="bg-amber-100 px-3 py-1 text-center text-xs font-medium text-amber-900">
          {t("site.themePreview", { id: preview.themeId })}
        </div>
      ) : null}
      {isInk ? <style dangerouslySetInnerHTML={{ __html: INK_GRID_CSS }} /> : null}
      <PluginSlot name="public.head.meta" siteId={siteId} />

      {headerTpl && tplCtx ? (
        <header
          style={
            headerBehavior.transparent
              ? { borderColor: "transparent", backgroundColor: "transparent", color: headerBehavior.tone === "dark" ? "#0b0d12" : "#ffffff" }
              : { borderColor: vt.colors.border, backgroundColor: headerBehavior.glass === false ? vt.colors.background : `color-mix(in srgb, ${vt.colors.background} 94%, transparent)` }
          }
          className={`nx-public-header z-40 border-b ${headerBehavior.transparent ? "absolute inset-x-0 top-0" : headerBehavior.sticky === false ? "relative" : "sticky top-0"} ${headerBehavior.glass === false || headerBehavior.transparent ? "" : "backdrop-blur-md"}`}
        >
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto px-4 py-3 sm:px-6">
            <RscBlockRenderer blocks={headerTpl.blocks} themeId={activeTheme.id} tokens={vt} locale={locale} tpl={tplCtx} />
          </div>
        </header>
      ) : (
      <SiteHeader
        siteName={site?.name ?? "NexPress CMS"}
        tagline={site?.tagline}
        locale={locale}
        menu={menu}
        tokens={vt}
        ink={isInk}
        header={nav?.headerConfig}
        custom={resolveSiteSettings(site?.settings).customizer.header}
        menuLabel={t("site.menu")}
      />
      )}

      <div
        style={hasSidebar ? { maxWidth: tokens.geometry.containerMaxWidth } : undefined}
        className={hasSidebar ? "mx-auto flex w-full flex-1 gap-6" : "contents"}
      >
        {hasSidebar && effectiveSidebarPos === "left" ? (
          sidebarTpl && tplCtx ? (
            <aside aria-label="Kenar çubuğu" style={{ width: sidebarWidth }} className="hidden shrink-0 px-4 py-10 md:block">
              <RscBlockRenderer blocks={sidebarTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
            </aside>
          ) : sidebar ? (
            <PublicSidebarWidgetArea sidebar={sidebar} locale={locale} tokens={vt} feed={widgetFeed} width={sidebarWidth} />
          ) : null
        ) : null}
        <main
          style={{
            maxWidth:
              isInk || hasSidebar || resolvedCustomizer.layout.contentLayout === "fullwidth"
                ? "100%"
                : tokens.geometry.containerMaxWidth,
            ...(headerBehavior.transparent ? { paddingTop: 0 } : {}),
          }}
          className={isInk ? "mx-auto w-full flex-1" : "mx-auto min-w-0 w-full flex-1 px-4 py-10 sm:px-6"}
        >
          {children}
        </main>
        {hasSidebar && effectiveSidebarPos === "right" ? (
          sidebarTpl && tplCtx ? (
            <aside aria-label="Kenar çubuğu" style={{ width: sidebarWidth }} className="hidden shrink-0 px-4 py-10 md:block">
              <RscBlockRenderer blocks={sidebarTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
            </aside>
          ) : sidebar ? (
            <PublicSidebarWidgetArea sidebar={sidebar} locale={locale} tokens={vt} feed={widgetFeed} width={sidebarWidth} />
          ) : null
        ) : null}
      </div>

      {footerTpl && tplCtx ? (
        <footer style={{ borderColor: vt.colors.border }} className="mt-16 border-t px-4 py-12 sm:px-6">
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto">
            <RscBlockRenderer blocks={footerTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
          </div>
        </footer>
      ) : (
        <SiteFooter siteName={site?.name ?? "NexPress CMS"} siteDna={site?.siteDna} locale={locale} tokens={vt} footer={nav?.footerConfig} fallbackText={t("site.footerDefault")} widgetFeed={widgetFeed} />
      )}
    </div>
  );
}


