import { NextResponse } from "next/server";
import { buildTemplatePackage, readTemplateMeta, TEMPLATE_KINDS } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminApi } from "@/lib/admin-api";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Şablon paketi indirir (yönetici): `?id=<şablon>` tek şablon, `?all=1` hepsi. Yerel medya başvuruları taşınabilirlik için boşaltılır. */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const q = new URL(request.url).searchParams;
  const repo = getScopedRepository(auth.session.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const all = await repo.listContents({ locale, type: "template" });
  const wanted = q.get("all") === "1" ? all : all.filter((c) => c.contentId === q.get("id"));
  const items = wanted.flatMap((c) => {
    const meta = readTemplateMeta(c.schemaAttributes);
    return meta ? [{ name: c.title, description: c.tldr ?? TEMPLATE_KINDS[meta.kind].description, kind: meta.kind, blocks: c.blocks }] : [];
  });
  if (items.length === 0) return NextResponse.json({ ok: false, error: "Dışa aktarılacak şablon bulunamadı." }, { status: 404 });
  const { json, report } = buildTemplatePackage(items, { source: site?.name ?? "NexPress" });
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "template.export", { detail: `${items.length} şablon${report.removedMedia ? `, ${report.removedMedia} medya başvurusu boşaltıldı` : ""}`, siteId: auth.session.siteId });
  const name = items.length === 1 ? items[0]!.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sablon" : "sablonlar";
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.nxtemplates.json"`,
      "Cache-Control": "no-store",
      "X-NexPress-Removed-Media": String(report.removedMedia),
    },
  });
}
