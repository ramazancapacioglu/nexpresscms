"use server";

import type { DesignTokens, FooterConfig, HeaderConfig, SiteProfile } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { switchThemeChrome } from "@/lib/theme-chrome-switch";

export type ActivateResult =
  | { ok: true; pagesAdded: number; pagesSkipped: number; chromeApplied: boolean }
  | { ok: false; error: string };

/**
 * Yüklenen temayı etkinleştirir: token'lar sitenin tasarımı olur. İsteğe bağlı olarak üst/alt şablon uygulanır
 * ve başlangıç sayfaları **taslak olarak eklenir** (aynı adresli mevcut içerik asla ezilmez).
 */
export async function activateUploadedThemeAction(input: { themeId: string; applyChrome: boolean; addPages: boolean }): Promise<ActivateResult> {
  const admin = await requireAdmin("themes.activateUploaded");
  const repo = getScopedRepository(admin.siteId);
  const theme = await repo.getUploadedTheme(input.themeId);
  if (!theme) return { ok: false, error: "Tema bulunamadı." };
  const site = await repo.getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const previousId = site?.activeThemeId ?? "";

  await repo.activateTheme(theme.themeId, theme.tokens as DesignTokens, theme.recommendedProfile as SiteProfile);
  await switchThemeChrome(admin.siteId, previousId, theme.themeId, defaultLocale);

  let chromeApplied = false;
  if (input.applyChrome && (theme.header || theme.footer)) {
    try {
      for (const locale of site?.supportedLocales ?? [defaultLocale]) {
        await repo.saveNavigationLayout({
          locale,
          ...(theme.header ? { headerConfig: theme.header as unknown as HeaderConfig } : {}),
          ...(theme.footer ? { footerConfig: theme.footer as unknown as FooterConfig } : {}),
        });
      }
      chromeApplied = true;
    } catch {
      chromeApplied = false;
    }
  }

  let pagesAdded = 0;
  let pagesSkipped = 0;
  if (input.addPages) {
    for (const p of theme.pages as Array<{ slug: string; title: string; tldr?: string; type?: "page" | "post"; blocks: never[] }>) {
      if (await repo.getContentBySlug(p.slug, defaultLocale)) {
        pagesSkipped++;
        continue;
      }
      await repo.saveContent({
        actor: { id: admin.sub, email: admin.email },
        type: p.type ?? "page",
        status: "draft",
        schemaType: p.type === "post" ? "BlogPosting" : "WebPage",
        importanceScore: 5,
        locale: defaultLocale,
        slug: p.slug,
        title: p.title,
        tldr: p.tldr,
        blocks: p.blocks,
      });
      pagesAdded++;
    }
  }

  await recordAudit({ id: admin.sub, email: admin.email }, "themes.activateUploaded", { detail: `${theme.themeId}@${theme.version}; şablon:${chromeApplied}; sayfa:+${pagesAdded}/${pagesSkipped} atlandı` });
  await invalidateSite();
  await revalidatePath("/admin/themes");
  await revalidatePath("/admin/themes/packages");
  return { ok: true, pagesAdded, pagesSkipped, chromeApplied };
}

export async function deleteUploadedThemeAction(input: { themeId: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("themes.deleteUploaded");
  const res = await getScopedRepository(admin.siteId).deleteUploadedTheme(input.themeId);
  if (res.ok) {
    await recordAudit({ id: admin.sub, email: admin.email }, "themes.deleteUploaded", { detail: input.themeId });
    await invalidateSite();
    await revalidatePath("/admin/themes/packages");
  }
  return res;
}
