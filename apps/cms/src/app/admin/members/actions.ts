"use server";

import { normalizeMemberEmail, resolveSiteSettings, sanitizeMembership, type MembershipSettings } from "@nexpress/core";
import { newMemberId } from "@nexpress/core/member-token";
import { getMemberRepository, getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { mailerReady, sendMemberLink } from "@/lib/members";

type Result = { ok: true; message?: string } | { ok: false; error: string };

export async function saveMembershipSettingsAction(input: Partial<MembershipSettings>): Promise<Result> {
  const admin = await requireAdmin("members.saveSettings");
  const next = sanitizeMembership(input);
  if (next.mode !== "closed" && !(await mailerReady(admin.siteId))) {
    return { ok: false, error: "Üyeliği açmadan önce e-posta gönderimini kurun (Ayarlar › E-posta). Giriş bağlantıları e-postayla gider." };
  }
  if (input.privacyUrl && !next.privacyUrl) return { ok: false, error: "Aydınlatma adresi https:// ile başlamalı ya da /yol olmalı." };
  await getScopedRepository(admin.siteId).saveSiteSettings({ general: { membership: next } });
  await recordAudit({ id: admin.sub, email: admin.email }, "members.saveSettings", { detail: `mod: ${next.mode}` });
  await invalidateSite(admin.siteId);
  await revalidatePath("/admin/members");
  return { ok: true, message: "Kaydedildi." };
}

/** Yönetici üye davet eder: hesap açılır (`pending`) ve giriş bağlantısı e-postayla gider. Mevcut hesap varsa yalnızca yeni bağlantı gönderilir. */
export async function inviteMemberAction(input: { email: string; name?: string }): Promise<Result> {
  const admin = await requireAdmin("members.invite");
  const email = normalizeMemberEmail(input.email);
  if (!email) return { ok: false, error: "Geçerli bir e-posta girin." };
  if (!(await mailerReady(admin.siteId))) return { ok: false, error: "E-posta gönderimi kurulu değil (Ayarlar › E-posta)." };
  const repo = getMemberRepository(admin.siteId);
  let member = await repo.findByEmail(email);
  if (member?.status === "disabled") return { ok: false, error: "Bu üye devre dışı; önce etkinleştirin." };
  if (!member) member = await repo.create({ id: newMemberId(), email, name: input.name ?? "", status: "pending", consent: false });
  const site = await getScopedRepository(admin.siteId).getSite();
  const res = await sendMemberLink({ siteId: admin.siteId, member, locale: site?.defaultLocale ?? "tr", next: "/" });
  await recordAudit({ id: admin.sub, email: admin.email }, "members.invite", { target: email });
  await revalidatePath("/admin/members");
  return res.ok ? { ok: true, message: "Davet gönderildi." } : { ok: false, error: `E-posta gönderilemedi: ${res.error}` };
}

export async function setMemberStatusAction(input: { id: string; status: "active" | "disabled" }): Promise<Result> {
  const admin = await requireAdmin("members.setStatus");
  if (input.status !== "active" && input.status !== "disabled") return { ok: false, error: "Geçersiz durum." };
  const repo = getMemberRepository(admin.siteId);
  const member = await repo.findById(input.id);
  if (!member) return { ok: false, error: "Üye bulunamadı." };
  // Doğrulanmamış (pending) hesap yönetici tarafından doğrudan etkinleştirilemez: e-posta sahipliği bağlantıyla kanıtlanır
  if (input.status === "active" && !member.emailVerifiedAt) return { ok: false, error: "E-postası doğrulanmamış üye etkinleştirilemez; davet bağlantısı gönderin." };
  await repo.setStatus(member.id, input.status);
  await recordAudit({ id: admin.sub, email: admin.email }, input.status === "disabled" ? "members.disable" : "members.enable", { target: member.email });
  await revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMemberAction(input: { id: string }): Promise<Result> {
  const admin = await requireAdmin("members.delete");
  const repo = getMemberRepository(admin.siteId);
  const member = await repo.findById(input.id);
  if (!member) return { ok: false, error: "Üye bulunamadı." };
  await repo.delete(member.id);
  await recordAudit({ id: admin.sub, email: admin.email }, "members.delete", { target: member.email });
  await revalidatePath("/admin/members");
  return { ok: true };
}

export const currentMembership = async (siteId: string): Promise<MembershipSettings> =>
  resolveSiteSettings((await getScopedRepository(siteId).getSite())?.settings).general.membership ?? { mode: "closed", privacyUrl: "" };
