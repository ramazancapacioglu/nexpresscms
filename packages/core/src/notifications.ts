import type { HealthCheck } from "./system-health";

/** Bildirim merkezi (saf mantık): türetilmiş sistem uyarıları ve görünürlük kuralları. */
export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationAudience = "admin" | "all";

export interface NotificationInput {
  kind: string;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  href?: string;
  /** Aynı olayı tek satırda toplar */
  dedupeKey?: string;
  audience?: NotificationAudience;
  /** "open": çözülene kadar tek satır (sistem uyarıları); sayı: bu süre (ms) içindeki tekrarlar sayılır. Varsayılan 24 saat. */
  window?: "open" | number;
}

export const SEVERITY_RANK: Record<NotificationSeverity, number> = { critical: 3, warning: 2, info: 1 };
export const SYSTEM_KEY_PREFIX = "sys:";
export const NOTIFICATION_DEFAULT_WINDOW_MS = 24 * 3_600_000;

export const canSeeNotification = (audience: string, role: "admin" | "editor" | string): boolean => audience === "all" || role === "admin";

const HEALTH_HREF = "/admin/system";
const HEALTH_LINKS: Record<string, string> = { "search-index": "/admin/system", "404": "/admin/redirects", scheduled: "/admin/schedule", forms: "/admin/forms/inbox" };

/** Sistem sağlığı denetimlerinden bildirim üretir: yalnızca `fail` (kritik) ve `warn` (uyarı); `ok`/`info` bildirim değildir. */
export function healthNotifications(checks: HealthCheck[]): Array<NotificationInput & { dedupeKey: string }> {
  return checks
    .filter((c) => c.level === "fail" || c.level === "warn")
    .map((c) => ({
      kind: "system.health",
      severity: c.level === "fail" ? ("critical" as const) : ("warning" as const),
      title: `${c.group}: ${c.label}`,
      body: c.detail,
      href: HEALTH_LINKS[c.id] ?? HEALTH_HREF,
      dedupeKey: `${SYSTEM_KEY_PREFIX}health:${c.id}`,
      audience: "admin" as const,
      window: "open" as const,
    }));
}

/** Son yedek `days` günden eskiyse (veya hiç yoksa) hatırlatma. Site boşsa (içerik yok) hatırlatılmaz. */
export function backupReminder(lastBackup: Date | null, hasContent: boolean, now: Date = new Date(), days = 30): (NotificationInput & { dedupeKey: string }) | null {
  if (!hasContent) return null;
  const age = lastBackup ? (now.getTime() - lastBackup.getTime()) / 86_400_000 : Infinity;
  if (age <= days) return null;
  return {
    kind: "system.backup",
    severity: "info",
    title: "Yedek alınmadı",
    body: lastBackup ? `Son yedek ${Math.floor(age)} gün önce alındı.` : "Bu panelden hiç yedek alınmamış.",
    href: "/admin/backup",
    dedupeKey: `${SYSTEM_KEY_PREFIX}backup`,
    audience: "admin",
    window: "open",
  };
}

/** Son saatte `threshold` ve üzeri başarısız/engellenen giriş denemesi → güvenlik uyarısı. */
export function loginFailureAlert(failures: number, hours = 1, threshold = 5): (NotificationInput & { dedupeKey: string }) | null {
  if (failures < threshold) return null;
  return {
    kind: "security.login_failures",
    severity: failures >= threshold * 4 ? "critical" : "warning",
    title: "Çok sayıda başarısız giriş denemesi",
    body: `Son ${hours} saatte ${failures} başarısız veya engellenen giriş denemesi var. Denetim günlüğünü inceleyin.`,
    href: "/admin/audit",
    dedupeKey: `${SYSTEM_KEY_PREFIX}login-failures`,
    audience: "admin",
    window: "open",
  };
}
