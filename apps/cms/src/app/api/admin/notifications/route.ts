import { NextResponse } from "next/server";
import { getNotificationRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Zil için: okunmamış sayısı + en yeni bildirimler (oturumlu her panel kullanıcısı; kitleye göre süzülür). */
export async function GET() {
  const s = await getSession();
  if (!s) return json({ ok: false, error: "Oturum gerekli." }, 401);
  const repo = getNotificationRepository(s.siteId);
  const [unread, items] = await Promise.all([repo.unread(s.sub, s.role), repo.list(s.sub, s.role, { limit: 8 })]);
  return json({ ok: true, unread, items });
}

/** `{ action: "read", ids }` veya `{ action: "readAll" }`. Çapraz kaynak istekleri reddedilir. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return json({ ok: false, error: "Çapraz kaynak isteği reddedildi." }, 403);
  const s = await getSession();
  if (!s) return json({ ok: false, error: "Oturum gerekli." }, 401);
  const body = (await request.json().catch(() => null)) as { action?: string; ids?: unknown } | null;
  const repo = getNotificationRepository(s.siteId);
  if (body?.action === "readAll") return json({ ok: true, changed: await repo.markAllRead(s.sub, s.role) });
  if (body?.action === "read" && Array.isArray(body.ids)) return json({ ok: true, changed: await repo.markRead(s.sub, body.ids.filter((i): i is string => typeof i === "string")) });
  return json({ ok: false, error: "Geçersiz istek." }, 400);
}
