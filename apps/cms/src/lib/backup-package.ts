import { createHash } from "node:crypto";
import { strFromU8, unzipSync, type UnzipFileInfo } from "fflate";
import { isValidMediaId, parseWithDates } from "@nexpress/core";
import { BACKUP_TABLES, type BackupData, type BackupTable } from "@nexpress/database";

/** Kiracı yedeği paketi (`.nxbackup` = zip): manifest + tablo JSON'ları + isteğe bağlı medya özgün dosyaları. */
export const BACKUP_LIMITS = { zipBytes: 96 * 1024 * 1024, files: 20_000, totalBytes: 512 * 1024 * 1024, mediaBytes: 64 * 1024 * 1024, mediaFile: 25 * 1024 * 1024, rows: 200_000 } as const;
export const FORMAT = "nexpress-backup";
export const VERSION = 1;

export interface BackupManifest {
  format: typeof FORMAT;
  version: number;
  createdAt: string;
  siteId: string;
  tables: Record<string, number>;
  hasSite: boolean;
  media: { files: number; bytes: number; skipped: number };
  personal: boolean;
  files: Record<string, string>;
}

export const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

function sniffImage(b: Uint8Array): boolean {
  const ascii = (a: number, n: number) => String.fromCharCode(...b.subarray(a, a + n));
  return (
    (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || // jpeg
    (b[0] === 0x89 && ascii(1, 3) === "PNG") ||
    (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") ||
    ascii(4, 8) === "ftypavif"
  );
}

export type ParsedBackup = { ok: true; manifest: BackupManifest; data: BackupData; media: Map<string, Uint8Array>; warnings: string[] } | { ok: false; errors: string[] };

const SAFE_NAME = /^(manifest\.json|data\/[A-Za-z]+\.json|media\/[A-Za-z0-9_-]+\/original)$/;

/** Paketi doğrular: zip sınırları (şişirmeden önce), güvenli dosya adları, özetler, biçim sürümü, satır şekli. */
export function parseBackup(bytes: Uint8Array): ParsedBackup {
  if (bytes.length === 0 || bytes.length > BACKUP_LIMITS.zipBytes) return { ok: false, errors: [bytes.length === 0 ? "Dosya boş." : `Paket ${BACKUP_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`] };
  const entries: UnzipFileInfo[] = [];
  try {
    unzipSync(bytes, { filter: (f) => (entries.push(f), false) });
  } catch {
    return { ok: false, errors: ["Geçerli bir yedek dosyası (zip) değil."] };
  }
  const files = entries.filter((e) => !e.name.endsWith("/"));
  if (files.length > BACKUP_LIMITS.files) return { ok: false, errors: [`En çok ${BACKUP_LIMITS.files} dosya olabilir.`] };
  if (files.reduce((n, f) => n + f.originalSize, 0) > BACKUP_LIMITS.totalBytes) return { ok: false, errors: ["Açılmış boyut sınırı aşıldı (zip bombası koruması)."] };
  const bad = files.find((f) => !SAFE_NAME.test(f.name));
  if (bad) return { ok: false, errors: [`Beklenmeyen/güvenli olmayan dosya: ${bad.name}`] };
  let raw: Record<string, Uint8Array>;
  try {
    raw = unzipSync(bytes);
  } catch {
    return { ok: false, errors: ["Zip açılamadı (bozuk olabilir)."] };
  }
  const mf = raw["manifest.json"];
  if (!mf) return { ok: false, errors: ["manifest.json eksik: bu bir NexPress yedeği değil."] };
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(mf)) as BackupManifest;
  } catch {
    return { ok: false, errors: ["manifest.json okunamadı."] };
  }
  if (manifest.format !== FORMAT) return { ok: false, errors: ["Bu bir NexPress yedeği değil."] };
  if (!Number.isInteger(manifest.version) || manifest.version > VERSION) return { ok: false, errors: [`Yedek sürümü (${manifest.version}) bu uygulamadan yeni; uygulamayı güncelleyin.`] };

  const errors: string[] = [];
  const warnings: string[] = [];
  for (const [path, hash] of Object.entries(manifest.files ?? {})) {
    if (!raw[path]) errors.push(`Eksik dosya: ${path}`);
    else if (sha(raw[path]) !== hash) errors.push(`Bozuk dosya (özet uyuşmuyor): ${path}`);
  }
  if (errors.length) return { ok: false, errors };

  const tables: BackupData["tables"] = {};
  let totalRows = 0;
  for (const [path, buf] of Object.entries(raw)) {
    const m = path.match(/^data\/([A-Za-z]+)\.json$/);
    if (!m || m[1] === "site") continue;
    const name = m[1] as BackupTable;
    if (!(BACKUP_TABLES as readonly string[]).includes(name)) {
      warnings.push(`Bilinmeyen tablo yok sayıldı: ${name}`);
      continue;
    }
    let rows: unknown;
    try {
      rows = parseWithDates<unknown>(strFromU8(buf));
    } catch {
      return { ok: false, errors: [`${path}: JSON okunamadı.`] };
    }
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== "object" || typeof (r as { id?: unknown }).id !== "string")) return { ok: false, errors: [`${path}: satırlar nesne ve metin kimlikli olmalı.`] };
    totalRows += rows.length;
    tables[name] = rows as Array<Record<string, unknown>>;
  }
  if (totalRows > BACKUP_LIMITS.rows) return { ok: false, errors: [`En çok ${BACKUP_LIMITS.rows} satır içe aktarılabilir.`] };
  let site: BackupData["site"] = null;
  if (raw["data/site.json"]) {
    try {
      site = parseWithDates(strFromU8(raw["data/site.json"]));
    } catch {
      return { ok: false, errors: ["data/site.json okunamadı."] };
    }
  }
  const media = new Map<string, Uint8Array>();
  for (const [path, buf] of Object.entries(raw)) {
    const m = path.match(/^media\/([A-Za-z0-9_-]+)\/original$/);
    if (!m) continue;
    if (!isValidMediaId(m[1]!)) warnings.push(`Geçersiz medya kimliği atlandı: ${m[1]}`);
    else if (buf.length > BACKUP_LIMITS.mediaFile) warnings.push(`Çok büyük medya atlandı: ${m[1]}`);
    else if (!sniffImage(buf)) warnings.push(`Görsel olmayan medya atlandı: ${m[1]}`);
    else media.set(m[1]!, buf);
  }
  return { ok: true, manifest, data: { site, tables }, media, warnings };
}
