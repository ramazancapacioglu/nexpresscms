/** Zamanlanmış yedek dosya adları (saf): adlandırma, doğrulama ve saklama kuralı. */
export const BACKUP_KEEP_DEFAULT = 7;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").replace("T", "-");

/** `nexpress-{kiracı}-20261102-103000Z.nxbackup`; kiracı kimliği yalnızca güvenli karakterlerden oluşur. */
export function backupFileName(siteId: string, at: Date): string {
  return `nexpress-${siteId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40)}-${stamp(at)}.nxbackup`;
}

export function isBackupFileName(name: string, siteId: string): boolean {
  const safe = siteId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40);
  return name.startsWith(`nexpress-${safe}-`) && /-\d{8}-\d{6}Z\.nxbackup$/.test(name);
}

/** En yeni `keep` dosyayı korur, kalanları döner (adlar zamana göre sıralanabilir). `keep` en az 1. */
export function pickBackupsToDelete(names: string[], keep: number): string[] {
  const k = Math.max(1, Math.floor(keep) || BACKUP_KEEP_DEFAULT);
  const sorted = [...names].sort();
  return sorted.slice(0, Math.max(0, sorted.length - k));
}
