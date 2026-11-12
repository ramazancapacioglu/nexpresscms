import { sharedDelete, windowCount, windowIncr } from "@/lib/shared-state";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const key = (k: string) => `nx:login:${k}`;

/** Giriş deneme sınırı. `REDIS_URL` varsa tüm örnekler ortak sayar; yoksa süreç belleğinde (`shared-state.ts`). */
export async function isLoginBlocked(k: string): Promise<boolean> {
  return (await windowCount(key(k))) >= MAX_ATTEMPTS;
}

export async function recordLoginFailure(k: string): Promise<void> {
  await windowIncr(key(k), WINDOW_MS);
}

export async function clearLoginFailures(k: string): Promise<void> {
  await sharedDelete(key(k));
}
