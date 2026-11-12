import { NextResponse } from "next/server";
import { getFormDefinitionRepository } from "@nexpress/database";
import { roleCan } from "@nexpress/core";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Görsel editördeki Form bloğunun form seçici listesi (editör ve yönetici). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
  if (!roleCan(session.role, "panel.full")) return NextResponse.json({ ok: false, error: "Yetkiniz yok." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const forms = await getFormDefinitionRepository(session.siteId).list();
  return NextResponse.json({ ok: true, forms: forms.map((f) => ({ id: f.id, name: f.name, status: f.status })) }, { headers: { "Cache-Control": "no-store" } });
}
