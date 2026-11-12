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

export interface MembershipTier {
  /** `a-z`, rakam, `_`/`-`; harfle başlar. Üye ve içerikte bu kimlik saklanır. */
  id: string;
  label: string;
}

export const MAX_MEMBER_TIERS = 5;
const TIER_ID_RE = /^[a-z][a-z0-9_-]{1,19}$/;

export interface MembershipSettings {
  mode: MembershipMode;
  /** Kademeler, **düşükten yükseğe** sıralı (sıra = rütbe). Kademesiz üyenin rütbesi 0'dır. Boşsa tek düzey üyelik. */
  tiers: MembershipTier[];
  /** Kayıt formunda aydınlatma metni bağlantısı (KVKK). `https://…` ya da `/yol`. */
  privacyUrl: string;
}

export const DEFAULT_MEMBERSHIP: MembershipSettings = { mode: "closed", tiers: [], privacyUrl: "" };

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
  const tiers: MembershipTier[] = [];
  for (const raw of (Array.isArray(r.tiers) ? r.tiers : []).slice(0, 50)) {
    if (tiers.length >= MAX_MEMBER_TIERS) break;
    const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const id = typeof t.id === "string" ? t.id.trim() : "";
    const label = typeof t.label === "string" ? t.label.replace(/\s+/g, " ").trim().slice(0, 30) : "";
    if (TIER_ID_RE.test(id) && label && !tiers.some((x) => x.id === id)) tiers.push({ id, label });
  }
  return {
    mode: MEMBERSHIP_MODES.find((m) => m === r.mode) ?? "closed",
    tiers,
    privacyUrl: safeLinkUrl(r.privacyUrl),
  };
}

export const isValidTierId = (id: string): boolean => TIER_ID_RE.test(id);

/** Kademenin rütbesi (1…n); kademesiz ya da bilinmeyen = 0. */
export const tierRank = (tiers: readonly MembershipTier[], id: string | null | undefined): number => (id ? tiers.findIndex((t) => t.id === id) + 1 : 0);

/**
 * Üyenin kademesi içeriğin gerektirdiği kademeyi karşılar mı. Gereksinim boşsa ya da (silinmiş) bilinmeyen bir kademeyse
 * her üye geçer; aksi halde üyenin rütbesi gereken rütbeden küçük olmamalıdır (kademesiz üye = 0).
 */
export function memberMeetsTier(tiers: readonly MembershipTier[], memberTier: string | null | undefined, requiredTier: string | null | undefined): boolean {
  const need = tierRank(tiers, requiredTier);
  return need === 0 || tierRank(tiers, memberTier) >= need;
}

/** Etiketten kademe kimliği önerir (`Altın Üye` → `altin-uye`). */
export function suggestTierId(label: string): string {
  const id = label.toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 19);
  return TIER_ID_RE.test(id) ? id : `kademe-${Math.random().toString(36).slice(2, 6)}`;
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
