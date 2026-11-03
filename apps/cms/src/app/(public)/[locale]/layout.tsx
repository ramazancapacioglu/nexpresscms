import React from "react";
import type { Metadata } from "next";
import { createTranslator } from "@nexpress/i18n";
import { getActiveSkin, getPreviewTheme } from "@/lib/public-theme";
import { redirectOrNotFound } from "@/lib/redirect-runtime";
import { runScheduler } from "@/lib/scheduler";
import { after } from "next/server";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { templateFor } from "@/lib/templates";
import { buildTemplateContext } from "@/lib/template-context";
import { getResolvedMenu } from "@/lib/menu-data";
import { getPublicNavigation, getPublicSite } from "@/lib/public-data";
import {
  compileDesignTokensToCssVars,
  getThemeManifest,
  INK_GRID_CSS,
  INK_GRID_ID,
} from "@nexpress/themes";
import { PluginSlot, resolveSiteSettings, type NavigationLink } from "@nexpress/core";
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

  const [site, nav] = await Promise.all([getPublicSite(siteId), getPublicNavigation(siteId, locale)]);

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
  const cssVars = compileDesignTokensToCssVars(preview?.tokens ?? tokens, site?.settings?.customizer);
  const menu = await getResolvedMenu(siteId, locale);
  // Tema oluşturucu şablonları: varsayılan header/footer/kenar çubuğu şablonu varsa yerleşik olanın yerine geçer
  // Koşullar yalnızca dil ve sayfa adresiyle eşleşebilir (içerik türü/kategori bilgisi bu katmanda yoktur)
  const segs = (reqHeaders.get("x-nexpress-pathname") ?? "").split("/").filter(Boolean);
  const chromeCtx = { locale, slug: segs.length >= 2 ? decodeURIComponent(segs[1]!) : "ana-sayfa" };
  const [headerTpl, footerTpl, sidebarTpl] = await Promise.all([templateFor(siteId, "header", null, chromeCtx), templateFor(siteId, "footer", null, chromeCtx), templateFor(siteId, "sidebar", null, chromeCtx)]);
  const cust = resolveSiteSettings(site?.settings).customizer.header;
  const tplCtx = headerTpl || footerTpl || sidebarTpl ? buildTemplateContext({ site: site ? { name: site.name, tagline: site.tagline, logoText: cust.logoText, logoImage: cust.logoImage } : null, locale, copyright: nav?.footerConfig.copyrightText, menu, tokens, menuLabel: t("site.menu") }) : null;
  const sidebar = nav?.sidebarConfig?.enabled ? nav.sidebarConfig : null;

  return (
    <div
      data-nx-skin={skin?.themeId ?? (isInk ? "ink" : undefined)}
      style={{
        backgroundColor: (preview?.tokens ?? tokens).colors.background,
        color: (preview?.tokens ?? tokens).colors.foreground,
        fontFamily: (preview?.tokens ?? tokens).typography.bodyFont,
      }}
      className="min-h-screen flex flex-col"
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
        <header style={{ borderColor: tokens.colors.border }} className={`nx-public-header z-40 border-b ${headerTpl.meta.behavior?.sticky === false ? "relative" : "sticky top-0"} ${headerTpl.meta.behavior?.glass === false ? "bg-white" : "bg-white/95 backdrop-blur-md"}`}>
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto px-4 py-3 sm:px-6">
            <RscBlockRenderer blocks={headerTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
          </div>
        </header>
      ) : (
      <SiteHeader
        siteName={site?.name ?? "NexPress CMS"}
        tagline={site?.tagline}
        locale={locale}
        menu={menu}
        tokens={tokens}
        ink={isInk}
        header={nav?.headerConfig}
        custom={resolveSiteSettings(site?.settings).customizer.header}
        menuLabel={t("site.menu")}
      />
      )}

      <div className={sidebar ? "mx-auto flex w-full flex-1" : "contents"}>
        {sidebarTpl && tplCtx ? (
          <aside aria-label="Kenar çubuğu" className="hidden w-72 shrink-0 px-4 py-10 md:block"><RscBlockRenderer blocks={sidebarTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} /></aside>
        ) : null}
        {!sidebarTpl && sidebar?.position === "left" ? (
          <PublicSideColumn title={sidebar.title} links={sidebar.links} />
        ) : null}
        <main
          style={{ maxWidth: isInk || sidebar ? "100%" : tokens.geometry.containerMaxWidth }}
          className={isInk ? "mx-auto w-full flex-1" : "mx-auto w-full flex-1 px-4 py-10 sm:px-6"}
        >
          {children}
        </main>
        {!sidebarTpl && sidebar?.position === "right" ? (
          <PublicSideColumn title={sidebar.title} links={sidebar.links} />
        ) : null}
      </div>

      {footerTpl && tplCtx ? (
        <footer style={{ borderColor: tokens.colors.border }} className="mt-16 border-t px-4 py-12 sm:px-6">
          <div style={{ maxWidth: tokens.geometry.containerMaxWidth }} className="mx-auto">
            <RscBlockRenderer blocks={footerTpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={tplCtx} />
          </div>
        </footer>
      ) : (
        <SiteFooter siteName={site?.name ?? "NexPress CMS"} siteDna={site?.siteDna} locale={locale} tokens={tokens} footer={nav?.footerConfig} fallbackText={t("site.footerDefault")} />
      )}
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
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}


