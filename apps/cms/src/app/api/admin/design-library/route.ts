import { NextResponse } from "next/server";
import { getDesignLibraryRepository } from "@nexpress/database";
import { roleCan } from "@nexpress/core";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Görsel editörün "Benim tasarımlarım" sekmesi: kaydedilmiş bölüm ve sayfa tasarımları (oturumlu her panel kullanıcısı). */
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!roleCan(s.role, "panel.full")) return NextResponse.json({ ok: false, error: "Yetkiniz yok." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const items = (await getDesignLibraryRepository(s.siteId).list()).filter((i) => i.kind !== "theme");
  return NextResponse.json({ ok: true, items: items.map((i) => ({ id: i.id, kind: i.kind, name: i.name, description: i.description, category: i.category, placeholderData: i.placeholderData, payload: i.payload })) }, { headers: { "Cache-Control": "no-store" } });
}
