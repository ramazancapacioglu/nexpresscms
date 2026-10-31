import "server-only";
import { createHash } from "node:crypto";
import { strToU8, zipSync } from "fflate";
import { isValidMediaId, stringifyWithDates } from "@nexpress/core";
import { BACKUP_TABLES, getBackupRepository } from "@nexpress/database";
import { BACKUP_LIMITS, FORMAT, VERSION, sha, type BackupManifest } from "./backup-package";

export { BACKUP_LIMITS, parseBackup, type BackupManifest, type ParsedBackup } from "./backup-package";
import { getOriginal, putOriginal } from "@/lib/media/storage";



export async function buildBackup(siteId: string, opts: { media: boolean; personal: boolean }): Promise<{ bytes: Uint8Array; manifest: BackupManifest }> {
  const data = await getBackupRepository(siteId).exportData({ personal: opts.personal });
  const files: Record<string, Uint8Array> = {};
  const put = (path: string, text: string) => (files[path] = strToU8(text));
  put("data/site.json", stringifyWithDates(data.site));
  const counts: Record<string, number> = {};
  for (const name of BACKUP_TABLES) {
    const rows = data.tables[name];
    if (!rows) continue;
    counts[name] = rows.length;
    put(`data/${name}.json`, stringifyWithDates(rows));
  }
  const media = { files: 0, bytes: 0, skipped: 0 };
  if (opts.media) {
    for (const row of data.tables.mediaAssets ?? []) {
      const id = String(row.id);
      if (!isValidMediaId(id)) continue;
      const buf = await getOriginal(siteId, id).catch(() => null);
      if (!buf) continue;
      if (media.bytes + buf.length > BACKUP_LIMITS.mediaBytes) {
        media.skipped++;
        continue;
      }
      files[`media/${id}/original`] = new Uint8Array(buf);
      media.files++;
      media.bytes += buf.length;
    }
  }
  const manifest: BackupManifest = {
    format: FORMAT,
    version: VERSION,
    createdAt: new Date().toISOString(),
    siteId,
    tables: counts,
    hasSite: data.site !== null,
    media,
    personal: opts.personal,
    files: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, sha(v)])),
  };
  files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  return { bytes: zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: k.startsWith("media/") ? 0 : 6 }]]))), manifest };
}

/** Medya özgünlerini diske yazar (var olanlara dokunmaz). Veritabanı içe aktarması başarılı olduktan SONRA çağrılır. */
export async function restoreMedia(siteId: string, media: Map<string, Uint8Array>): Promise<{ written: number; existing: number }> {
  let written = 0;
  let existing = 0;
  for (const [id, buf] of media) {
    try {
      await putOriginal(siteId, id, Buffer.from(buf));
      written++;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") existing++;
    }
  }
  return { written, existing };
}
