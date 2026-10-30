import "server-only";
import { createAccountToken, isTokenCurrent, verifyAccountToken, type AccountTokenPurpose } from "@nexpress/core/account-token";
import { getScopedRepository, getUserRepository } from "@nexpress/database";
import { getAuthSecret } from "@/lib/auth/config";
import { sendMail, type MailResult } from "@/lib/mailer";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Kullanıcının GÜNCEL parola zamanına bağlı bağlantı üretir (depodan okunur; bellekteki kopya kullanılmaz). */
export async function buildAccountLink(siteId: string, userId: string, purpose: AccountTokenPurpose): Promise<string | null> {
  const user = await getUserRepository(siteId).findById(userId);
  if (!user) return null;
  const token = createAccountToken(getAuthSecret(), siteId, purpose, user);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/reset-password?t=${encodeURIComponent(token)}`;
}

/** Davet veya sıfırlama e-postası gönderir; SMTP yoksa `{ ok:false }` döner ve çağıran bağlantıyı yöneticiye verir. */
export async function sendAccountMail(siteId: string, userId: string, purpose: AccountTokenPurpose): Promise<MailResult & { link?: string }> {
  const user = await getUserRepository(siteId).findById(userId);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };
  const link = await buildAccountLink(siteId, userId, purpose);
  if (!link) return { ok: false, error: "Bağlantı üretilemedi." };
  const site = await getScopedRepository(siteId).getSite();
  const siteName = site?.name || "NexPress";
  const invite = purpose === "invite";
  const subject = invite ? `${siteName} yönetim paneline davet edildiniz` : `${siteName} parola sıfırlama`;
  const ttl = invite ? "7 gün" : "1 saat";
  const intro = invite ? `${siteName} yönetim paneli için hesabınız açıldı. Parolanızı belirleyip giriş yapmak için bağlantıyı kullanın.` : `${siteName} hesabınız için parola sıfırlama istendi. Yeni parola belirlemek için bağlantıyı kullanın.`;
  const outro = invite ? "" : "Bu isteği siz yapmadıysanız bu e-postayı yok sayın; parolanız değişmez.";
  const text = `Merhaba ${user.name || ""},\n\n${intro}\n\n${link}\n\nBağlantı ${ttl} geçerlidir ve yalnızca bir kez kullanılabilir.\n${outro}`.trim();
  const html = `<p>Merhaba ${esc(user.name || "")},</p><p>${esc(intro)}</p><p><a href="${esc(link)}">${invite ? "Parolamı belirle" : "Parolamı sıfırla"}</a></p><p>Bağlantı ${ttl} geçerlidir ve yalnızca bir kez kullanılabilir.${outro ? `<br>${esc(outro)}` : ""}</p>`;
  const res = await sendMail(siteId, { to: [user.email], subject, text, html });
  return res.ok ? res : { ...res, link };
}

/** Belirteçten kullanıcıyı çözer; imza, süre, tek kullanım (parola zamanı), etkin hesap denetlenir. */
export async function resolveAccountToken(siteId: string, token: string) {
  const parsed = verifyAccountToken(getAuthSecret(), siteId, token);
  if (!parsed) return null;
  const user = await getUserRepository(siteId).findById(parsed.userId);
  if (!user || user.status !== "active" || !isTokenCurrent(parsed, user)) return null;
  return { user, purpose: parsed.purpose };
}
