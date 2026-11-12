"use server";

import { getThemeManifest } from "@nexpress/themes";
import { resolveSiteSettings, sanitizeCookieConsent, type CookieConsentSettings, type LocalizedSiteIdentity } from "@nexpress/core";
import { revalidatePath } from "@/lib/cache";
import { getScopedRepository, getSiteIdentityRepository, getSiteResetRepository, type ContentWipe } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { removeAsset } from "@/lib/media/storage";

export type SettingsResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("tr-TR", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function saveSettingsAction(input: {
  name: string;
  tagline: string;
  contactEmail: string;
  timezone: string;
}): Promise<SettingsResult> {
  const admin = await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Site adı boş olamaz." };
  if (name.length > 80) return { ok: false, error: "Site adı en çok 80 karakter olabilir." };
  if (input.tagline.length > 160) return { ok: false, error: "Slogan en çok 160 karakter olabilir." };
  const contactEmail = input.contactEmail.trim();
  if (contactEmail && !EMAIL_RE.test(contactEmail)) return { ok: false, error: "İletişim e-postası geçersiz." };
  if (!isTimezone(input.timezone)) return { ok: false, error: "Geçersiz saat dilimi." };

  await getSiteIdentityRepository(admin.siteId).update({ name, tagline: input.tagline });
  await getScopedRepository(admin.siteId).saveSiteSettings({ general: { contactEmail, timezone: input.timezone } });
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.saved", { detail: `site adı: ${name}` });
  await revalidatePath("/admin/settings");
  await revalidatePath("/tr");
  return { ok: true };
}

/** İkincil diller için site adı, slogan ve SEO başlık şablonunu kaydeder. */
export async function saveLocalizedIdentitiesAction(input: {
  locales: Record<string, LocalizedSiteIdentity>;
}): Promise<SettingsResult> {
  const admin = await requireAdmin("settings.locales");
  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const currentGeneral = resolveSiteSettings(site?.settings).general;
  const cleaned: Record<string, LocalizedSiteIdentity> = {};
  for (const [code, val] of Object.entries(input.locales ?? {})) {
    const key = code.trim().toLowerCase().slice(0, 12);
    if (!key) continue;
    cleaned[key] = {
      name: (val.name ?? "").trim().slice(0, 80),
      tagline: (val.tagline ?? "").trim().slice(0, 160),
      titleTemplate: (val.titleTemplate ?? "").trim().slice(0, 120),
      homeTitleTemplate: (val.homeTitleTemplate ?? "").trim().slice(0, 120),
    };
  }
  await repo.saveSiteSettings({
    general: { ...currentGeneral, locales: cleaned },
  });
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.locales", {
    detail: `dil kimlikleri güncellendi (${Object.keys(cleaned).join(", ") || "varsayılan"})`,
  });
  await revalidatePath("/admin/settings");
  await revalidatePath("/tr", "layout");
  return { ok: true };
}

const CONTENT_PHRASE = "SIFIRLA";
const DESIGN_PHRASE = "TASARIM";

export async function saveMaintenanceAction(input: { enabled: boolean; message: string }): Promise<SettingsResult> {
  const admin = await requireAdmin();
  const message = input.message.replace(/\s+/g, " ").trim().slice(0, 400);
  await getScopedRepository(admin.siteId).saveSiteSettings({
    general: { maintenanceEnabled: input.enabled === true, maintenanceMessage: message },
  });
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.maintenance", {
    detail: input.enabled ? "bakım açık" : "bakım kapalı",
  });
  await revalidatePath("/admin/settings");
  await revalidatePath("/tr", "layout");
  return { ok: true };
}

/** Çerez onayı bannerı ve betik kapısı. Politika bağlantısı yalnızca site içi yol ya da https olabilir. */
export async function saveCookieConsentAction(input: CookieConsentSettings): Promise<SettingsResult> {
  const admin = await requireAdmin("settings.cookieConsent");
  const cookieConsent = sanitizeCookieConsent(input);
  if (input.policyHref?.trim() && !cookieConsent.policyHref) return { ok: false, error: "Politika adresi / ile başlayan bir yol ya da https adresi olmalı." };
  await getScopedRepository(admin.siteId).saveSiteSettings({ general: { cookieConsent } });
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.cookieConsent", { detail: cookieConsent.enabled ? "çerez onayı açık" : "çerez onayı kapalı" });
  await revalidatePath("/admin/settings");
  await revalidatePath("/tr", "layout");
  return { ok: true };
}

/** Sayfa, medya veya şablon hariç tüm içerik. Onay sözcüğü yoksa hiçbir kayıt silinmez. */
export async function wipeContentAction(input: { kind: ContentWipe; phrase: string }): Promise<SettingsResult & { detail?: string }> {
  const admin = await requireAdmin();
  if (input.phrase.trim() !== CONTENT_PHRASE) return { ok: false, error: `Onay için ${CONTENT_PHRASE} yazın. Hiçbir kayıt silinmedi.` };
  if (input.kind !== "pages" && input.kind !== "media" && input.kind !== "everything") {
    return { ok: false, error: "Sıfırlama türü seçilmedi." };
  }
  const wiped = await getSiteResetRepository(admin.siteId).wipeContent(input.kind);
  for (const id of wiped.mediaIds) {
    try {
      await removeAsset(admin.siteId, id);
    } catch {
      // Kayıt silindi; eksik dosya sıfırlamayı durdurmaz.
    }
  }
  const detail = `${wiped.contents} içerik, ${wiped.mediaIds.length} medya`;
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.wipe.content", { target: input.kind, detail });
  await revalidatePath("/tr", "layout");
  return { ok: true, detail };
}

/** Şablon, tasarım kütüphanesi ve yüklenen temalar. Sayfa ve medya bu kapıda silinmez. */
export async function wipeDesignAction(input: { phrase: string }): Promise<SettingsResult & { detail?: string }> {
  const admin = await requireAdmin();
  if (input.phrase.trim() !== DESIGN_PHRASE) return { ok: false, error: `Onay için ${DESIGN_PHRASE} yazın. Hiçbir kayıt silinmedi.` };
  const reset = getSiteResetRepository(admin.siteId);
  const wiped = await reset.wipeDesign();
  let themes = wiped.themes;
  if (wiped.activeUploaded) {
    const theme = getThemeManifest("corporate-aurora");
    await getScopedRepository(admin.siteId).activateTheme(theme.id, theme.tokens);
    themes = await reset.deleteUploadedThemes();
  }
  const detail = `${wiped.templates} şablon, ${wiped.designs} kütüphane, ${themes} tema`;
  await recordAudit({ id: admin.sub, email: admin.email }, "settings.wipe.design", { detail });
  await revalidatePath("/tr", "layout");
  return { ok: true, detail };
}
