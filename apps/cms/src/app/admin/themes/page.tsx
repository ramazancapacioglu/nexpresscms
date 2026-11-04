import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { OFFICIAL_THEME_STORE, getThemeManifest } from "@nexpress/themes";
import { AppearanceNav } from "@/components/admin/section-tabs";
import { requireAdminPage } from "@/lib/auth/session";
import {
  ThemeGalleryView,
  type ThemeGalleryItem,
} from "@/components/admin/themes/theme-gallery-view";

export const dynamic = "force-dynamic";

export default async function AdminThemesPage() {
  const me = await requireAdminPage();
  const repo = getScopedRepository(me.siteId);
  const [site, uploadedThemes] = await Promise.all([
    repo.getSite(),
    repo.listUploadedThemes(),
  ]);

  const defaultLocale = site?.defaultLocale ?? "tr";
  const activeThemeId = site?.activeThemeId ?? "corporate-aurora";
  const activeManifest = getThemeManifest(activeThemeId);

  // 1. Resmi Temaları hazırla
  const officialItems: ThemeGalleryItem[] = OFFICIAL_THEME_STORE.map((m) => {
    const isActive = m.id === activeThemeId;
    return {
      id: m.id,
      name: m.name,
      version: m.version,
      author: m.author,
      description: m.description,
      tagline: m.tagline,
      isOfficial: true,
      isActive,
      screenshot: null,
      swatches: [
        m.tokens.colors.primary,
        m.tokens.colors.secondary,
        m.tokens.colors.accent,
        m.tokens.colors.background,
        m.tokens.colors.muted,
      ],
      tokens: m.tokens,
    };
  });

  // 2. Yüklenen Veri Temalarını hazırla (.nxtheme)
  const uploadedItems: ThemeGalleryItem[] = uploadedThemes.map((t) => {
    const isActive = t.isActive || t.themeId === activeThemeId;
    return {
      id: t.themeId,
      name: t.name,
      version: t.version,
      author: t.author,
      description: t.description || t.tagline,
      tagline: t.tagline,
      isOfficial: false,
      isActive,
      screenshot: t.screenshot,
      swatches: [
        t.tokens.colors.primary,
        t.tokens.colors.secondary,
        t.tokens.colors.accent,
        t.tokens.colors.background,
        t.tokens.colors.muted,
      ],
      tokens: t.tokens,
      pages: t.pages.length,
      hasChrome: Boolean(t.header || t.footer),
      hasCss: Boolean(t.css),
    };
  });

  // Aktif tema kartı nesnesi
  const allThemes = [...officialItems, ...uploadedItems];
  const activeThemeItem =
    allThemes.find((t) => t.id === activeThemeId) ?? officialItems[0]!;

  return (
    <div className="space-y-5">
      <AppearanceNav />
      <ThemeGalleryView
        activeTheme={activeThemeItem}
        themes={allThemes}
        defaultLocale={defaultLocale}
      />
    </div>
  );
}
