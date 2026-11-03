import "server-only";
import { cache } from "react";
import { revalidatePath as nextRevalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { parseWithDates, stringifyWithDates } from "@nexpress/core";

/** Ön yüz okumaları için en uzun bayatlama; zamanlanmış yayınları da bu sürede yakalar. */
const FALLBACK_TTL_SECONDS = 120;
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
  __nxOversizeCache?: Map<string, { exp: number; raw: string }>;
};
const boot = (g.__nxCacheBoot ??= Date.now());
const epochs = (g.__nxCacheEpoch ??= new Map<string, number>());
const oversizeCache = (g.__nxOversizeCache ??= new Map<string, { exp: number; raw: string }>());
const epochOf = (siteId: string) => `${boot}.${epochs.get(siteId) ?? 0}`;

function setOversizeEntry(key: string, raw: string) {
  if (oversizeCache.size >= 32) {
    const oldestKey = oversizeCache.keys().next().value;
    if (oldestKey) oversizeCache.delete(oldestKey);
  }
  oversizeCache.set(key, {
    exp: Date.now() + FALLBACK_TTL_SECONDS * 1000,
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
    const keyParts = [name, epochOf(args[0]), ...args];
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
        revalidate: FALLBACK_TTL_SECONDS,
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
  oversizeCache.clear();
  revalidateTag(siteTag(id));
}

/**
 * Admin eylemlerinin mevcut `revalidatePath` çağrılarının yerini alır:
 * sayfa yolunu ve kiracının veri önbelleğini birlikte düşürür.
 */
export async function revalidatePath(path: string, type?: "page" | "layout"): Promise<void> {
  nextRevalidatePath(path, type);
  await invalidateSite();
}
