"use server";

import { DEFAULT_FORM_FIELDS, getFormTemplate, normalizeFormSpec, normalizeNotify } from "@nexpress/core";
import { encryptSecret } from "@nexpress/core/secret-box";
import { FORM_DEFINITION_STATUSES, getFormDefinitionRepository, getFormSubmissionRepository, getScopedRepository, type FormDefinitionStatus, type FormStatus } from "@nexpress/database";
import { sendMail } from "@/lib/mailer";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";

const STATUSES: FormStatus[] = ["new", "read", "spam", "archived"];

/** Gelen kutusu durumunu değiştirir (editörler de okuyup işaretleyebilir). */
export async function setSubmissionStatusAction(input: { ids: string[]; status: FormStatus }): Promise<{ ok: boolean; affected: number }> {
  const me = await requireUser({ audit: "forms.status" });
  if (!STATUSES.includes(input.status)) return { ok: false, affected: 0 };
  const n = await getFormSubmissionRepository(me.siteId).setStatus(input.ids.slice(0, 200), input.status);
  await revalidatePath("/admin/forms/inbox");
  return { ok: true, affected: n };
}

/** Kalıcı silme: kişisel veri içerdiği için yalnızca yönetici. */
export async function deleteSubmissionsAction(input: { ids: string[] }): Promise<{ ok: boolean; affected: number }> {
  const me = await requireAdmin("forms.delete");
  const n = await getFormSubmissionRepository(me.siteId).remove(input.ids.slice(0, 200));
  await recordAudit({ id: me.sub, email: me.email }, "forms.delete", { detail: `${n} gönderim silindi` });
  await revalidatePath("/admin/forms/inbox");
  return { ok: true, affected: n };
}

/* ─────────── Form tanımları (kurucu) ─────────── */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function refreshForms(siteId: string) {
  await invalidateSite(siteId); // ziyaretçi sayfaları bağlı formu önbellekten okur
  await revalidatePath("/admin/forms");
}

export async function createFormAction(input: { templateId?: string; name?: string }): Promise<Result<{ id: string }>> {
  const me = await requireUser({ audit: "forms.create" });
  const tpl = input.templateId ? getFormTemplate(input.templateId) : null;
  if (input.templateId && !tpl) return { ok: false, error: "Şablon bulunamadı." };
  const created = await getFormDefinitionRepository(me.siteId).create({
    name: input.name?.trim() || tpl?.name || "Yeni form",
    templateId: tpl?.id ?? null,
    spec: tpl?.spec ?? { fields: DEFAULT_FORM_FIELDS, submitLabel: "Gönder" },
    notify: tpl?.notify,
  });
  await recordAudit({ id: me.sub, email: me.email }, "forms.create", { detail: created.name });
  await refreshForms(me.siteId);
  return { ok: true, id: created.id };
}

export async function saveFormAction(input: { id: string; name: string; status: FormDefinitionStatus; spec: unknown; notify: unknown }): Promise<Result<{ updatedAt: string }>> {
  const me = await requireUser({ audit: "forms.save" });
  if (!input.name.trim()) return { ok: false, error: "Form adı boş olamaz." };
  if (!FORM_DEFINITION_STATUSES.includes(input.status)) return { ok: false, error: "Geçersiz durum." };
  if (JSON.stringify(input.spec).length > 200_000) return { ok: false, error: "Form çok büyük." };
  const askedHook = (input.notify && typeof input.notify === "object" && (input.notify as { webhook?: { enabled?: boolean } }).webhook?.enabled) === true;
  const cleanNotify = normalizeNotify(input.notify, normalizeFormSpec(input.spec).fields);
  if (askedHook && !cleanNotify.webhook.enabled) return { ok: false, error: "Webhook adresi https olmalı; kullanıcı adı, özel ağ ve ham IP kabul edilmez." };
  const saved = await getFormDefinitionRepository(me.siteId).update(input.id, { name: input.name, status: input.status, spec: input.spec, notify: input.notify });
  if (!saved) return { ok: false, error: "Form bulunamadı." };
  if (saved.notify.enabled && saved.notify.to.length === 0 && !(await getScopedRepository(me.siteId).getSite())?.settings.general.contactEmail) {
    return { ok: false, error: "Bildirim açık ama alıcı yok: bir alıcı ekleyin ya da Ayarlar'da iletişim e-postası girin." };
  }
  await refreshForms(me.siteId);
  return { ok: true, updatedAt: saved.updatedAt.toISOString() };
}

export async function duplicateFormAction(input: { id: string }): Promise<Result<{ id: string }>> {
  const me = await requireUser({ audit: "forms.duplicate" });
  const repo = getFormDefinitionRepository(me.siteId);
  const src = await repo.get(input.id);
  if (!src) return { ok: false, error: "Form bulunamadı." };
  const copy = await repo.create({ name: `${src.name} (kopya)`, templateId: src.templateId, spec: src.spec, notify: src.notify, status: "paused" });
  await refreshForms(me.siteId);
  return { ok: true, id: copy.id };
}

export async function setFormStatusAction(input: { id: string; status: FormDefinitionStatus }): Promise<Result> {
  const me = await requireUser({ audit: "forms.status-change" });
  if (!FORM_DEFINITION_STATUSES.includes(input.status)) return { ok: false, error: "Geçersiz durum." };
  const ok = await getFormDefinitionRepository(me.siteId).setStatus(input.id, input.status);
  await refreshForms(me.siteId);
  return ok ? { ok: true } : { ok: false, error: "Form bulunamadı." };
}

/** Form tanımını siler (gönderimler kalır; bağlı bloklar boş görünür). Yalnızca yönetici. */
export async function deleteFormAction(input: { id: string }): Promise<Result> {
  const me = await requireAdmin("forms.delete-definition");
  const ok = await getFormDefinitionRepository(me.siteId).remove(input.id);
  await recordAudit({ id: me.sub, email: me.email }, "forms.delete-definition", { detail: input.id });
  await refreshForms(me.siteId);
  return ok ? { ok: true } : { ok: false, error: "Form bulunamadı." };
}

/* ─────────── E-posta (SMTP) ─────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function saveEmailSettingsAction(input: { enabled: boolean; host: string; port: number; secure: boolean; user: string; password: string; fromName: string; fromEmail: string }): Promise<Result> {
  const me = await requireAdmin("forms.email-settings");
  const host = input.host.trim();
  if (input.enabled && !host) return { ok: false, error: "SMTP sunucusu gerekli." };
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) return { ok: false, error: "Bağlantı noktası 1–65535 olmalı." };
  if (input.fromEmail.trim() && !EMAIL_RE.test(input.fromEmail.trim())) return { ok: false, error: "Gönderen e-postası geçersiz." };
  if (input.enabled && !input.fromEmail.trim()) return { ok: false, error: "Gönderen e-postası gerekli." };
  const repo = getScopedRepository(me.siteId);
  const current = (await repo.getSite())?.settings.email;
  // Boş bırakılan parola mevcut olanı korur
  const password = input.password ? encryptSecret(input.password) : current?.password ?? "";
  await repo.saveSiteSettings({ email: { enabled: input.enabled, host, port: input.port, secure: input.secure, user: input.user.trim(), password, fromName: input.fromName.trim().slice(0, 80), fromEmail: input.fromEmail.trim() } });
  await recordAudit({ id: me.sub, email: me.email }, "forms.email-settings", { detail: input.enabled ? `SMTP açık: ${host}:${input.port}` : "SMTP kapalı" });
  await revalidatePath("/admin/forms/email");
  return { ok: true };
}

export async function sendTestEmailAction(input: { to: string }): Promise<Result> {
  const me = await requireAdmin("forms.email-test");
  const to = input.to.trim();
  if (!EMAIL_RE.test(to)) return { ok: false, error: "Geçerli bir e-posta girin." };
  const r = await sendMail(me.siteId, { to: [to], subject: "NexPress test e-postası", text: "E-posta ayarlarınız çalışıyor." });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
