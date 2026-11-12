import { NextResponse } from "next/server";
import { isFontFileName } from "@nexpress/core";
import { readFontFile } from "@/lib/fonts";

/** Kiracının indirilmiş yazı tipi dosyası. Adresi özet içerir: değişmez, bir yıl önbelleğe alınır. */
export async function GET(request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isFontFileName(file)) return new NextResponse("Bulunamadı", { status: 404 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const data = await readFontFile(siteId, file);
  if (!data) return new NextResponse("Bulunamadı", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": "font/woff2", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
