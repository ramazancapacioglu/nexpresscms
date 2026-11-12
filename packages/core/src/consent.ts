/**
 * Çerez onayı (KVKK/GDPR) saf mantığı. Ziyaretçi JS'i yoktur: banner düz bir form olarak `POST /api/consent` gönderir,
 * sunucu `nx_consent` çerezini yazıp geri yönlendirir. Zorunlu çerezler (oturum, faydalı oyu, sepet) onaysız çalışır;
 * isteğe bağlı betikler (GA4 ve özel baş/son betikler) yalnızca "tümünü kabul" ile yüklenir.
 */
export const CONSENT_COOKIE = "nx_consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ConsentChoice = "all" | "necessary";

export interface CookieConsentSettings {
  enabled: boolean;
  /** Banner metni; boşsa dil kataloğundaki varsayılan kullanılır. */
  message: string;
  /** Çerez/gizlilik politikası sayfası (`/` ile başlayan yol ya da https adresi). */
  policyHref: string;
}

export const DEFAULT_COOKIE_CONSENT: CookieConsentSettings = { enabled: false, message: "", policyHref: "" };

/** Politika bağlantısı: yalnızca site içi yol ya da https; aksi halde boş. */
export function safePolicyHref(value: unknown): string {
  const v = typeof value === "string" ? value.trim().slice(0, 300) : "";
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    return new URL(v).protocol === "https:" ? v : "";
  } catch {
    return "";
  }
}

export function sanitizeCookieConsent(value: unknown): CookieConsentSettings {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    enabled: raw.enabled === true,
    message: typeof raw.message === "string" ? raw.message.replace(/\s+/g, " ").trim().slice(0, 400) : "",
    policyHref: safePolicyHref(raw.policyHref),
  };
}

export function readConsent(cookieValue: string | null | undefined): ConsentChoice | null {
  return cookieValue === "all" || cookieValue === "necessary" ? cookieValue : null;
}

/** İsteğe bağlı betiklere (analitik, özel kod) izin var mı: onay kapalıysa evet, açıksa yalnızca "tümü". */
export function optionalScriptsAllowed(settings: CookieConsentSettings, cookieValue: string | null | undefined): boolean {
  return !settings.enabled || readConsent(cookieValue) === "all";
}

/** Banner görünür mü: özellik açık ve ziyaretçi henüz seçim yapmadı. */
export function consentBannerVisible(settings: CookieConsentSettings, cookieValue: string | null | undefined): boolean {
  return settings.enabled && readConsent(cookieValue) === null;
}

/** Seçimden sonra dönülecek adres: yalnızca aynı sitenin yolu (açık yönlendirme yok). */
export function safeBackPath(referer: string | null | undefined, host: string | null | undefined): string {
  if (!referer || !host) return "/";
  try {
    const url = new URL(referer);
    return url.host === host ? `${url.pathname}${url.search}` || "/" : "/";
  } catch {
    return "/";
  }
}
