import "server-only";
import { resolveObjectStorageConfig, signObjectRequest } from "@nexpress/core/object-storage";

function asArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  return copy;
}

const SITE_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/;

/**
 * Zamanlanmış yedeğin isteğe bağlı kopyası. `BACKUP_COPY=s3` ve S3 ayarı yoksa yerel yedek durur, kopya atlanır.
 * Kapalıysa `null` (CDN gibi: yapılandırılmazsa hiçbir ağ çağrısı yok).
 */
export async function copyBackupOffsite(siteId: string, file: string, bytes: Uint8Array): Promise<{ ok: true } | { ok: false; error: string } | null> {
  if ((process.env.BACKUP_COPY ?? "").trim().toLowerCase() !== "s3") return null;
  const cfg = resolveObjectStorageConfig(process.env);
  if (!cfg) return { ok: false, error: "S3 ayarı eksik." };
  if (!SITE_RE.test(siteId) || !FILE_RE.test(file)) return { ok: false, error: "Yedek adı geçersiz." };
  try {
    const signed = signObjectRequest(cfg, { method: "PUT", key: `backups/${siteId}/${file}`, body: bytes });
    const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: asArrayBuffer(bytes), redirect: "manual", signal: AbortSignal.timeout(60_000) });
    await res.body?.cancel();
    if (res.status >= 300 && res.status < 400) return { ok: false, error: "Yönlendirme reddedildi." };
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 160) : "Ağ hatası" };
  }
}
