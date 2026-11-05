import { safeEqual } from "@nexpress/core/password";
import { runSeoSync } from "@/lib/seo-sync";

/** Günlük eşitleme. `Authorization: Bearer <CRON_SECRET>` gerekir. */
async function run(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const header = request.headers.get("authorization") ?? "";
  const got = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!secret || !got || !safeEqual(got, secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const report = await runSeoSync(siteId);
  return Response.json({ ok: true, ...report });
}

export function GET(request: Request) {
  return run(request);
}

export function POST(request: Request) {
  return run(request);
}
