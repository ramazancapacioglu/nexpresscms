import type { NavigationLayoutDto } from "./types";
import { eq, and } from "drizzle-orm";
import { type FooterConfig, type HeaderConfig, emptySidebarConfig, type NavigationMenuItem, type SidebarConfig, type SiteMenuRecord } from "@nexpress/core";
import { CmsSiteRepository } from "./site";

export class CmsNavigationRepository extends CmsSiteRepository {
  /**
   * 3 Katmanlı Görsel Header, Footer ve Mega-Menü yerleşimini getirir.
   */
  public async getNavigationLayout(locale = "tr"): Promise<NavigationLayoutDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.navigationLayouts)
      .where(
        and(
          eq(t.navigationLayouts.siteId, this.siteId),
          eq(t.navigationLayouts.locale, locale)
        )
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      siteId: row.siteId,
      locale: row.locale,
      headerConfig: row.headerConfig,
      menuItems: row.menuItems,
      footerConfig: row.footerConfig,
      sidebarConfig: row.sidebarConfig ?? emptySidebarConfig(),
    };
  }

  /**
   * 3 Katmanlı Görsel Header, Footer ve Mega-Menü yerleşimini günceller (`siteId` korumalı).
   */
  public async saveNavigationLayout(input: {
    locale?: string;
    headerConfig?: HeaderConfig;
    menuItems?: NavigationMenuItem[];
    footerConfig?: FooterConfig;
    sidebarConfig?: SidebarConfig;
    /** Kayıtlı menüler footer JSON'unun `menus` alanına yazılır. Header kaydı ayrıca `menuItems` olur. */
    menus?: SiteMenuRecord[];
  }): Promise<void> {
    const locale = input.locale ?? "tr";
    const existing = await this.getNavigationLayout(locale);
    const now = new Date();
    const id = existing?.id ?? `nav_${this.siteId}_${locale}`;
    const headerConfig = input.headerConfig ?? existing?.headerConfig;
    const menuItems = input.menuItems ?? existing?.menuItems ?? [];
    let footerConfig: FooterConfig = input.footerConfig ??
      existing?.footerConfig ?? {
        columns: [],
        showNewsletter: true,
        showLocalBusinessCard: false,
        copyrightText: "© 2026 NexPress CMS",
        bottomLinks: [],
      };
    if (input.menus) footerConfig = { ...footerConfig, menus: input.menus };
    else if (footerConfig.menus === undefined && existing?.footerConfig.menus) footerConfig = { ...footerConfig, menus: existing.footerConfig.menus };
    const sidebarConfig = input.sidebarConfig ?? existing?.sidebarConfig ?? emptySidebarConfig();
    if (!headerConfig) {
      throw new Error("Header kaydı yok.");
    }

    const { db, t } = this.backend;
    await db
      .insert(t.navigationLayouts)
      .values({
        id,
        siteId: this.siteId,
        locale,
        headerConfig,
        menuItems,
        footerConfig,
        sidebarConfig,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: t.navigationLayouts.id,
        set: {
          headerConfig,
          menuItems,
          footerConfig,
          sidebarConfig,
          updatedAt: now,
        },
      });
  }
}
