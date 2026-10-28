import { eq } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

/** Site kimliği (ad, slogan). Ayar JSON'u `saveSiteSettings` ile ayrı güncellenir. */
export class SiteIdentityRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async update(input: { name: string; tagline: string | null }): Promise<void> {
    const set = { name: input.name.trim(), tagline: input.tagline?.trim() || null, updatedAt: new Date() };
    const { db, t } = this.backend;
    await db.update(t.sites).set(set).where(eq(t.sites.siteId, this.siteId));
  }
}

export function getSiteIdentityRepository(siteIdOverride?: string): SiteIdentityRepository {
  return new SiteIdentityRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
