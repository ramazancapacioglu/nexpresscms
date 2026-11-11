"use server";

import { catalogEntry, type InstalledFont } from "@nexpress/core";
import { requireAdmin } from "@/lib/auth/session";
import { installGoogleFont } from "@/lib/fonts";

export type InstallFontResult = { ok: true; font: InstalledFont } | { ok: false; error: string };

/**
 * Seçilen yazı tipini sunucuya indirir (Google Fonts → kendi disk). Kayıt değildir: yönetici özelleştiriciyi
 * kaydedince `typography.fonts` yazılır. Aile adı katalogdan doğrulanır.
 */
export async function installFontAction(input: { family: string }): Promise<InstallFontResult> {
  const admin = await requireAdmin("themes.installFont");
  if (!catalogEntry(input.family)) return { ok: false, error: "Bu yazı tipi listede yok." };
  try {
    return { ok: true, font: await installGoogleFont(admin.siteId, input.family) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Yazı tipi indirilemedi." };
  }
}
