import { NextResponse, type NextRequest } from "next/server";
import { normalizeMemberEmail, resolveSiteIdFromHost, safeMemberNext } from "@nexpress/core";
import { newMemberId } from "@nexpress/core/member-token";
import { getMemberRepository } from "@nexpress/database";
import { siteLocaleBase } from "@/lib/locale-url";
import { getMembership, mailerReady, sameOriginPost, sendMemberLink } from "@/lib/members";
import { createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const perEmail = createRateLimiter(5, 60 * 60 * 1000);
const perIp = createRateLimiter(30, 60 * 60 * 1000);

/**
 * Giriş/kayıt bağlantısı iste (JS'siz form). Hesap varlığı sızmaz: sonuç her durumda aynı "gönderildi" sayfasıdır
 * (yalnızca biçim, onay, sınır, kapalı üyelik ve e-posta yapılandırması hataları ayrıca bildirilir; bunlar hesaba bağlı değildir).
 */
export async function POST(request: NextRequest) {
  if (!sameOriginPost(request)) return new NextResponse("Geçersiz köken.", { status: 403 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const locale = String(form.get("locale") ?? "tr").trim().slice(0, 12) || "tr";
  const next = safeMemberNext(form.get("next"), "/");
  const lb = await siteLocaleBase(siteId, locale);
  const back = (params: Record<string, string>) => {
    const url = new URL(`${lb}/uye/giris`, request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  };

  const membership = await getMembership(siteId);
  if (membership.mode === "closed") return back({ e: "closed" });
  const email = normalizeMemberEmail(form.get("email"));
  if (!email) return back({ e: "email" });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!perIp.take(`${siteId}:${ip}`) || !perEmail.take(`${siteId}:${email}`)) return back({ e: "rate" });
  if (!(await mailerReady(siteId))) return back({ e: "mail" });

  const repo = getMemberRepository(siteId);
  let member = await repo.findByEmail(email);
  if (!member && membership.mode === "open") {
    // Yeni kayıt: aydınlatma onayı şart; hesap e-posta doğrulanana kadar `pending` kalır
    if (form.get("consent") !== "1") return back({ e: "consent" });
    member = await repo.create({ id: newMemberId(), email, name: String(form.get("name") ?? "").replace(/\s+/g, " ").trim().slice(0, 80), status: "pending", consent: true }).catch(() => repo.findByEmail(email));
  }
  if (member && member.status !== "disabled") await sendMemberLink({ siteId, member, locale, next });
  return back({ sent: "1" });
}
