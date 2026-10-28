import "server-only";
import { cache } from "react";
import { revalidatePath as nextRevalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { parseWithDates, stringifyWithDates } from "@nexpress/core";

/** Ön yüz okumaları için en uzun bayatlama; zamanlanmış yayınları da bu sürede yakalar. */
const FALLBACK_TTL_SECONDS = 120;

export const siteTag = (siteId: string) => `site:${siteId}`;

/**
 * Site başına "dönem" sayacı: önbellek anahtarının parçasıdır, her yazmada artar. Etiket
 * geçersiz kılması Next içinde isteğin sonunda uygulanır ve hızlı ardışık yazmalarda bayat
 * okuma bıraktığı görüldü; anahtar değişince eski kayıt hiç eşleşmez. Başlangıç değeri süreç
 * zamanıdır, böylece yeniden başlatmada diskteki eski kayıtlar da kullanılmaz.
 * Sayaç süreç başınadır; çok örnekli kurulumda ortak depo gerekir (docs/12).
 */
const g = globalThis as unknown as { __nxCacheBoot?: number; __nxCacheEpoch?: Map<string, number> };
const boot = (g.__nxCacheBoot ??= Date.now());
const epochs = (g.__nxCacheEpoch ??= new Map<string, number>());
const epochOf = (siteId: string) => `${boot}.${epochs.get(siteId) ?? 0}`;

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
    const raw = await unstable_cache(async () => stringifyWithDates(await read(...args)), [name, epochOf(args[0]), ...args], {
      tags: [siteTag(args[0])],
      revalidate: FALLBACK_TTL_SECONDS,
    })();
    return parseWithDates<R>(raw);
  });
}

/** Aktif kiracının ön yüz önbelleğini düşürür. Yazma işleminden sonra çağrılır. */
export async function invalidateSite(siteId?: string): Promise<void> {
  const id = siteId ?? (await headers()).get("x-nexpress-site-id") ?? "default";
  epochs.set(id, (epochs.get(id) ?? 0) + 1);
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
