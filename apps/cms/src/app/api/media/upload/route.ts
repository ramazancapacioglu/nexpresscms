import { randomBytes } from "node:crypto";
import { NextResponse, after, type NextRequest } from "next/server";
import { FILE_KINDS, buildMediaRef, seoFileSlug, sniffFileMime, titleFromFilename } from "@nexpress/core";
import { getMediaFolderRepository, getScopedRepository } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, inspectUpload } from "@/lib/media/process";
import { prewarmVariants } from "@/lib/media/prewarm";
import { putOriginal } from "@/lib/media/storage";

/** Görsel olmayan dosyalar (PDF, video, ses) için üst sınır. */
const MAX_FILE_BYTES = 40 * 1024 * 1024;

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
  if (length > MAX_FILE_BYTES + 64 * 1024) return fail("Dosya 40 MB sınırını aşıyor.", 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Dosya bulunamadı.", 400);

  const data = Buffer.from(await file.arrayBuffer());
  // Görsel olmayan türler içerik başlığından tanınır (uzantıya güvenilmez); tanınmazsa görsel olarak doğrulanır
  const fileMime = sniffFileMime(data);
  if (fileMime && data.length > MAX_FILE_BYTES) return fail("Dosya 40 MB sınırını aşıyor.", 413);
  let info: Awaited<ReturnType<typeof inspectUpload>> | null = null;
  if (!fileMime) {
    try {
      info = await inspectUpload(data);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Geçersiz dosya.", 415);
    }
  }

  const siteId = session.siteId;
  // Klasör (isteğe bağlı): bu kiracıya ait olmalı; değilse kökte kalır
  const wantedFolder = String(form?.get("folderId") ?? "");
  const folderId = wantedFolder && (await getMediaFolderRepository(siteId).list()).some((f) => f.id === wantedFolder) ? wantedFolder : null;
  const id = `med_${randomBytes(9).toString("base64url")}`;
  await putOriginal(siteId, id, data);
  const filename = safeFilename(file.name);
  const altText = String(form?.get("altText") ?? "").trim();
  const common = { id, filename, sizeBytes: data.length, altText, titleText: titleFromFilename(filename) || undefined, folderId };
  const media = fileMime
    ? await getScopedRepository(siteId).saveMediaAsset({
        ...common,
        url: `/media/${id}/${seoFileSlug(filename)}.${FILE_KINDS[fileMime]!.ext}`,
        mimeType: fileMime,
        kind: FILE_KINDS[fileMime]!.kind,
        width: 0,
        height: 0,
      })
    : await getScopedRepository(siteId).saveMediaAsset({
        ...common,
        url: buildMediaRef({ id, width: info!.width, height: info!.height, hasAlpha: info!.hasAlpha }),
        mimeType: info!.mimeType,
        kind: "image",
        width: info!.width,
        height: info!.height,
      });
  if (fileMime) return NextResponse.json({ ok: true, media });
  after(() =>
    prewarmVariants(siteId, id, info!.width, info!.hasAlpha).catch((error) =>
      console.warn("[media] ön ısıtma başarısız:", error instanceof Error ? error.message : error)
    )
  );
  return NextResponse.json({ ok: true, media });
}
