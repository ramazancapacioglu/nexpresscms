import { NextResponse } from "next/server";
import { getMediaFolderRepository, getScopedRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Medya seçici için güncel kitaplık ve klasörler (yönetici ve editör). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const [assets, folders] = await Promise.all([getScopedRepository(session.siteId).listMediaAssets(), getMediaFolderRepository(session.siteId).list()]);
  return NextResponse.json({ ok: true, assets, folders }, { headers: { "Cache-Control": "no-store" } });
}
