/**
 * İçerik yaşam döngüsü (saf mantık): zamanlanmış yayın tarihi çözümü, çöp kutusu süresi ve yönlendirme kuralları.
 */

/** `YYYY-MM-DDTHH:mm` (datetime-local) biçimini sitenin saat dilimindeki an olarak UTC'ye çevirir; geçersizse `null`. */
export function zonedLocalToUtc(local: string, timeZone: string): Date | null {
  const m = local.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  if (new Date(asUtc).getUTCMonth() !== mo - 1) return null; // 31 Şubat gibi taşmalar
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return null;
  }
  const offsetAt = (utcMs: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
    const shown = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
    return shown - utcMs;
  };
  // Önce ilk tahmin, sonra o anın gerçek ofsetiyle düzeltme (yaz saati geçişleri için iki adım)
  const guess = asUtc - offsetAt(asUtc);
  return new Date(asUtc - offsetAt(guess));
}

/** Zamanlanmış yayın zamanı geldi mi? Tarih eksik/geçersizse `false` (yayınlanmaz, panelde uyarılır). */
export function isScheduleDue(scheduledAt: string | undefined | null, timeZone: string, now: Date = new Date()): boolean {
  if (!scheduledAt) return false;
  const at = zonedLocalToUtc(scheduledAt, timeZone);
  return at !== null && at.getTime() <= now.getTime();
}

export const TRASH_RETENTION_DAYS = 30;

export interface TrashMeta {
  previousStatus: string;
  deletedAt: string;
  deletedBy: string;
}

/** Çöpe atılan içeriğin işaret bilgisi (`schemaAttributes._trash`). */
export function readTrashMeta(attrs: Record<string, unknown> | null | undefined): TrashMeta | null {
  const t = attrs?._trash as Partial<TrashMeta> | undefined;
  if (!t || typeof t.deletedAt !== "string") return null;
  return { previousStatus: typeof t.previousStatus === "string" ? t.previousStatus : "draft", deletedAt: t.deletedAt, deletedBy: typeof t.deletedBy === "string" ? t.deletedBy : "" };
}

export function trashExpired(deletedAt: string, now: Date = new Date(), days = TRASH_RETENTION_DAYS): boolean {
  const at = Date.parse(deletedAt);
  return Number.isFinite(at) && now.getTime() - at >= days * 86_400_000;
}

export function trashDaysLeft(deletedAt: string, now: Date = new Date(), days = TRASH_RETENTION_DAYS): number {
  const at = Date.parse(deletedAt);
  if (!Number.isFinite(at)) return days;
  return Math.max(0, Math.ceil(days - (now.getTime() - at) / 86_400_000));
}

// ---- Yönlendirme kuralları ----

export const REDIRECT_CODES = [301, 302, 307, 308] as const;
export type RedirectCode = (typeof REDIRECT_CODES)[number];

const RESERVED_PREFIXES = ["/admin", "/api", "/_next", "/login", "/media", "/og"];

/** Yol: sorgu/çapa atılır, çift eğik çizgi sadeleşir, sondaki eğik çizgi kalkar (kök hariç), küçük harfe indirilmez. */
export function normalizeRedirectPath(input: string): string {
  const p = input.trim().split(/[?#]/)[0] ?? "";
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  const clean = withSlash.replace(/\/{2,}/g, "/");
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

export type RedirectValidation = { ok: true; from: string; to: string } | { ok: false; error: string };

/** `to` iç yol ya da http(s) adresi olabilir. Rezerve yolları ve kendine yönlendirmeyi reddeder. */
export function validateRedirect(fromRaw: string, toRaw: string): RedirectValidation {
  const from = normalizeRedirectPath(fromRaw);
  if (from.length > 300 || from === "/") return { ok: false, error: "Kaynak yol geçersiz (kök yol yönlendirilemez, en çok 300 karakter)." };
  if (RESERVED_PREFIXES.some((p) => from === p || from.startsWith(`${p}/`))) return { ok: false, error: "Yönetim, API ve sistem yolları yönlendirilemez." };
  if (/[\s<>"'\\]/.test(from)) return { ok: false, error: "Kaynak yol boşluk veya özel karakter içeremez." };
  const toTrim = toRaw.trim();
  if (!toTrim || toTrim.length > 500) return { ok: false, error: "Hedef boş ya da çok uzun." };
  let to: string;
  if (/^https?:\/\//i.test(toTrim)) {
    try {
      const u = new URL(toTrim);
      if (u.username || u.password) return { ok: false, error: "Hedef adres kullanıcı bilgisi içeremez." };
      to = u.toString();
    } catch {
      return { ok: false, error: "Hedef adres geçersiz." };
    }
  } else if (toTrim.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(toTrim)) {
    return { ok: false, error: "Hedef iç yol (/…) ya da http(s) adresi olmalı." };
  } else {
    to = (toTrim.startsWith("/") ? toTrim : `/${toTrim}`).replace(/\/{2,}/g, "/");
  }
  if (!/^https?:\/\//i.test(to) && normalizeRedirectPath(to) === from) return { ok: false, error: "Kaynak ve hedef aynı olamaz." };
  return { ok: true, from, to };
}

/**
 * Yönlendirme zincirini çözer: `path` kuralla eşleşirse hedef, hedef de eşleşirse devam eder (en çok `maxHops`).
 * Döngü veya fazla zincir `loop: true` döner (çağıran yönlendirmeyi uygulamaz).
 */
export function resolveRedirectChain(
  rules: ReadonlyMap<string, { to: string; code: RedirectCode }>,
  path: string,
  maxHops = 5
): { to: string; code: RedirectCode; hops: number } | { loop: true } | null {
  let cur = normalizeRedirectPath(path);
  const seen = new Set<string>([cur]);
  let first: { to: string; code: RedirectCode } | null = null;
  let hops = 0;
  for (;;) {
    const rule = rules.get(cur);
    if (!rule) break;
    first ??= rule;
    hops++;
    if (hops > maxHops) return { loop: true };
    if (/^https?:\/\//i.test(rule.to)) return { to: rule.to, code: first.code, hops };
    cur = normalizeRedirectPath(rule.to);
    if (seen.has(cur)) return { loop: true };
    seen.add(cur);
    first = { to: rule.to, code: first.code };
  }
  return first ? { to: cur === normalizeRedirectPath(first.to) ? first.to : cur, code: first.code, hops } : null;
}
