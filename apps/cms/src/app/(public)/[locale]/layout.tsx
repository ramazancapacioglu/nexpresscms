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
import { getResolvedMenu, getResolvedMenuLibrary } from "@/lib/menu-data";
import { getPublicNavigation, getPublicSite, getPublicWidgetFeed, resolvePublicContent } from "@/lib/public-data";
import {
  compileDesignTokensToCssVars,
  getThemeManifest,
  YF_CSS,
  YF_THEME_ID,
  INK_GRID_CSS,
  INK_GRID_ID,
} from "@nexpress/themes";
import { YazilimFirmasiReach } from "@/components/public/yazilim-firmasi-reach";
import { PluginSlot, resolveActiveSidebarArea, resolveSiteSettings, toCssVarTokens } from "@nexpress/core";
import { getSession } from "@/lib/auth/session";
import { MaintenanceView } from "@/components/public/maintenance";
import { BackToTop } from "@/components/public/back-to-top";
import { RscBlockRenderer } from "@nexpress/themes";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const closed = resolveSiteSettings(site?.settings).general.maintenanceEnabled;
  return {
    robots: closed ? { index: false, follow: false } : undefined,
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

  const site = await getPublicSite(siteId);
  const maintenance = resolveSiteSettings(site?.settings).general;
  if (maintenance.maintenanceEnabled && !(await getSession())) {
    return <MaintenanceView locale={locale} message={maintenance.maintenanceMessage} />;
  }
  const [nav, widgetFeed] = await Promise.all([
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
  const isYf = (preview?.themeId ?? activeTheme.id) === YF_THEME_ID;
  const skin = preview ? { themeId: preview.themeId, css: preview.css } : await getActiveSkin(siteId);
  const cssVars = compileDesignTokensToCssVars(preview?.tokens ?? tokens, resolveSiteSettings(site?.settings).customizer);
  // Düzen bileşenleri renkleri CSS değişkeninden okur (palet/karanlık mod değişince bileşen kodu aynı kalır)
  const vt = toCssVarTokens(preview?.tokens ?? tokens);
  const [menu, menuLibrary] = await Promise.all([getResolvedMenu(siteId, locale), getResolvedMenuLibrary(siteId, locale)]);
  // Tema oluşturucu şablonları: varsayılan header/footer/kenar çubuğu şablonu varsa yerleşik olanın yerine geçer
  // Koşullar yalnızca dil ve sayfa adresiyle eşleşebilir (içerik türü/kategori bilgisi bu katmanda yoktur)
  const segs = (reqHeaders.get("x-nexpress-pathname") ?? "").split("/").filter(Boolean);
  const chromeCtx = { locale, slug: segs.length >= 2 ? decodeURIComponent(segs[1]!) : "ana-sayfa" };
  const [headerTpl, footerTpl, sidebarTplRaw] = await Promise.all([templateFor(siteId, "header", null, chromeCtx), templateFor(siteId, "footer", null, chromeCtx), templateFor(siteId, "sidebar", null, chromeCtx)]);
  // Yazılım Firması Teması kenar çubuğunu kendi alanlarından çizer; şablon kenarı eski sitelerden sızmasın
  const sidebarTpl = isYf ? null : sidebarTplRaw;
  const resolvedSettings = resolveSiteSettings(site?.settings);
  const resolvedCustomizer = resolvedSettings.customizer;
  const ga4Settings = resolvedSettings.seo?.integrations?.ga4;
  const ga4MeasurementId = (ga4Settings?.enabled && ga4Settings?.measurementId?.trim()) || null;
  const cust = resolvedCustomizer.header;
  const headerBehavior = headerTpl?.meta.behavior ?? {};
  const tplCtx = headerTpl || footerTpl || sidebarTpl ? buildTemplateContext({ site: site ? { name: site.name, tagline: site.tagline, logoText: cust.logoText, logoImage: cust.logoImage } : null, locale, copyright: nav?.footerConfig.copyrightText, menu, tokens, menuLabel: t("site.menu") }) : null;

  // Sayfa türünü belirle (Kadence / WordPress tarzı akıllı kenar çubuğu eşleşmesi)
  const isHome = segs.length <= 1 || (segs.length === 1 && segs[0] === locale);
  const isCategory = segs.length >= 2 && (segs[1] === "kategori" || segs[1] === "etiket");
  const isShop = segs.length >= 2 && segs[1] === "magaza";
  const isSearch = segs.length >= 2 && segs[1] === "ara";
  const isCampaignDetail = segs.length >= 3 && segs[1] === "kampanya";
  const isCampaignArchive = segs.length >= 2 && segs[1] === "kampanyalar";
  const isSingleContent =
    !isHome &&
    !isCategory &&
    !isShop &&
    !isSearch &&
    !isCampaignDetail &&
    !isCampaignArchive &&
    segs.length >= 2;

  let targetAreaId = "primary";
  let contentSidebarPos: "none" | "left" | "right" | undefined = undefined;

  if (isHome) {
    contentSidebarPos = "none";
  } else if (isCategory) {
    if (resolvedCustomizer.layout.sidebarOnArchive !== false) {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "right";
      targetAreaId = resolvedCustomizer.layout.archiveSidebarId || "archive";
    } else {
      contentSidebarPos = "none";
    }
  } else if (isCampaignArchive) {
    if (resolvedCustomizer.layout.sidebarOnArchive !== false) {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "right";
      targetAreaId = resolvedCustomizer.layout.archiveSidebarId || "archive";
    } else {
      contentSidebarPos = "none";
    }
  } else if (isShop) {
    if (resolvedCustomizer.layout.sidebarOnShop !== false) {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "left";
      targetAreaId = resolvedCustomizer.layout.shopSidebarId || "shop";
    } else {
      contentSidebarPos = "none";
    }
  } else if (isSearch) {
    if (resolvedCustomizer.layout.sidebarOnSearch === true) {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "right";
      targetAreaId = resolvedCustomizer.layout.searchSidebarId || "primary";
    } else {
      contentSidebarPos = "none";
    }
  } else if (isCampaignDetail) {
    const slug = decodeURIComponent(segs[2]!);
    const resolvedCont = await resolvePublicContent(siteId, slug, locale);
    const content = resolvedCont?.content;
    const customSidebar = (content?.schemaAttributes as Record<string, unknown> | undefined)?._sidebar as
      | { position?: "none" | "left" | "right"; sidebarId?: string }
      | undefined;

    if (customSidebar?.position) {
      contentSidebarPos = customSidebar.position;
      if (customSidebar.sidebarId) targetAreaId = customSidebar.sidebarId;
    } else if (resolvedCustomizer.layout.sidebarOnBlog !== false) {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "right";
      targetAreaId = resolvedCustomizer.layout.blogSidebarId || "primary";
    } else {
      contentSidebarPos = "none";
    }
  } else if (isSingleContent) {
    const slug = decodeURIComponent(segs[1]!);
    const resolvedCont = await resolvePublicContent(siteId, slug, locale);
    const content = resolvedCont?.content;
    const customSidebar = (content?.schemaAttributes as Record<string, unknown> | undefined)?._sidebar as
      | { position?: "none" | "left" | "right"; sidebarId?: string }
      | undefined;

    if (customSidebar?.position) {
      contentSidebarPos = customSidebar.position;
      if (customSidebar.sidebarId) targetAreaId = customSidebar.sidebarId;
    } else if (content?.type === "post") {
      if (resolvedCustomizer.layout.sidebarOnBlog !== false) {
        contentSidebarPos =
          resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
            ? resolvedCustomizer.layout.sidebarPosition
            : "left";
        targetAreaId = resolvedCustomizer.layout.blogSidebarId || "blog";
      } else {
        contentSidebarPos = "none";
      }
    } else if (content?.type === "product") {
      if (resolvedCustomizer.layout.sidebarOnShop !== false) {
        contentSidebarPos =
          resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
            ? resolvedCustomizer.layout.sidebarPosition
            : "left";
        targetAreaId = resolvedCustomizer.layout.shopSidebarId || "shop";
      } else {
        contentSidebarPos = "none";
      }
    } else if (content?.type === "page") {
      // Kurumsal Sayfa: sidebarOnPage açık değilse kesinlikle gösterilmez (blog sidebar sızması önlenir)
      if (resolvedCustomizer.layout.sidebarOnPage === true) {
        contentSidebarPos =
          resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
            ? resolvedCustomizer.layout.sidebarPosition
            : "right";
        targetAreaId = resolvedCustomizer.layout.pageSidebarId || "page";
      } else {
        contentSidebarPos = "none";
      }
    } else if (content?.type === "ai_prompt" || content?.type === "kb_tech") {
      contentSidebarPos =
        resolvedCustomizer.layout.sidebarPosition && resolvedCustomizer.layout.sidebarPosition !== "none"
          ? resolvedCustomizer.layout.sidebarPosition
          : "right";
      targetAreaId = "faq";
    } else {
      contentSidebarPos = "none";
    }
  }

  const activeSidebarArea = resolveActiveSidebarArea(nav?.sidebarConfig, targetAreaId);
  const effectiveSidebarPos: "none" | "left" | "right" =
    contentSidebarPos !== undefined
      ? contentSidebarPos
      : sidebarTpl
        ? "right"
        : "none";

  const hasSidebar =
    effectiveSidebarPos !== "none" &&
    Boolean(sidebarTpl || (activeSidebarArea && activeSidebarArea.enabled !== false));
  const sidebarWidth = activeSidebarArea?.width || resolvedCustomizer.layout.sidebarWidth || "288px";

  return (
    <div
      data-nx-skin={skin?.themeId ?? (isInk ? "ink" : isYf ? YF_THEME_ID : undefined)}
      style={{
        backgroundColor: vt.colors.background,
        color: vt.colors.foreground,
        fontFamily: (preview?.tokens ?? tokens).typography.bodyFont,
      }}
      id="nx-top"
      className="relative min-h-screen flex flex-col"
    >
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {skin?.css ? <style dangerouslySetInnerHTML={{ __html: skin.css }} /> : null}
      {resolvedCustomizer.customCss ? (
        <style id="nx-custom-css" dangerouslySetInnerHTML={{ __html: resolvedCustomizer.customCss }} />
      ) : null}
      {resolvedCustomizer.headerScripts ? (
        <div id="nx-header-scripts" dangerouslySetInnerHTML={{ __html: resolvedCustomizer.headerScripts }} />
      ) : null}
      {preview ? (
        <div role="status" className="bg-amber-100 px-3 py-1 text-center text-xs font-medium text-amber-900">
          {t("site.themePreview", { id: preview.themeId })}
        </div>
      ) : null}
      {isInk ? <style dangerouslySetInnerHTML={{ __html: INK_GRID_CSS }} /> : null}
      {isYf ? <style dangerouslySetInnerHTML={{ __html: YF_CSS }} /> : null}
      <PluginSlot name="public.head.meta" siteId={siteId} />
      {ga4MeasurementId ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4MeasurementId.replace(/'/g, "\\'")}');`,
            }}
          />
        </>
      ) : null}

      {headerTpl && tplCtx && !isYf ? (
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
        menuAllLabel={t("site.menuAll")}
        searchLabel={t("site.search")}
      />
      )}

      <div
        style={hasSidebar ? { maxWidth: tokens.geometry.containerMaxWidth } : undefined}
        className={hasSidebar ? "mx-auto flex w-full flex-1 gap-6" : "contents"}
      >
        {hasSidebar && effectiveSidebarPos === "left" ? (
          sidebarTpl && tplCtx && !isYf ? (
            <aside aria-label="Kenar çubuğu" style={{ width: sidebarWidth }} className="hidden shrink-0 px-4 py-10 md:block">
              <RscBlockRenderer blocks={sidebarTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
            </aside>
          ) : activeSidebarArea ? (
            <PublicSidebarWidgetArea sidebar={activeSidebarArea} locale={locale} tokens={vt} feed={widgetFeed} width={sidebarWidth} menuLibrary={menuLibrary} />
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
          sidebarTpl && tplCtx && !isYf ? (
            <aside aria-label="Kenar çubuğu" style={{ width: sidebarWidth }} className="hidden shrink-0 px-4 py-10 md:block">
              <RscBlockRenderer blocks={sidebarTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
            </aside>
          ) : activeSidebarArea ? (
            <PublicSidebarWidgetArea sidebar={activeSidebarArea} locale={locale} tokens={vt} feed={widgetFeed} width={sidebarWidth} menuLibrary={menuLibrary} />
          ) : null
        ) : null}
      </div>

      {footerTpl && tplCtx && !isYf ? (
        <footer style={{ borderColor: vt.colors.border }} className="mt-16 border-t px-4 py-12 sm:px-6">
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto">
            <RscBlockRenderer blocks={footerTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
          </div>
        </footer>
      ) : (
        <SiteFooter siteName={site?.name ?? "NexPress CMS"} siteDna={site?.siteDna} locale={locale} tokens={vt} footer={nav?.footerConfig} fallbackText={t("site.footerDefault")} widgetFeed={widgetFeed} menuLibrary={menuLibrary} />
      )}
      {resolvedCustomizer.footerScripts ? (
        <div id="nx-footer-scripts" dangerouslySetInnerHTML={{ __html: resolvedCustomizer.footerScripts }} />
      ) : null}
      {isYf ? <YazilimFirmasiReach locale={locale} /> : null}
      <BackToTop settings={resolvedCustomizer.backToTop} label={t("site.backToTop")} />
    </div>
  );
}


