"use server";

import { revalidatePath } from "@/lib/cache";
import { getScopedRepository, getSiteIdentityRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

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
