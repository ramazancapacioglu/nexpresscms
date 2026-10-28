import type { InstalledThemeDto, SiteDto, SiteSettingsPatch } from "./types";
import { eq, and } from "drizzle-orm";
import { isValidLocaleTag, resolveSiteSettings, type DesignTokens, type SiteProfile, type SiteSettings } from "@nexpress/core";
import { CmsRepositoryBase } from "./base";

export class CmsSiteRepository extends CmsRepositoryBase {
  /**
   * Aktif sitenin profil, tema ve tasarım token bilgilerini getirir.
   */
  public async getSite(): Promise<SiteDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.sites)
      .where(eq(t.sites.siteId, this.siteId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      siteId: row.siteId,
      name: row.name,
      tagline: row.tagline,
      domain: row.domain,
      subdomain: row.subdomain,
      siteProfile: row.siteProfile,
      defaultLocale: row.defaultLocale,
      supportedLocales: row.supportedLocales,
      activeThemeId: row.activeThemeId,
      designTokens: row.designTokens,
      siteDna: row.siteDna,
      settings: resolveSiteSettings(row.settings),
    };
  }

  /**
   * Etkin dil listesini yazar. Varsayılan dil listede kalmak zorundadır; geçersiz etiket reddedilir.
   * Çevirisi olan bir dili listeden çıkarmak çeviriyi silmez, yalnızca ziyaretçiye kapatır.
   */
  public async saveSupportedLocales(locales: string[]): Promise<{ ok: true; locales: string[] } | { ok: false; error: string }> {
    const site = await this.getSite();
    if (!site) return { ok: false, error: "Site bulunamadı." };
    const clean = [...new Set(locales.map((l) => l.trim().toLowerCase()).filter(Boolean))];
    const bad = clean.find((l) => !isValidLocaleTag(l));
    if (bad) return { ok: false, error: `Geçersiz dil etiketi: ${bad}` };
    if (!clean.includes(site.defaultLocale)) return { ok: false, error: "Varsayılan dil listede kalmalı." };
    if (clean.length > 12) return { ok: false, error: "En çok 12 dil." };
    const { db, t } = this.backend;
    await db.update(t.sites).set({ supportedLocales: clean, updatedAt: new Date() }).where(eq(t.sites.siteId, this.siteId));
    return { ok: true, locales: clean };
  }

  /** Site DNA (marka kimlik özeti) metnini yazar; boş metin alanı temizler. */
  public async saveSiteDna(dna: string | null): Promise<void> {
    const { db, t } = this.backend;
    await db
      .update(t.sites)
      .set({ siteDna: dna?.trim() || null, updatedAt: new Date() })
      .where(eq(t.sites.siteId, this.siteId));
  }

  /**
   * Motor (SEO) ve Özelleştirici (Customizer) ayarlarını kısmi olarak birleştirip kaydeder (`siteId` korumalı).
   */
  public async saveSiteSettings(patch: SiteSettingsPatch): Promise<SiteSettings> {
    const current = (await this.getSite())?.settings ?? resolveSiteSettings({});
    const next: SiteSettings = resolveSiteSettings({
      seo: { ...current.seo, ...(patch.seo ?? {}) },
      general: { ...current.general, ...(patch.general ?? {}) },
      customizer: Object.fromEntries(
        Object.entries(current.customizer).map(([k, v]) => {
          const p = (patch.customizer as Record<string, unknown> | undefined)?.[k];
          if (p === undefined) return [k, v];
          if (v && typeof v === "object" && p && typeof p === "object") {
            return [k, { ...(v as object), ...(p as object) }];
          }
          return [k, p];
        })
      ),
    });
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.sites)
      .set({ settings: next as unknown as Record<string, unknown>, updatedAt: now })
      .where(eq(t.sites.siteId, this.siteId));
    return next;
  }

  /**
   * Tema Özelleştirici: tasarım tokenlarını (renk, tipografi, geometri) tema değişimi yapmadan günceller.
   */
  public async saveDesignTokens(tokens: DesignTokens): Promise<void> {
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.sites)
      .set({ designTokens: tokens, updatedAt: now })
      .where(eq(t.sites.siteId, this.siteId));
  }

  /**
   * Tema Mağazasında (`@nexpress/themes`) aktif temayı ve tasarım tokenlarını günceller.
   */
  public async activateTheme(
    themeId: string,
    designTokens: DesignTokens,
    siteProfile?: SiteProfile
  ): Promise<void> {
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.sites)
      .set({
        activeThemeId: themeId,
        designTokens,
        ...(siteProfile ? { siteProfile } : {}),
        updatedAt: now,
      })
      .where(eq(t.sites.siteId, this.siteId));

    await db
      .update(t.installedThemes)
      .set({ isActive: false })
      .where(eq(t.installedThemes.siteId, this.siteId));

    await db
      .update(t.installedThemes)
      .set({ isActive: true, customTokens: designTokens })
      .where(
        and(
          eq(t.installedThemes.siteId, this.siteId),
          eq(t.installedThemes.themeId, themeId)
        )
      );
  }

  /**
   * Kurulu temaları getirir (`siteId` korumalı).
   */
  public async listInstalledThemes(): Promise<InstalledThemeDto[]> {
    const { db, t } = this.backend;
    return db
      .select()
      .from(t.installedThemes)
      .where(eq(t.installedThemes.siteId, this.siteId));
  }
}
