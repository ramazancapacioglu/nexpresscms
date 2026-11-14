import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { isValidMediaId } from "@nexpress/core";
import { resolveObjectStorageConfig } from "@nexpress/core/object-storage";
import * as s3 from "./s3-storage";

/**
 * Medya deposu. Varsayılan yerel disk: `{MEDIA_DIR}/{siteId}/{id}/original` ve `.../v/{genişlik}.{biçim}`.
 * `MEDIA_DRIVER` boş veya `local` ise disk. `s3` ve ayar geçerliyse aynı anahtarlar nesne deposuna yazılır.
 * Ayar bozuksa yazma hata verir (sessizce diske düşmez).
 */
const SITE_RE = /^[a-z0-9_-]{1,64}$/;
const VARIANT_RE = /^\d{3,4}\.(avif|webp|jpg|png)$/;

export function mediaRoot(): string {
  return path.resolve(process.cwd(), process.env.MEDIA_DIR ?? "./data/media");
}

function assertKey(siteId: string, id: string): void {
  if (!SITE_RE.test(siteId) || !isValidMediaId(id)) throw new Error("Geçersiz medya anahtarı.");
}

/** `s3` seçili ve ayar geçerliyse nesne deposu; aksi halde yerel disk. Bozuk s3 ayarı hata verir. */
function useObjectStorage(): boolean {
  const driver = (process.env.MEDIA_DRIVER ?? "local").trim().toLowerCase();
  if (driver === "" || driver === "local") return false;
  if (driver !== "s3") throw new Error("MEDIA_DRIVER local veya s3 olmalı.");
  if (!resolveObjectStorageConfig(process.env)) throw new Error("MEDIA_DRIVER=s3 ama S3 ayarı eksik veya geçersiz.");
  return true;
}

function objectKey(siteId: string, id: string, file: "original" | string): string {
  assertKey(siteId, id);
  if (file !== "original" && !VARIANT_RE.test(file)) throw new Error("Geçersiz türev adı.");
  return file === "original" ? `${siteId}/${id}/original` : `${siteId}/${id}/v/${file}`;
}

function dirFor(siteId: string, id: string): string {
  assertKey(siteId, id);
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
  if (useObjectStorage()) return s3.putObject(objectKey(siteId, id, "original"), data, true);
  const dir = dirFor(siteId, id);
  await fs.mkdir(path.join(dir, "v"), { recursive: true });
  await fs.writeFile(path.join(dir, "original"), data, { flag: "wx" });
}

export function getOriginal(siteId: string, id: string): Promise<Buffer | null> {
  if (useObjectStorage()) return s3.getObject(objectKey(siteId, id, "original"));
  return readOrNull(path.join(dirFor(siteId, id), "original"));
}

export async function putVariant(siteId: string, id: string, file: string, data: Buffer): Promise<void> {
  if (!VARIANT_RE.test(file)) throw new Error("Geçersiz türev adı.");
  if (useObjectStorage()) return s3.putObject(objectKey(siteId, id, file), data);
  const target = path.join(dirFor(siteId, id), "v", file);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, target); // yarım dosya hiç görünmez
}

export function getVariant(siteId: string, id: string, file: string): Promise<Buffer | null> {
  if (!VARIANT_RE.test(file)) return Promise.resolve(null);
  if (useObjectStorage()) return s3.getObject(objectKey(siteId, id, file));
  return readOrNull(path.join(dirFor(siteId, id), "v", file));
}

/** Varlığın tüm dosyalarını (özgün + türevler) siler. Yoksa sessizce geçer. */
export async function removeAsset(siteId: string, id: string): Promise<void> {
  if (useObjectStorage()) return s3.deletePrefix(`${objectKey(siteId, id, "original").replace(/\/original$/, "")}/`);
  await fs.rm(dirFor(siteId, id), { recursive: true, force: true });
}
