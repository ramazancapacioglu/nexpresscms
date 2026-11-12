import { NextResponse } from "next/server";
import { DATA_PLUGIN_LIMITS } from "@nexpress/core";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { installDataPluginPackage } from "@/lib/data-plugin";

export const runtime = "nodejs";

/** `.nxplugin` yükleme: doğrular ve kurar (etkinleştirmez). Yanıt: doğrulama raporu ve izin özeti. */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, errors: ["Dosya seçilmedi."], warnings: [] }, { status: 400 });
  if (file.size > DATA_PLUGIN_LIMITS.zipBytes) return NextResponse.json({ ok: false, errors: [`Paket ${DATA_PLUGIN_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`], warnings: [] }, { status: 413 });
  const report = await installDataPluginPackage(auth.session.siteId, new Uint8Array(await file.arrayBuffer()));
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "plugins.upload", { detail: report.ok ? `${report.plugin.id}@${report.plugin.version} (${report.signature})` : `reddedildi: ${report.errors[0] ?? ""}`.slice(0, 200), siteId: auth.session.siteId });
  return NextResponse.json(report, { status: report.ok ? 200 : 422 });
}
