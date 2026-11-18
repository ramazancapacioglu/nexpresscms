import fs from "node:fs";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { WP_UPLOAD_TYPES, resolveUploadPath, wpUploadsDir } from "@/lib/wp-uploads";
import { originalUploadUrl } from "@nexpress/wp-importer";
import { readMediaMap } from "@/lib/wp-bridge/store";

/**
 * `/wp-content/uploads/…`: belge ve arşiv dosyaları özgün adresinde sunulur. Görsel adresleri (boyutlu kopyalar dahil)
 * medya kitaplığına 301 ile gider; böylece eski bağlantılar ve görsel arama sonuçları alan adı değişince de çalışır.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const resolved = resolveUploadPath(wpUploadsDir(), segments);
  if (resolved) {
    const stat = await fs.promises.stat(resolved.file).catch(() => null);
    if (stat?.isFile()) {
      const type = WP_UPLOAD_TYPES[resolved.ext]!;
      const stream = Readable.toWeb(fs.createReadStream(resolved.file)) as ReadableStream;
      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Type": type.mime,
          "Content-Length": String(stat.size),
          "Content-Disposition": `${type.attachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(resolved.name)}`,
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }
  const tail = `/wp-content/uploads/${segments.join("/")}`;
  const map = await readMediaMap(siteId);
  const wanted = new Set([tail, originalUploadUrl(tail)]);
  for (const [url, ref] of Object.entries(map)) {
    const at = url.indexOf("/wp-content/uploads/");
    if (at < 0 || !wanted.has(url.slice(at))) continue;
    const id = /^\/media\/([^?]+)/.exec(ref)?.[1];
    if (id) return new NextResponse(null, { status: 301, headers: { location: `/media/${id}/1280.webp`, "cache-control": "public, max-age=86400" } });
  }
  return new NextResponse("Not found", { status: 404 });
}
