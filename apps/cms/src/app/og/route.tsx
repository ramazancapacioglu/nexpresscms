import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/** Öne çıkan görseli olmayan içerikler için 1200x630 sosyal paylaşım görseli. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = (params.get("title") ?? "").slice(0, 120) || "NexPress";
  const site = (params.get("site") ?? "").slice(0, 60);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.8 }}>{site}</div>
        <div style={{ fontSize: title.length > 60 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    }
  );
}
