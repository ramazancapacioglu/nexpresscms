import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@nexpress/core/password";
import { runScheduler } from "@/lib/scheduler";

export const runtime = "nodejs";

/**
 * Dış zamanlayıcı (cron) için kesin tetikleyici: `Authorization: Bearer $CRON_SECRET`.
 * `CRON_SECRET` tanımlı değilse uç nokta kapalıdır (404); yanlış anahtar 401.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new NextResponse("Bulunamadı.\n", { status: 404 });
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!given || !safeEqual(given, secret)) return NextResponse.json({ ok: false }, { status: 401 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const result = await runScheduler(siteId, true);
  return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
