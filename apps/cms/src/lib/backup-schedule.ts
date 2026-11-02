import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { buildBackup } from "@/lib/backup";
import { BACKUP_KEEP_DEFAULT, backupFileName, isBackupFileName, pickBackupsToDelete } from "./backup-names";

/** Zamanlanmış yedeklerin yazıldığı klasör (`BACKUP_DIR`; yoksa uygulama verisi altında `data/backups`). */
export function backupDir(): string {
  return path.resolve(process.env.BACKUP_DIR?.trim() || path.join(process.cwd(), "data", "backups"));
}

export interface ScheduledBackupResult {
  file: string;
  bytes: number;
  kept: number;
  deleted: string[];
}

/** Kiracı yedeğini klasöre yazar (geçici dosya + yeniden adlandırma) ve en yeni `keep` kadarını tutar. */
export async function runScheduledBackup(siteId: string, opts: { media: boolean; keep?: number; now?: Date }): Promise<ScheduledBackupResult> {
  const dir = backupDir();
  await fs.mkdir(dir, { recursive: true });
  const { bytes } = await buildBackup(siteId, { media: opts.media, personal: false });
  const file = backupFileName(siteId, opts.now ?? new Date());
  const tmp = path.join(dir, `.${file}.tmp`);
  await fs.writeFile(tmp, bytes, { mode: 0o600 });
  await fs.rename(tmp, path.join(dir, file));
  const names = (await fs.readdir(dir)).filter((n) => isBackupFileName(n, siteId));
  const doomed = pickBackupsToDelete(names, opts.keep ?? BACKUP_KEEP_DEFAULT);
  for (const n of doomed) await fs.rm(path.join(dir, n), { force: true });
  return { file, bytes: bytes.length, kept: names.length - doomed.length, deleted: doomed };
}

/** Son yedeğin adı ve yaşı (sistem durumu için); klasör yoksa null. */
export async function latestBackup(siteId: string): Promise<{ file: string; ageHours: number } | null> {
  try {
    const names = (await fs.readdir(backupDir())).filter((n) => isBackupFileName(n, siteId)).sort();
    const last = names.at(-1);
    if (!last) return null;
    const stat = await fs.stat(path.join(backupDir(), last));
    return { file: last, ageHours: Math.round((Date.now() - stat.mtimeMs) / 3_600_000) };
  } catch {
    return null;
  }
}
