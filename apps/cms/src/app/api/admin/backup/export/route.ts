import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { buildBackup } from "@/lib/backup";

export const runtime = "nodejs";

/** Kiracı yedeğini indirir (yönetici). `?media=1` özgün görselleri, `?personal=1` form gönderimleri ve yorumları ekler. */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const q = new URL(request.url).searchParams;
  const { bytes, manifest } = await buildBackup(auth.session.siteId, { media: q.get("media") === "1", personal: q.get("personal") === "1" });
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "backup.export", { detail: `${Object.values(manifest.tables).reduce((a, b) => a + b, 0)} satır, ${manifest.media.files} görsel${manifest.personal ? ", kişisel veri dahil" : ""}`, siteId: auth.session.siteId });
  const day = manifest.createdAt.slice(0, 10);
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="nexpress-${auth.session.siteId}-${day}.nxbackup"`, "Cache-Control": "no-store" },
  });
}
