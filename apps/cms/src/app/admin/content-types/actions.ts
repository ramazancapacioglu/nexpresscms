"use server";

import { resolveSiteSettings, sanitizeContentTypes, type CustomContentType } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";

export type SaveTypesResult = { ok: true; types: CustomContentType[] } | { ok: false; error: string };

/**
 * Özel içerik türü tanımlarını yazar (yalnızca yönetici). Tanım sunucuda yeniden temizlenir. Kayıtlı içeriği olan bir tür
 * silinemez (içerik sahipsiz kalmasın); önce içerikleri silin ya da taşıyın. Alan anahtarı kaydedilmiş içerikte kullanılıyorsa
 * silinen alanın değeri yayında artık gösterilmez ama içerikte kalır (yeniden eklenirse geri gelir).
 */
export async function saveContentTypesAction(input: { types: CustomContentType[] }): Promise<SaveTypesResult> {
  const admin = await requireAdmin("contentTypes.save");
  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const next = sanitizeContentTypes(input.types);
  const current = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
  if (Array.isArray(input.types) && input.types.length > 0 && next.length < Math.min(input.types.length, 12)) {
    return { ok: false, error: "Bazı türler geçersiz: kimlik küçük harf/rakam/alt çizgi olmalı, ad boş olamaz, yerleşik tür adları kullanılamaz, seçenek listesi boş olamaz." };
  }
  for (const old of current) {
    if (next.some((t) => t.id === old.id)) continue;
    const used = await repo.listContents({ locale, type: old.id });
    if (used.length > 0) return { ok: false, error: `“${old.label}” türünde ${used.length} içerik var; önce içerikleri silin.` };
  }
  await repo.saveSiteSettings({ general: { contentTypes: next } });
  await recordAudit({ id: admin.sub, email: admin.email }, "contentTypes.save", { detail: next.map((t) => `${t.id}(${t.fields.length})`).join(", ") || "tür yok" });
  await revalidatePath("/admin/content-types");
  await revalidatePath("/sitemap.xml");
  return { ok: true, types: next };
}
