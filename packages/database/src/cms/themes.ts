import { and, eq } from "drizzle-orm";
import type { DesignTokens } from "@nexpress/core";
import { upsertScoped } from "../dialect";
import { CmsTranslationRepository } from "./translations";

export interface UploadedThemeInput {
  themeId: string;
  name: string;
  version: string;
  author: string;
  tagline: string;
  description: string;
  recommendedProfile: string;
  tokens: DesignTokens;
  /** Doğrulanmış ve kapsamlanmış CSS */
  css: string;
  /** Özgün (kapsamlanmamış) CSS; dışa aktarma için */
  rawCss: string;
  header: Record<string, unknown> | null;
  footer: Record<string, unknown> | null;
  pages: Array<Record<string, unknown>>;
  screenshot: string | null;
  checksum: string;
}

export interface UploadedThemeDto extends UploadedThemeInput {
  isActive: boolean;
  installedAt: Date;
}

export type ThemeInstallResult = { ok: true; replaced: boolean } | { ok: false; error: string };

/** Yüklenen (veri) temalar. Resmi temalar kodda yaşar; burada yalnızca `source = uploaded` satırları yönetilir. */
export class CmsThemeRepository extends CmsTranslationRepository {
  private toUploaded(r: Record<string, unknown>): UploadedThemeDto {
    return {
      themeId: r.themeId as string,
      name: r.name as string,
      version: r.version as string,
      author: r.author as string,
      tagline: r.tagline as string,
      description: r.description as string,
      recommendedProfile: r.recommendedProfile as string,
      tokens: r.packageTokens as DesignTokens,
      css: r.css as string,
      rawCss: r.rawCss as string,
      header: (r.header as Record<string, unknown> | null) ?? null,
      footer: (r.footer as Record<string, unknown> | null) ?? null,
      pages: (r.pages as Array<Record<string, unknown>>) ?? [],
      screenshot: (r.screenshot as string | null) ?? null,
      checksum: r.checksum as string,
      isActive: Boolean(r.isActive),
      installedAt: new Date(r.installedAt as Date),
    };
  }

  public async listUploadedThemes(): Promise<UploadedThemeDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.installedThemes).where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.source, "uploaded")));
    return rows.map((r) => this.toUploaded(r as Record<string, unknown>));
  }

  public async getUploadedTheme(themeId: string): Promise<UploadedThemeDto | null> {
    return (await this.listUploadedThemes()).find((x) => x.themeId === themeId) ?? null;
  }

  /** Aynı kimlik yüklenen bir temaysa sürüm olarak güncellenir; resmi tema kimliğiyle çakışma reddedilir. */
  public async installUploadedTheme(input: UploadedThemeInput): Promise<ThemeInstallResult> {
    const { db, t } = this.backend;
    const existing = await db.select().from(t.installedThemes).where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.themeId, input.themeId))).limit(1);
    const row = existing[0] as Record<string, unknown> | undefined;
    if (row && row.source !== "uploaded") return { ok: false, error: "Bu kimlik resmi bir temaya ait; paket kimliğini değiştirin." };
    await upsertScoped(
      db,
      t.installedThemes,
      this.siteId,
      {
        id: `th_${this.siteId}_${input.themeId}`,
        siteId: this.siteId,
        themeId: input.themeId,
        isActive: Boolean(row?.isActive),
        customTokens: (row?.customTokens as object | undefined) ?? {},
        source: "uploaded",
        name: input.name,
        version: input.version,
        author: input.author,
        tagline: input.tagline,
        description: input.description,
        recommendedProfile: input.recommendedProfile,
        packageTokens: input.tokens,
        css: input.css,
        rawCss: input.rawCss,
        header: input.header,
        footer: input.footer,
        pages: input.pages,
        screenshot: input.screenshot,
        checksum: input.checksum,
        installedAt: new Date(),
      },
      undefined
    );
    const saved = await this.getUploadedTheme(input.themeId);
    return saved ? { ok: true, replaced: Boolean(row) } : { ok: false, error: "Tema kaydedilemedi." };
  }

  /** Etkin tema silinemez; silinen temanın kullanıcı özelleştirmeleri de gider. */
  public async deleteUploadedTheme(themeId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const theme = await this.getUploadedTheme(themeId);
    if (!theme) return { ok: false, error: "Tema bulunamadı." };
    const site = await this.getSite();
    if (theme.isActive || site?.activeThemeId === themeId) return { ok: false, error: "Etkin tema silinemez; önce başka bir tema etkinleştirin." };
    const { db, t } = this.backend;
    await db.delete(t.installedThemes).where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.themeId, themeId), eq(t.installedThemes.source, "uploaded")));
    return (await this.getUploadedTheme(themeId)) ? { ok: false, error: "Tema silinemedi." } : { ok: true };
  }

  /** Etkin tema yüklenen bir veri temasıysa kapsamlanmış CSS'i (ön yüz `<style>` için). */
  public async activeSkin(): Promise<{ themeId: string; css: string } | null> {
    const site = await this.getSite();
    if (!site) return null;
    const theme = await this.getUploadedTheme(site.activeThemeId);
    return theme && theme.css ? { themeId: theme.themeId, css: theme.css } : null;
  }
}
