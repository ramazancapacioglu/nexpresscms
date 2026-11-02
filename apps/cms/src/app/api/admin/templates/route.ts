import { NextResponse } from "next/server";
import { readTemplateMeta } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Şablon seçicileri için şablon listesi (kimlik, ad, tür, varsayılan mı). Yönetici ve editör. */
export async function GET() {
  const session = await getSession();
  const headers = { "Cache-Control": "no-store" };
  if (!session) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401, headers });
  const repo = getScopedRepository(session.siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  const items = (await repo.listContents({ locale, type: "template" })).flatMap((c) => {
    const m = readTemplateMeta(c.schemaAttributes);
    return m ? [{ id: c.contentId, name: c.title, kind: m.kind, isDefault: m.isDefault }] : [];
  });
  return NextResponse.json({ ok: true, items }, { headers });
}
