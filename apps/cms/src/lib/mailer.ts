import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { decryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";

export interface MailMessage {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export type MailResult = { ok: true } | { ok: false; error: string };

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** Ayarlardan (veya `SMTP_URL` ortam değişkeninden) taşıyıcı ve gönderen üretir; kapalı/eksikse null. */
export async function resolveMailer(siteId: string): Promise<{ transport: Transporter; from: string } | null> {
  const site = await getScopedRepository(siteId).getSite();
  const e = site?.settings.email;
  const fromEmail = e?.fromEmail || site?.settings.general.contactEmail || "";
  const fromName = oneLine(e?.fromName || site?.name || "");
  const from = fromEmail ? (fromName ? `"${fromName.replace(/"/g, "'")}" <${fromEmail}>` : fromEmail) : "";
  if (e?.enabled && e.host && from) {
    let pass = "";
    try {
      pass = e.password ? decryptSecret(e.password) : "";
    } catch {
      return null; // anahtar değişmiş: yeniden girilmeli
    }
    return { transport: nodemailer.createTransport({ host: e.host, port: e.port, secure: e.secure, auth: e.user ? { user: e.user, pass } : undefined, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000 }), from };
  }
  const url = process.env.SMTP_URL;
  if (url && from) return { transport: nodemailer.createTransport(url), from };
  return null;
}

export async function sendMail(siteId: string, msg: MailMessage): Promise<MailResult> {
  const m = await resolveMailer(siteId);
  if (!m) return { ok: false, error: "E-posta (SMTP) yapılandırılmamış." };
  if (msg.to.length === 0) return { ok: false, error: "Alıcı yok." };
  try {
    await m.transport.sendMail({ from: m.from, to: msg.to, subject: oneLine(msg.subject).slice(0, 200), text: msg.text, html: msg.html, replyTo: msg.replyTo });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: oneLine(err instanceof Error ? err.message : "Gönderilemedi").slice(0, 300) };
  } finally {
    m.transport.close();
  }
}
