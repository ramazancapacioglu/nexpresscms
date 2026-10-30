const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

/** Parola sıfırlama isteği sınırı (bellek içi; e-posta başına ve IP başına anahtarla çağrılır). Sınır aşıldıysa true. */
export function takeResetSlot(key: string, now = Date.now()): boolean {
  const e = hits.get(key);
  if (!e || e.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (e.count >= MAX_REQUESTS) return false;
  e.count += 1;
  return true;
}
