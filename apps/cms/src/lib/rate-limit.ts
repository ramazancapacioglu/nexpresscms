import { windowIncr } from "@/lib/shared-state";

/**
 * Sabit pencere hız sınırı. Sayaç `REDIS_URL` varsa Redis'te (tüm örnekler ortak), yoksa süreç belleğindedir.
 * `take` sayar ve izin verilip verilmediğini döner (sınır aşıldıysa false).
 */
export function createRateLimiter(name: string, max: number, windowMs: number) {
  return {
    async take(key: string): Promise<boolean> {
      return (await windowIncr(`nx:rl:${name}:${key}`, windowMs)) <= max;
    },
  };
}
