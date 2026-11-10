"use server";

import { sanitizeReadingSlug } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { revalidatePath } from "@/lib/cache";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

export type ReadingResult = { ok: true } | { ok: false; error: string };

/** Öne çıkan sayfa ana sayfada, blog sayfası yazı listesinde açılır. */
export async function saveReadingSettingsAction(input: { frontPageSlug: string; postsPageSlug: string }): Promise<ReadingResult> {
  const admin = await requireAdmin("pages.reading");
  const frontPageSlug = sanitizeReadingSlug(input.frontPageSlug);
  const postsPageSlug = sanitizeReadingSlug(input.postsPageSlug);
  if (input.frontPageSlug.trim() && !frontPageSlug) return { ok: false, error: "Öne çıkan sayfa adresi geçersiz." };
  if (input.postsPageSlug.trim() && !postsPageSlug) return { ok: false, error: "Blog sayfası adresi geçersiz." };
  if (frontPageSlug && frontPageSlug === postsPageSlug) return { ok: false, error: "Öne çıkan sayfa ile blog sayfası aynı olamaz." };

  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const pages = (await repo.listContents({ locale, type: "page" })).filter((row) => row.status !== "trashed");
  if (frontPageSlug && !pages.some((row) => row.slug === frontPageSlug)) return { ok: false, error: "Öne çıkan sayfa bulunamadı." };
  if (postsPageSlug && !pages.some((row) => row.slug === postsPageSlug)) return { ok: false, error: "Blog sayfası bulunamadı." };

  await repo.saveSiteSettings({ general: { frontPageSlug, postsPageSlug } });
  await recordAudit({ id: admin.sub, email: admin.email }, "pages.reading", {
    detail: `öne çıkan: ${frontPageSlug || "tema"}; blog: ${postsPageSlug || "yok"}`,
  });
  await revalidatePath("/admin/pages");
  await revalidatePath("/");
  await revalidatePath("/tr", "layout");
  if (frontPageSlug) await revalidatePath(`/tr/${frontPageSlug}`);
  if (postsPageSlug) await revalidatePath(`/tr/${postsPageSlug}`);
  return { ok: true };
}
