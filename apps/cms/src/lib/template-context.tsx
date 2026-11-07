import "server-only";
import React from "react";
import type { DesignTokens, NavigationMenuItem } from "@nexpress/core";
import { createTranslator } from "@nexpress/i18n";
import type { TemplateRenderContext } from "@nexpress/themes";
import { DesktopNav, MenuList, MobileNav } from "@/components/public/site-nav";

interface Input {
  site: { name: string; tagline?: string | null; logoText?: string; logoImage?: string } | null;
  locale: string;
  /** Dilin kök adresi; tek dilli sitede boş. */
  lb?: string;
  copyright?: string;
  menu: NavigationMenuItem[];
  tokens: DesignTokens;
  menuLabel: string;
  breadcrumbs?: TemplateRenderContext["breadcrumbs"];
  post?: TemplateRenderContext["post"];
  archive?: TemplateRenderContext["archive"];
}

/** Şablon yuvaları için ortak bağlam: site bilgisi, çözülmüş menü (CSS'li, JS'siz), yol, yazı/arşiv verisi. */
export function buildTemplateContext(i: Input): TemplateRenderContext {
  return {
    site: { name: i.site?.name ?? "NexPress CMS", tagline: i.site?.tagline, logoText: i.site?.logoText ?? "", logoImage: i.site?.logoImage ?? "" },
    locale: i.locale,
    lb: i.lb,
    copyright: i.copyright ?? "",
    menu: i.menu.length
      ? {
          horizontal: (
            <>
              <DesktopNav menu={i.menu} tokens={i.tokens} ink={false} align="left" />
              <MobileNav menu={i.menu} label={i.menuLabel} allLabel={createTranslator(i.locale)("site.menuAll")} />
            </>
          ),
          list: <MenuList links={i.menu} />,
        }
      : null,
    breadcrumbs: i.breadcrumbs ?? [],
    post: i.post,
    archive: i.archive,
  };
}

/** Sayfa bloklarındaki kapak yuvası: başlık, kısa açıklama ve öne çıkan görsel. Menü çizmez. */
export function coverTemplateContext(i: {
  site: Input["site"];
  locale: string;
  lb?: string;
  tokens: Input["tokens"];
  title: string;
  excerpt?: string | null;
  featuredImage?: { url: string; alt: string; caption?: string } | null;
}): TemplateRenderContext {
  return buildTemplateContext({
    site: i.site,
    locale: i.locale,
    lb: i.lb,
    menu: [],
    tokens: i.tokens,
    menuLabel: "Menü",
    post: {
      title: i.title,
      excerpt: i.excerpt ?? "",
      content: null,
      featuredImage: i.featuredImage ?? null,
      categories: [],
    },
  });
}
