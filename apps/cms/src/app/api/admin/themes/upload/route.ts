import { NextResponse } from "next/server";
import { PACKAGE_LIMITS } from "@nexpress/themes/package";
import { recordAudit } from "@/lib/audit";
import { installThemePackage, requireAdminApi } from "@/lib/theme-packages";

export const runtime = "nodejs";

/** `.nxtheme` yükleme: doğrular ve kurar (etkinleştirmez). Yanıt: doğrulama raporu. */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, errors: ["Dosya seçilmedi."], warnings: [] }, { status: 400 });
  if (file.size > PACKAGE_LIMITS.zipBytes) return NextResponse.json({ ok: false, errors: [`Paket ${PACKAGE_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`], warnings: [] }, { status: 413 });
  const report = await installThemePackage(auth.session.siteId, new Uint8Array(await file.arrayBuffer()));
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "themes.upload", { detail: report.ok ? `${report.theme.id}@${report.theme.version}` : `reddedildi: ${report.errors[0] ?? ""}`.slice(0, 200), siteId: auth.session.siteId });
  return NextResponse.json(report, { status: report.ok ? 200 : 422 });
}
