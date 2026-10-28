import "server-only";
import type { FormDefinitionDto } from "@nexpress/database";
import { getFormSubmissionRepository, getScopedRepository } from "@nexpress/database";
import type { SubmittedValue } from "@nexpress/core";
import { sendMail } from "./mailer";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(form|site)\}/g, (_, k: string) => vars[k] ?? "");

/**
 * Gönderimden sonra e-posta bildirimi: (1) yöneticiye değerler (Yanıtla = ziyaretçinin e-postası),
 * (2) isteğe bağlı otomatik yanıt. Sonuç `form_submissions.notify_status` alanına yazılır; hata gönderimi etkilemez.
 */
export async function notifySubmission(input: { siteId: string; form: FormDefinitionDto; submissionId: string; values: SubmittedValue[]; pagePath: string; status: "new" | "spam" }): Promise<void> {
  const { siteId, form, submissionId, values } = input;
  const repo = getFormSubmissionRepository(siteId);
  const n = form.notify;
  if (input.status === "spam" || (!n.enabled && !n.autoReply.enabled)) return void (await repo.setNotify(submissionId, "skipped"));
  const site = await getScopedRepository(siteId).getSite();
  const vars = { form: form.name, site: site?.name ?? "" };
  const submitterEmail = values.find((v) => v.name === n.autoReply.emailField && v.type === "email")?.value;
  const errors: string[] = [];
  let sent = 0;

  if (n.enabled) {
    const to = n.to.length ? n.to : site?.settings.general.contactEmail ? [site.settings.general.contactEmail] : [];
    const text = [`${form.name}`, `Sayfa: ${input.pagePath}`, "", ...values.map((v) => `${v.label}: ${v.value}`)].join("\n");
    const html = `<h2>${esc(form.name)}</h2><p>Sayfa: ${esc(input.pagePath)}</p><table cellpadding="6" style="border-collapse:collapse">${values
      .map((v) => `<tr><td style="border-bottom:1px solid #e5e7eb;color:#6b7280;vertical-align:top">${esc(v.label)}</td><td style="border-bottom:1px solid #e5e7eb;white-space:pre-wrap">${esc(v.value)}</td></tr>`)
      .join("")}</table>`;
    const r = await sendMail(siteId, { to, subject: fill(n.subject, vars), text, html, replyTo: submitterEmail });
    if (r.ok) sent++;
    else errors.push(r.error);
  }
  if (n.autoReply.enabled && submitterEmail) {
    const body = n.autoReply.body;
    const r = await sendMail(siteId, { to: [submitterEmail], subject: fill(n.autoReply.subject, vars), text: body, html: `<p style="white-space:pre-wrap">${esc(body)}</p>` });
    if (r.ok) sent++;
    else errors.push(r.error);
  }
  await repo.setNotify(submissionId, errors.length ? "failed" : sent ? "sent" : "skipped", errors.join(" · "));
}
