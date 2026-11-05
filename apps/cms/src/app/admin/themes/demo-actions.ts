"use server";

import { AKINSOFT_THEME_ID, getThemeDemoPack } from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { applyAkinsoftChrome } from "@/lib/apply-akinsoft-theme";

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
  if (input.themeId === AKINSOFT_THEME_ID) await applyAkinsoftChrome(admin.siteId, locale);

  const skipped: string[] = [];
  let added = 0;
  for (const entry of pack.entries) {
    const existing = await repo.getContentBySlug(entry.slug, locale);
    if (existing) {
      skipped.push(entry.slug);
      continue;
    }
    await repo.saveContent({
      actor: { id: admin.sub, email: admin.email },
      type: entry.type,
      status: "published",
      schemaType: entry.schemaType,
      schemaAttributes: {
        canvas: true,
        _demo: { themeId: pack.themeId, label: "Demo verisi" },
        _publishing: {
          visibility: "public",
          allowComments: false,
          allowReviews: false,
          showShareButtons: false,
          categories: entry.type === "post" ? ["Demo"] : [],
          tags: ["demo"],
        },
      },
      importanceScore: entry.slug === pack.homeSlug ? 10 : 6,
      locale,
      slug: entry.slug,
      title: entry.title,
      tldr: entry.tldr,
      blocks: entry.blocks,
    });
    added++;
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
