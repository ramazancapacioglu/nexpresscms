import { NextResponse } from "next/server";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { exportCurrentDesign, exportUploaded, requireAdminApi } from "@/lib/theme-packages";

export const runtime = "nodejs";

const file = (bytes: Uint8Array, id: string) =>
  new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${id.replace(/[^a-z0-9-]/g, "")}.nxtheme"`,
      "Cache-Control": "no-store",
    },
  });

/** `?id=<yüklenen tema>` ya da `?current=1` (mevcut tasarım). */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const siteId = auth.session.siteId;
  if (url.searchParams.get("current") === "1") {
    const res = await exportCurrentDesign(siteId);
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 422 });
    await recordAudit({ id: auth.session.sub, email: auth.session.email }, "themes.export", { detail: `mevcut tasarım: ${res.id}`, siteId });
    return file(res.bytes, res.id);
  }
  const id = url.searchParams.get("id") ?? "";
  const theme = await getScopedRepository(siteId).getUploadedTheme(id);
  if (!theme) return NextResponse.json({ ok: false, error: "Tema bulunamadı." }, { status: 404 });
  try {
    const bytes = exportUploaded(theme);
    await recordAudit({ id: auth.session.sub, email: auth.session.email }, "themes.export", { detail: id, siteId });
    return file(bytes, id);
  } catch {
    return NextResponse.json({ ok: false, error: "Tema dışa aktarılamadı (kayıtlı veri paket biçimine uymuyor)." }, { status: 422 });
  }
}
