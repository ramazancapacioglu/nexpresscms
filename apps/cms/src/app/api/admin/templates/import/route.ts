import { NextResponse, type NextRequest } from "next/server";
import { PACKAGE_LIMITS, parseTemplatePackage } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminApi } from "@/lib/admin-api";
import { recordAudit } from "@/lib/audit";
import { invalidateSite } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * Şablon paketi yükler (yönetici). Paket yalnızca veridir ve baştan doğrulanır; her şablon yeni kimlikli, TASLAK ve
 * varsayılan DEĞİL olarak eklenir (mevcut şablonlara dokunulmaz). Sonuç: oluşturulanlar + uyarılar.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  if (Number(request.headers.get("content-length") ?? 0) > PACKAGE_LIMITS.bytes + 64 * 1024) return NextResponse.json({ ok: false, errors: ["Dosya 2 MB sınırını aşıyor."] }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, errors: ["Dosya bulunamadı."] }, { status: 400 });
  const parsed = parseTemplatePackage(await file.text());
  if (!parsed.ok) return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 422 });

  const { siteId, sub, email } = { siteId: auth.session.siteId, sub: auth.session.sub, email: auth.session.email };
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  const existing = new Set((await repo.listContents({ locale, type: "template" })).map((c) => c.title));
  const created: Array<{ id: string; name: string; kind: string }> = [];
  for (const t of parsed.items) {
    let name = t.name;
    for (let n = 2; existing.has(name); n++) name = `${t.name} (${n})`;
    existing.add(name);
    const suffix = Math.random().toString(36).slice(2, 8);
    const res = await repo.saveContent({
      actor: { id: sub, email },
      type: "template",
      status: "draft",
      importanceScore: 1,
      schemaType: "WebPage",
      schemaAttributes: { template: { kind: t.kind, isDefault: false } },
      locale,
      region: "TR",
      slug: `tpl-${suffix}`,
      title: name,
      tldr: t.description,
      blocks: t.blocks,
    } as never);
    created.push({ id: res.contentId, name, kind: t.kind });
  }
  await invalidateSite(siteId);
  await recordAudit({ id: sub, email }, "template.import", { detail: `${created.length} şablon${parsed.source ? ` (kaynak: ${parsed.source})` : ""}${parsed.warnings.length ? `, ${parsed.warnings.length} uyarı` : ""}`, siteId });
  return NextResponse.json({ ok: true, created, warnings: parsed.warnings, source: parsed.source }, { headers: { "Cache-Control": "no-store" } });
}
