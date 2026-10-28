import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { isValidMediaId } from "@nexpress/core";

/**
 * Yerel disk deposu: `{MEDIA_DIR}/{siteId}/{id}/original` ve `.../v/{genişlik}.{biçim}`.
 * Kiracı klasörü ayrıdır. Başka bir sürücü (S3 vb.) bu üç işlevi sağlayarak eklenir.
 */
const SITE_RE = /^[a-z0-9_-]{1,64}$/;
const VARIANT_RE = /^\d{3,4}\.(avif|webp|jpg|png)$/;

export function mediaRoot(): string {
  return path.resolve(process.cwd(), process.env.MEDIA_DIR ?? "./data/media");
}

function dirFor(siteId: string, id: string): string {
  if (!SITE_RE.test(siteId) || !isValidMediaId(id)) throw new Error("Geçersiz medya anahtarı.");
  const root = mediaRoot();
  const dir = path.join(root, siteId, id);
  if (!dir.startsWith(root + path.sep)) throw new Error("Geçersiz medya yolu.");
  return dir;
}

async function readOrNull(file: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function putOriginal(siteId: string, id: string, data: Buffer): Promise<void> {
  const dir = dirFor(siteId, id);
  await fs.mkdir(path.join(dir, "v"), { recursive: true });
  await fs.writeFile(path.join(dir, "original"), data, { flag: "wx" });
}

export const getOriginal = (siteId: string, id: string) => readOrNull(path.join(dirFor(siteId, id), "original"));

export async function putVariant(siteId: string, id: string, file: string, data: Buffer): Promise<void> {
  if (!VARIANT_RE.test(file)) throw new Error("Geçersiz türev adı.");
  const target = path.join(dirFor(siteId, id), "v", file);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, target); // yarım dosya hiç görünmez
}

export function getVariant(siteId: string, id: string, file: string): Promise<Buffer | null> {
  if (!VARIANT_RE.test(file)) return Promise.resolve(null);
  return readOrNull(path.join(dirFor(siteId, id), "v", file));
}

/** Varlığın tüm dosyalarını (özgün + türevler) siler. Yoksa sessizce geçer. */
export async function removeAsset(siteId: string, id: string): Promise<void> {
  await fs.rm(dirFor(siteId, id), { recursive: true, force: true });
}
