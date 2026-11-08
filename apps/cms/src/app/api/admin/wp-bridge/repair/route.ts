import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { redrawFlatPages } from "@/lib/wp-bridge/redraw";
import { repairImportedAssets } from "@/lib/wp-bridge/repair";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Uzun süren görsel indirme ve AI yerleşim. Oturum gerekir. */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const repair = await repairImportedAssets(auth.session.siteId);
  if (!repair.origin) return NextResponse.json({ ok: false, error: "Kaynak site adresi yok." }, { status: 409 });
  const draw = await redrawFlatPages(auth.session.siteId, 4);
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "wp-bridge.repair", {
    detail: `sayfa ${repair.pages}, görsel ${repair.downloaded}, ai ${draw.drawn}`,
  });
  return NextResponse.json({ ok: true, ...repair, drawn: draw.drawn, note: draw.note });
}
