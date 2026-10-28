import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/auth/session";

/** Rota işleyicileri için yönetici denetimi: oturum yoksa 401, yönetici değilse 403, çapraz kaynak isteği 403. */
export async function requireAdminApi(request: Request): Promise<{ session: SessionUser } | { response: NextResponse }> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (request.method !== "GET" && origin && host && new URL(origin).host !== host) {
    return { response: NextResponse.json({ ok: false, error: "Çapraz kaynak isteği reddedildi." }, { status: 403 }) };
  }
  const session = await getSession();
  if (!session) return { response: NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 }) };
  if (session.role !== "admin") return { response: NextResponse.json({ ok: false, error: "Yalnızca yönetici." }, { status: 403 }) };
  return { session };
}
