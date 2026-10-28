import { NextResponse } from "next/server";

/** IndexNow sahiplik doğrulaması: anahtar tanımlı değilse 404. */
export function GET() {
  const key = process.env.INDEXNOW_API_KEY?.trim();
  if (!key) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
