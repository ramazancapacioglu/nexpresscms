/**
 * Yazar profili (E-E-A-T): ünvan, kısa biyografi, uzmanlık alanları, sameAs bağlantıları ve avatar. Hepsi isteğe bağlıdır.
 * Saf mantık: arayüz girdisi temizlenir (düz metin, https bağlantılar, yerel medya) ve veritabanı biçimine çevrilir.
 */
export interface AuthorProfile {
  jobTitle: string;
  bio: string;
  /** Uzmanlık alanları (Person.knowsAbout) */
  expertise: string[];
  /** Başka yerlerdeki profiller (LinkedIn, X, GitHub…) — Person.sameAs */
  sameAs: string[];
  /** Yerel medya (`/media/med_…`) ya da https adresi */
  avatarUrl: string;
}

export const AUTHOR_LIMITS = { jobTitle: 80, bio: 600, expertiseItems: 10, expertiseItem: 60, sameAsItems: 8, url: 300 } as const;

const plain = (value: unknown, max: number): string =>
  (typeof value === "string" ? value : "").replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

const httpsUrl = (value: unknown): string => {
  const raw = (typeof value === "string" ? value : "").trim();
  if (!raw || raw.length > AUTHOR_LIMITS.url) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
};

const avatar = (value: unknown): string => {
  const raw = (typeof value === "string" ? value : "").trim();
  if (/^\/media\/med_[A-Za-z0-9_-]+(?:\/[0-9]+\.[a-z0-9]+)?(?:\?[A-Za-z0-9=&_.-]*)?$/.test(raw)) return raw;
  return httpsUrl(raw);
};

/** Serbest girdiyi güvenli profile çevirir; boş/geçersiz alanlar boş kalır. */
export function sanitizeAuthorProfile(input: { jobTitle?: unknown; bio?: unknown; expertise?: unknown; sameAs?: unknown; avatarUrl?: unknown }): AuthorProfile {
  const list = (value: unknown): string[] => (Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : []);
  const expertise = [...new Set(list(input.expertise).map((item) => plain(item, AUTHOR_LIMITS.expertiseItem)).filter(Boolean))].slice(0, AUTHOR_LIMITS.expertiseItems);
  const sameAs = [...new Set(list(input.sameAs).map(httpsUrl).filter(Boolean))].slice(0, AUTHOR_LIMITS.sameAsItems);
  return {
    jobTitle: plain(input.jobTitle, AUTHOR_LIMITS.jobTitle),
    bio: plain(input.bio, AUTHOR_LIMITS.bio),
    expertise,
    sameAs,
    avatarUrl: avatar(input.avatarUrl),
  };
}

/** Veritabanı satırı (metin sütunları) → profil. Bozuk JSON güvenle boş döner. */
export function authorProfileFromRow(row: { jobTitle?: string | null; bio?: string | null; expertise?: string | null; sameAs?: string | null; avatarUrl?: string | null }): AuthorProfile {
  let sameAs: unknown = [];
  try {
    sameAs = row.sameAs ? JSON.parse(row.sameAs) : [];
  } catch {
    sameAs = [];
  }
  return sanitizeAuthorProfile({ jobTitle: row.jobTitle, bio: row.bio, expertise: row.expertise, sameAs, avatarUrl: row.avatarUrl });
}

/** Profil → veritabanı sütunları (boş alan `null`). */
export function authorProfileToRow(profile: AuthorProfile): { jobTitle: string | null; bio: string | null; expertise: string | null; sameAs: string | null; avatarUrl: string | null } {
  return {
    jobTitle: profile.jobTitle || null,
    bio: profile.bio || null,
    expertise: profile.expertise.length ? profile.expertise.join(", ") : null,
    sameAs: profile.sameAs.length ? JSON.stringify(profile.sameAs) : null,
    avatarUrl: profile.avatarUrl || null,
  };
}

export const hasAuthorProfile = (profile: AuthorProfile | null | undefined): boolean =>
  Boolean(profile && (profile.jobTitle || profile.bio || profile.expertise.length || profile.sameAs.length || profile.avatarUrl));
