import { pluginActions } from "@nexpress/core";
import { requireUser } from "@/lib/auth/session";
import "@/plugins/register";

const ALLOW = new Set([
  "intel.search",
  "intel.import",
  "intel.clusters",
  "intel.draft",
  "source.import",
  "source.paste",
  "source.list",
  "source.recheck",
  "reviews.pull",
  "catalog.suggest",
  "catalog.apply",
]);

/** İçerik operasyonu kartlarının oturumlu eylem kapısı. */
export async function POST(request: Request): Promise<Response> {
  const session = await requireUser({ audit: "content-ops.action" });
  let body: { name?: unknown; payload?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; payload?: unknown };
  } catch {
    return Response.json({ ok: false, error: "İstek okunamadı." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "";
  if (!ALLOW.has(name)) return Response.json({ ok: false, error: "Bu eylem kapalı." }, { status: 400 });
  const payload = body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : {};
  const result = await pluginActions.run(name, { siteId: session.siteId, userId: session.sub, input: payload });
  return Response.json(result);
}
