import { NextResponse } from "next/server";
import { isPluginModuleEnabled } from "@nexpress/core";
import { recordAudit } from "@/lib/audit";
import { WP_BRIDGE_PLUGIN_ID } from "@/plugins/wp-bridge";
import { pairBridge } from "@/lib/wp-bridge/store";

export const runtime = "nodejs";

const fails = new Map<string, { n: number; at: number }>();

/** WordPress eklentisi, panelde üretilen kodu burada oturuma çevirir. */
export async function POST(request: Request) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  if (!(await isPluginModuleEnabled(siteId, WP_BRIDGE_PLUGIN_ID, "connect"))) {
    return NextResponse.json({ error: "Eşleştirme kapalı." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const hit = fails.get(ip);
  if (hit && hit.n >= 8 && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ error: "Çok fazla deneme. On dakika sonra yeniden deneyin." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { code?: unknown; origin?: unknown } | null;
  const result = await pairBridge(siteId, typeof body?.code === "string" ? body.code : "", typeof body?.origin === "string" ? body.origin : "");
  if ("error" in result) {
    const prev = fails.get(ip);
    fails.set(ip, { n: prev && Date.now() - prev.at < 10 * 60 * 1000 ? prev.n + 1 : 1, at: Date.now() });
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  fails.delete(ip);
  let host = "";
  try {
    host = new URL(typeof body?.origin === "string" ? body.origin : "").host;
  } catch {
    host = "";
  }
  await recordAudit(null, "wp-bridge.pair", { detail: host, siteId });
  return NextResponse.json(result);
}
