import { NextResponse } from "next/server";
import { getScopedRepository } from "@nexpress/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Yük dengeleyici / çalışma süresi izleyicisi için sağlık ucu. Kimlik doğrulama gerektirmez, bu yüzden yalnızca
 * "çalışıyor mu" bilgisini verir: sürüm, ortam, sunucu ayrıntısı, hata iletisi veya sır dönmez.
 * 200 = uygulama ve veritabanı yanıt veriyor, 503 = veritabanı yanıt vermiyor.
 */
export async function GET(request: Request) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  try {
    await getScopedRepository(siteId).getSite();
    return NextResponse.json({ status: "ok" }, { headers });
  } catch (error) {
    console.error("[health] veritabanı yanıt vermiyor:", error instanceof Error ? error.message : error);
    return NextResponse.json({ status: "degraded" }, { status: 503, headers });
  }
}
