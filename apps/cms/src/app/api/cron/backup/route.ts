import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@nexpress/core/password";
import { recordAudit } from "@/lib/audit";
import { runScheduledBackup } from "@/lib/backup-schedule";

export const runtime = "nodejs";

/**
 * Zamanlanmış yedek: `Authorization: Bearer $CRON_SECRET` ile çağrılır (günde bir önerilir). Yedek `BACKUP_DIR`
 * klasörüne yazılır, en yeni `BACKUP_KEEP` (varsayılan 7) dosya tutulur. `?media=1` görsel özgünlerini ekler.
 * Kişisel veri (form gönderimleri/yorumlar) bu yola GİRMEZ. `CRON_SECRET` yoksa uç kapalıdır (404).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new NextResponse("Bulunamadı.\n", { status: 404 });
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!given || !safeEqual(given, secret)) return NextResponse.json({ ok: false }, { status: 401 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  try {
    const keep = Number(process.env.BACKUP_KEEP) || undefined;
    const result = await runScheduledBackup(siteId, { media: request.nextUrl.searchParams.get("media") === "1", keep });
    await recordAudit(null, "backup.scheduled", { siteId, detail: `${result.file} (${Math.round(result.bytes / 1024)} KB), ${result.kept} yedek tutuluyor` });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[backup] zamanlanmış yedek başarısız:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Yedek alınamadı." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
