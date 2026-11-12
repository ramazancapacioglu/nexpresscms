import "server-only";
import { cache } from "react";
import { revalidatePath as nextRevalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { parseWithDates, stringifyWithDates } from "@nexpress/core";
import { invalidateSiteCache } from "@nexpress/database";
import { sharedCounter, sharedCounterBump } from "@/lib/shared-state";

/** Ön yüz okumaları için varsayılan bayatlama; zamanlanmış yayınları da bu sürede yakalar. */
const FALLBACK_TTL_SECONDS = 120;
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 600;
/**
 * Next.js `unstable_cache` tek girdi için 2 MB (2.097.152 bayt) sınırına sahiptir.
 * Çok sayıda içerik/blok içeren sorgularda (ör. WordPress içe aktarımı sonrası tüm yayındaki içerikler)
 * bu sınır aşıldığında Next.js konsola hata basar. 1.8 MB üzeri yükler dönem (epoch) anahtarlı
 * süreç içi önbellekte tutulur ve `unstable_cache`'e yalnızca hafif işaretçi döner.
 */
const MAX_NEXT_DATA_CACHE_BYTES = 1_800_000;
const OVERSIZE_SENTINEL = "__NX_OVERSIZE_PAYLOAD__";

export const siteTag = (siteId: string) => `site:${siteId}`;

/**
 * Site başına "dönem" sayacı: önbellek anahtarının parçasıdır, her yazmada artar. Etiket
 * geçersiz kılması Next içinde isteğin sonunda uygulanır ve hızlı ardışık yazmalarda bayat
 * okuma bıraktığı görüldü; anahtar değişince eski kayıt hiç eşleşmez. Başlangıç değeri süreç
 * zamanıdır, böylece yeniden başlatmada diskteki eski kayıtlar da kullanılmaz.
 * Sayaç süreç başınadır; çok örnekli kurulumda ortak depo gerekir (docs/12).
 */
const g = globalThis as unknown as {
  __nxCacheBoot?: number;
  __nxCacheEpoch?: Map<string, number>;
  __nxCacheTtl?: number;
  __nxOversizeCache?: Map<string, { exp: number; raw: string }>;
};
const boot = (g.__nxCacheBoot ??= Date.now());
const epochs = (g.__nxCacheEpoch ??= new Map<string, number>());
const oversizeCache = (g.__nxOversizeCache ??= new Map<string, { exp: number; raw: string }>());
const remoteEpochs = new Map<string, { value: number; at: number }>();
const REMOTE_EPOCH_TTL_MS = 1000;

/**
 * Önbellek dönemi: süreç açılışı + yerel sayaç + (`REDIS_URL` varsa) ortak sayaç. Başka bir örnek yazınca ortak sayaç
 * artar; bu örnek değişikliği en geç 1 sn içinde görür (sayaç 1 sn yerelde tutulur, her okumada Redis'e gidilmez).
 */
async function epochOf(siteId: string): Promise<string> {
  const now = Date.now();
  let remote = remoteEpochs.get(siteId);
  if (!remote || now - remote.at > REMOTE_EPOCH_TTL_MS) {
    const value = await sharedCounter(`nx:epoch:${siteId}`);
    remote = { value: value ?? 0, at: now };
    remoteEpochs.set(siteId, remote);
  }
  return `${boot}.${epochs.get(siteId) ?? 0}.${remote.value}`;
}

/** Kayıtlı önbellek süresi. Sınır 30–600 saniye. */
export function cacheTtlSeconds(): number {
  return g.__nxCacheTtl ?? FALLBACK_TTL_SECONDS;
}

/** Perfornext ayarı süreci günceller. Aralık dışındaki değer kenara çekilir. */
export function setCacheTtlSeconds(seconds: number): number {
  const next = Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, Math.round(seconds)));
  g.__nxCacheTtl = next;
  return next;
}

/** Panel raporu: süre, dönem sayacı ve büyük yüklerin bellek adedi. */
export function cacheSnapshot(siteId: string): { ttlSeconds: number; epoch: number; oversizeEntries: number; startedAt: string } {
  return {
    ttlSeconds: cacheTtlSeconds(),
    epoch: epochs.get(siteId) ?? 0,
    oversizeEntries: oversizeCache.size,
    startedAt: new Date(boot).toISOString(),
  };
}

function setOversizeEntry(key: string, raw: string) {
  if (oversizeCache.size >= 32) {
    const oldestKey = oversizeCache.keys().next().value;
    if (oldestKey) oversizeCache.delete(oldestKey);
  }
  oversizeCache.set(key, {
    exp: Date.now() + cacheTtlSeconds() * 1000,
    raw,
  });
}

/**
 * Genel (ziyaretçi) okumalarını iki katmanla sarar:
 * - `cache`: aynı istek içinde tekilleştirir.
 * - `unstable_cache`: istekler arası saklar; `site:{siteId}` etiketiyle düşer.
 * İlk argüman her zaman `siteId` olmalı; anahtara ve etikete girer. Tarihler korunur.
 */
export function cachedRead<A extends [siteId: string, ...rest: string[]], R>(
  name: string,
  read: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return cache(async (...args: A): Promise<R> => {
    const keyParts = [name, await epochOf(args[0]), ...args];
    const memKey = keyParts.join("|");
    const memHit = oversizeCache.get(memKey);
    if (memHit && memHit.exp > Date.now()) {
      return parseWithDates<R>(memHit.raw);
    }

    const raw = await unstable_cache(
      async () => {
        const serialized = stringifyWithDates(await read(...args));
        if (Buffer.byteLength(serialized, "utf8") > MAX_NEXT_DATA_CACHE_BYTES) {
          setOversizeEntry(memKey, serialized);
          return OVERSIZE_SENTINEL;
        }
        return serialized;
      },
      keyParts,
      {
        tags: [siteTag(args[0])],
        revalidate: cacheTtlSeconds(),
      }
    )();

    if (raw === OVERSIZE_SENTINEL) {
      const stored = oversizeCache.get(memKey);
      if (stored) return parseWithDates<R>(stored.raw);
      const fresh = stringifyWithDates(await read(...args));
      setOversizeEntry(memKey, fresh);
      return parseWithDates<R>(fresh);
    }

    return parseWithDates<R>(raw);
  });
}

/** Aktif kiracının ön yüz önbelleğini düşürür. Yazma işleminden sonra çağrılır. */
export async function invalidateSite(siteId?: string): Promise<void> {
  const id = siteId ?? (await headers()).get("x-nexpress-site-id") ?? "default";
  epochs.set(id, (epochs.get(id) ?? 0) + 1);
  remoteEpochs.delete(id);
  await sharedCounterBump(`nx:epoch:${id}`);
  oversizeCache.clear();
  invalidateSiteCache(id);
  try {
    revalidateTag(siteTag(id));
  } catch {
    // İstek dışında (bakım betiği) etiket düşmez; bellek kuşağı yine ilerler.
  }
}

/**
 * Admin eylemlerinin mevcut `revalidatePath` çağrılarının yerini alır:
 * sayfa yolunu ve kiracının veri önbelleğini birlikte düşürür.
 */
export async function revalidatePath(path: string, type?: "page" | "layout"): Promise<void> {
  nextRevalidatePath(path, type);
  await invalidateSite();
}
