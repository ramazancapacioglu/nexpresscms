/**
 * Ziyaretçi üyeliği (saf mantık). Üyeler panel kullanıcılarından ayrı bir kümedir: yalnızca `members_only` içeriği
 * açar, panele giremez. Giriş **parolasızdır**: e-postaya tek kullanımlık, kısa ömürlü bağlantı gider. Kayıt politikasını
 * yönetici seçer; varsayılan `closed` olduğu için mevcut siteler davranış değiştirmez.
 */

export const MEMBERSHIP_MODES = ["closed", "open", "invite"] as const;
export type MembershipMode = (typeof MEMBERSHIP_MODES)[number];

export const MEMBERSHIP_MODE_LABEL: Record<MembershipMode, string> = {
  closed: "Kapalı (üyelik yok)",
  open: "Herkese açık kayıt (e-posta doğrulamalı)",
  invite: "Yalnızca davetle",
};

export interface MembershipSettings {
  mode: MembershipMode;
  /** Kayıt formunda aydınlatma metni bağlantısı (KVKK). `https://…` ya da `/yol`. */
  privacyUrl: string;
}

export const DEFAULT_MEMBERSHIP: MembershipSettings = { mode: "closed", privacyUrl: "" };

/** Yalnızca site içi yol ya da https adresi (javascript: vb. yok). */
export function safeLinkUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim().slice(0, 300);
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

export function sanitizeMembership(value: unknown): MembershipSettings {
  const r = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    mode: MEMBERSHIP_MODES.find((m) => m === r.mode) ?? "closed",
    privacyUrl: safeLinkUrl(r.privacyUrl),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** E-posta: kırpılır, küçük harfe iner, biçim denetlenir (en çok 254 karakter). Geçersizse `null`. */
export function normalizeMemberEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toLowerCase();
  return v.length <= 254 && EMAIL_RE.test(v) ? v : null;
}

/**
 * Girişten sonra dönülecek adres: yalnızca site içi yol (açık yönlendirme yok). `//x`, `/\x`, `javascript:` ve
 * panel/API yolları reddedilir; geçersizse `fallback`.
 */
export function safeMemberNext(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\u0000-\u001f]/.test(v) || v.length > 300) return fallback;
  if (/^\/(admin|api|login|_next)(\/|$|\?)/i.test(v)) return fallback;
  return v;
}

/** Üyenin her çevrimdışı kopyasında yer alan alanlar (dışa aktarma). */
export const MEMBER_EXPORT_FIELDS = ["email", "name", "status", "createdAt", "emailVerifiedAt", "consentAt", "lastLoginAt"] as const;
