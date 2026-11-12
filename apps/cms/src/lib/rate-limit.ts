/** Bellek içi sabit pencere sınırı (tek süreç). Çok örnekli kurulumda Redis'e taşınmalıdır (docs/12). */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    /** Sayar ve izin verilip verilmediğini döner (sınır aşıldıysa false). */
    take(key: string, now = Date.now()): boolean {
      if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      const e = hits.get(key);
      if (!e || e.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      e.count += 1;
      return e.count <= max;
    },
  };
}
