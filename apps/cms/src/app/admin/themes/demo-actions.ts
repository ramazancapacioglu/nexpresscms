"use server";

import { YF_THEME_ID, getThemeDemoPack } from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { applyYazilimFirmasiChrome } from "@/lib/apply-yazilim-firmasi-theme";

export type DemoImportResult =
  | { ok: true; added: number; skipped: string[] }
  | { ok: false; error: string };

/**
 * Etkin temanın demo sayfa ve yazılarını ekler.
 * Aynı adresteki içerik değişmez. Kayıtlar yayında ve normal içerik gibi düzenlenebilir.
 */
export async function importThemeDemoAction(input: { themeId: string }): Promise<DemoImportResult> {
  const admin = await requireAdmin("themes.importDemo");
  const pack = getThemeDemoPack(input.themeId);
  if (!pack) return { ok: false, error: "Bu temanın demo verisi yok." };

  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  if (site?.activeThemeId !== input.themeId) {
    return { ok: false, error: "Önce bu temayı etkinleştirin. Demo aktarımı açık temaya yazılır." };
  }

  const locale = site.defaultLocale || "tr";
  if (input.themeId === YF_THEME_ID) await applyYazilimFirmasiChrome(admin.siteId, locale);

  const skipped: string[] = [];
  let added = 0;
  for (const entry of pack.entries) {
    const existing = await repo.getContentBySlug(entry.slug, locale);
    if (existing) {
      skipped.push(entry.slug);
      continue;
    }
    const isCampaign = entry.type === "campaign" && entry.campaign;
    const endDate = isCampaign ? new Date(Date.now() + entry.campaign!.endsInDays * 86_400_000).toISOString().slice(0, 10) : undefined;
    await repo.saveContent({
      actor: { id: admin.sub, email: admin.email },
      type: entry.type,
      status: "published",
      schemaType: entry.schemaType,
      schemaAttributes: {
        canvas: entry.canvas !== false,
        _demo: { themeId: pack.themeId, label: "Demo verisi" },
        ...(isCampaign
          ? {
              campaign: {
                discount: entry.campaign!.discount,
                gift: entry.campaign!.gift,
                badge: entry.campaign!.badge,
                endDate,
                ctaText: entry.campaign!.ctaText,
                ctaUrl: entry.campaign!.ctaUrl,
                featuredImageUrl: entry.image,
                featuredImageAlt: entry.title,
              },
            }
          : {}),
        _publishing: {
          visibility: "public",
          allowComments: false,
          allowReviews: false,
          showShareButtons: false,
          categories: entry.categories ?? (entry.type === "post" ? ["Demo"] : isCampaign ? ["Kampanyalar"] : []),
          tags: ["demo"],
          ...(entry.image ? { featuredImageUrl: entry.image, featuredImageAlt: entry.title } : {}),
        },
      },
      ...(entry.image ? { featuredImage: entry.image } : {}),
      importanceScore: entry.slug === pack.homeSlug ? 10 : 6,
      locale,
      slug: entry.slug,
      title: entry.title,
      tldr: entry.tldr,
      blocks: entry.blocks,
    });
    added++;
  }

  // Demo ana sayfa açılış sayfası olur (ziyaretçi `/` adresinde temanın vitrinini görür)
  if (pack.homeSlug && (await repo.getContentBySlug(pack.homeSlug, locale))) {
    await repo.saveSiteSettings({ general: { frontPageSlug: pack.homeSlug } });
  }

  await recordAudit(
    { id: admin.sub, email: admin.email },
    "themes.importDemo",
    { detail: `${pack.themeId}; +${added}; atlanan:${skipped.join(",") || "-"}` },
  );
  await invalidateSite(admin.siteId);
  await revalidatePath("/admin/themes");
  await revalidatePath("/admin/contents");
  await revalidatePath(`/${locale}`);
  return { ok: true, added, skipped };
}
