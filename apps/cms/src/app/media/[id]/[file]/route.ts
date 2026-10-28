import { NextResponse, type NextRequest } from "next/server";
import { isValidMediaId, parseVariantFile } from "@nexpress/core";
import { contentTypeOf, renderVariant } from "@/lib/media/process";
import { getOriginal, getVariant, putVariant } from "@/lib/media/storage";

const IMMUTABLE = "public, max-age=31536000, immutable";
/** Aynı türev için eşzamanlı istekler tek işleme dönüşür. */
const inflight = new Map<string, Promise<Buffer | null>>();

function respond(data: Buffer, format: Parameters<typeof contentTypeOf>[0]) {
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentTypeOf(format),
      "Cache-Control": IMMUTABLE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** `/media/{id}/{genişlik}.{biçim}` — türev yoksa özgünden üretilir ve diske yazılır. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const variant = parseVariantFile(file);
  if (!variant || !isValidMediaId(id)) return new NextResponse("Not found", { status: 404 });

  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const cached = await getVariant(siteId, id, file);
  if (cached) return respond(cached, variant.format);

  const key = `${siteId}|${id}|${file}`;
  let job = inflight.get(key);
  if (!job) {
    job = (async () => {
      const original = await getOriginal(siteId, id);
      if (!original) return null;
      const data = await renderVariant(original, variant.width, variant.format);
      await putVariant(siteId, id, file, data);
      return data;
    })().finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  try {
    const data = await job;
    return data ? respond(data, variant.format) : new NextResponse("Not found", { status: 404 });
  } catch (error) {
    console.error("[media] türev üretilemedi:", error instanceof Error ? error.message : error);
    return new NextResponse("Image processing failed", { status: 500 });
  }
}
