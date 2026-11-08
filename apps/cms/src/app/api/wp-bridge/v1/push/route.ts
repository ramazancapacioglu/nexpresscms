import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { applyBridgePush } from "@/lib/wp-bridge/apply";
import { bridgeSession } from "@/lib/wp-bridge/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Eşleşmiş WordPress eklentisinden gelen paket. Kod bu istekte yer almaz. */
export async function POST(request: Request) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 6_000_000) return NextResponse.json({ error: "Paket çok büyük." }, { status: 413 });
  const session = token ? await bridgeSession(siteId, token) : null;
  if (!session) return NextResponse.json({ error: "Oturum yok. Eşleştirmeyi yenileyin." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Paket okunamadı." }, { status: 400 });
  const result = await applyBridgePush(siteId, body, session.origin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  const kind = typeof (body as { kind?: unknown }).kind === "string" ? (body as { kind: string }).kind : "";
  if (kind === "begin") await recordAudit(null, "wp-bridge.push", { detail: session.origin, siteId });
  return NextResponse.json({ ok: true, detail: result.detail });
}
