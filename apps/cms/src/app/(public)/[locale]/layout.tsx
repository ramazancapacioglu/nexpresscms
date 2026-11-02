import React from "react";
import type { Metadata } from "next";
import { createTranslator } from "@nexpress/i18n";
import { getActiveSkin, getPreviewTheme } from "@/lib/public-theme";
import { redirectOrNotFound } from "@/lib/redirect-runtime";
import { runScheduler } from "@/lib/scheduler";
import { after } from "next/server";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { getResolvedMenu } from "@/lib/menu-data";
import { getPublicNavigation, getPublicSite } from "@/lib/public-data";
import {
  compileDesignTokensToCssVars,
  getThemeManifest,
  INK_GRID_CSS,
  INK_GRID_ID,
} from "@nexpress/themes";
import { PluginSlot, resolveSiteSettings, type NavigationLink } from "@nexpress/core";

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

      <SiteFooter siteName={site?.name ?? "NexPress CMS"} siteDna={site?.siteDna} locale={locale} tokens={tokens} footer={nav?.footerConfig} fallbackText={t("site.footerDefault")} />
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


