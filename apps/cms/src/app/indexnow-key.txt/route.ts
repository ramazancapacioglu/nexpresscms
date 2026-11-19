import { NextResponse, type NextRequest } from "next/server";
import { resolveIndexNowKey } from "@/lib/indexnow";

/** IndexNow sahiplik doğrulaması. Panel veya ortam anahtarı yoksa 404. */
export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const key = await resolveIndexNowKey(siteId);
  if (!key) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
