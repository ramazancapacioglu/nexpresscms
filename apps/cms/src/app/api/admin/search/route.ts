import { NextResponse } from "next/server";
import { getAdminSearchRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** ⌘K veri araması: içerik, form, taksonomi, medya (+ yöneticiye yönlendirme ve kullanıcı). Kişisel form içeriği aranmaz. */
export async function GET(request: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  const hits = await getAdminSearchRepository(s.siteId).search(q, s.role);
  return NextResponse.json({ ok: true, hits }, { headers: { "Cache-Control": "no-store" } });
}
