import { randomBytes } from "node:crypto";
import { NextResponse, after, type NextRequest } from "next/server";
import { buildMediaRef } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, inspectUpload } from "@/lib/media/process";
import { prewarmVariants } from "@/lib/media/prewarm";
import { putOriginal } from "@/lib/media/storage";

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

function safeFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "gorsel";
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]/gu, "").trim().slice(0, 120);
  return cleaned || "gorsel";
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Oturum gerekli.", 401);

  // Çerezli POST için ek CSRF savunması: Origin varsa Host ile eşleşmeli.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Geçersiz köken.", 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail("Dosya 12 MB sınırını aşıyor.", 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Dosya bulunamadı.", 400);

  const data = Buffer.from(await file.arrayBuffer());
  let info;
  try {
    info = await inspectUpload(data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Geçersiz dosya.", 415);
  }

  const siteId = session.siteId;
  const id = `med_${randomBytes(9).toString("base64url")}`;
  await putOriginal(siteId, id, data);
  const media = await getScopedRepository(siteId).saveMediaAsset({
    id,
    filename: safeFilename(file.name),
    url: buildMediaRef({ id, width: info.width, height: info.height, hasAlpha: info.hasAlpha }),
    mimeType: info.mimeType,
    width: info.width,
    height: info.height,
    sizeBytes: data.length,
    altText: String(form?.get("altText") ?? "").trim(),
  });
  after(() =>
    prewarmVariants(siteId, id, info.width, info.hasAlpha).catch((error) =>
      console.warn("[media] ön ısıtma başarısız:", error instanceof Error ? error.message : error)
    )
  );
  return NextResponse.json({ ok: true, media });
}
