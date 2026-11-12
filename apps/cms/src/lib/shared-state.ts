import "server-only";
import { RedisClient, parseRedisUrl } from "@nexpress/core/redis-client";

/**
 * Çok örnekli kurulum için paylaşımlı sayaçlar (hız sınırı, önbellek dönemi). `REDIS_URL` tanımlıysa Redis'e yazar;
 * tanımsızsa ya da Redis erişilemezse **süreç belleğine düşer** (istek asla patlamaz, sınır yalnızca süreç başına olur).
 * Anahtarlar `nx:` önekli ve kiracı kimliği içerir.
 */
const g = globalThis as unknown as { __nxRedis?: RedisClient | null; __nxSharedMem?: Map<string, { value: number; resetAt: number }> };
const mem = (g.__nxSharedMem ??= new Map());

function client(): RedisClient | null {
  if (g.__nxRedis === undefined) {
    const target = parseRedisUrl(process.env.REDIS_URL);
    g.__nxRedis = target ? new RedisClient(target) : null;
  }
  return g.__nxRedis;
}

/** Redis yapılandırılmış mı (bağlı olduğu anlamına gelmez; erişilemezse bellek yedeği kullanılır). */
export const sharedStateConfigured = (): boolean => client() !== null;

function prune(now: number) {
  if (mem.size > 5000) for (const [k, v] of mem) if (v.resetAt <= now) mem.delete(k);
}

/** Sabit pencere sayacı: anahtarı artırır, ilk artışta pencere süresini kurar; yeni sayıyı döner. */
export async function windowIncr(key: string, windowMs: number): Promise<number> {
  const r = client();
  if (r) {
    const n = await r.command(["INCR", key]);
    if (typeof n === "number") {
      if (n === 1) await r.command(["PEXPIRE", key, windowMs]);
      return n;
    }
  }
  const now = Date.now();
  prune(now);
  const e = mem.get(key);
  if (!e || e.resetAt <= now) {
    mem.set(key, { value: 1, resetAt: now + windowMs });
    return 1;
  }
  e.value += 1;
  return e.value;
}

/** Sayacın şimdiki değeri (artırmadan); yoksa 0. */
export async function windowCount(key: string): Promise<number> {
  const r = client();
  if (r) {
    const v = await r.command(["GET", key]);
    if (v === null) return 0;
    if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v);
  }
  const e = mem.get(key);
  return e && e.resetAt > Date.now() ? e.value : 0;
}

export async function sharedDelete(key: string): Promise<void> {
  mem.delete(key);
  await client()?.command(["DEL", key]);
}

/** Kalıcı artan sayaç (önbellek dönemi): Redis yoksa `null` (çağıran yerel sayaçla yetinir). */
export async function sharedCounter(key: string): Promise<number | null> {
  const v = await client()?.command(["GET", key]);
  return typeof v === "string" && Number.isFinite(Number(v)) ? Number(v) : v === null ? 0 : null;
}

export async function sharedCounterBump(key: string): Promise<void> {
  await client()?.command(["INCR", key]);
}
