import "server-only";
import sharp, { type Metadata } from "sharp";
import { MEDIA_MIME, UPLOAD_MIME_ALLOWLIST, type MediaFormat } from "@nexpress/core";

/** Çözülmüş piksel üst sınırı (sıkıştırma bombası koruması): ~64 MP. */
const MAX_PIXELS = 64_000_000;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const QUALITY: Record<MediaFormat, number> = { avif: 50, webp: 76, jpg: 78, png: 90 };

export interface InspectedImage {
  mimeType: string;
  /** EXIF yönü uygulandıktan sonraki boyut */
  width: number;
  height: number;
  hasAlpha: boolean;
}

const FORMAT_MIME: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heif: "image/avif" };

/** Dosyayı uzantıya değil içeriğe bakarak doğrular; geçersizse hata fırlatır. */
export async function inspectUpload(data: Buffer): Promise<InspectedImage> {
  if (data.length === 0) throw new Error("Dosya boş.");
  if (data.length > MAX_UPLOAD_BYTES) throw new Error("Dosya 12 MB sınırını aşıyor.");
  let meta: Metadata;
  try {
    meta = await sharp(data, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new Error("Görsel okunamadı veya çok büyük.");
  }
  const mimeType = FORMAT_MIME[meta.format ?? ""];
  if (!mimeType || !(UPLOAD_MIME_ALLOWLIST as readonly string[]).includes(mimeType)) {
    throw new Error("Yalnızca JPEG, PNG, WebP ve AVIF yüklenebilir.");
  }
  if (meta.format === "heif" && meta.compression !== "av1") throw new Error("Yalnızca AVIF (HEIC değil) kabul edilir.");
  if ((meta.pages ?? 1) > 1) throw new Error("Animasyonlu görseller desteklenmiyor.");
  if (!meta.width || !meta.height) throw new Error("Görsel boyutu okunamadı.");
  const swapped = (meta.orientation ?? 1) >= 5;
  return {
    mimeType,
    width: swapped ? meta.height : meta.width,
    height: swapped ? meta.width : meta.height,
    hasAlpha: Boolean(meta.hasAlpha),
  };
}

/** Yön düzeltilir, genişliğe indirilir (büyütülmez), tüm EXIF/konum verisi atılır. */
export async function renderVariant(original: Buffer, width: number, format: MediaFormat): Promise<Buffer> {
  const pipeline = sharp(original, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .toColorspace("srgb");
  switch (format) {
    case "avif":
      return pipeline.avif({ quality: QUALITY.avif, effort: 4 }).toBuffer();
    case "webp":
      return pipeline.webp({ quality: QUALITY.webp }).toBuffer();
    case "jpg":
      return pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: QUALITY.jpg, mozjpeg: true }).toBuffer();
    case "png":
      return pipeline.png({ compressionLevel: 9 }).toBuffer();
  }
}

export const contentTypeOf = (format: MediaFormat) => MEDIA_MIME[format];
