import "server-only";
import { NextResponse } from "next/server";

/**
 * Görsel olmayan medyayı (PDF, video, ses) sunar. Tür, yükleme sırasında içerik başlığından doğrulanıp kaydedilen
 * değerdir; `nosniff` ile tarayıcı türü değiştiremez. Video/ses ilerletme için `Range` (206) desteklenir.
 */
export function serveStoredFile(data: Buffer, opts: { mime: string; filename: string; rangeHeader: string | null }): NextResponse {
  const total = data.length;
  const headers: Record<string, string> = {
    "Content-Type": opts.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `inline; filename="${opts.filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
  };
  const m = opts.rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(opts.rangeHeader.trim()) : null;
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : total - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : total - 1;
    start = Math.max(0, start);
    end = Math.min(end, total - 1);
    if (!(start <= end) || start >= total) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new NextResponse(new Uint8Array(data), { status: 200, headers: { ...headers, "Content-Length": String(total) } });
}
