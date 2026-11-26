/**
 * Yazar profili (E-E-A-T): tür (Person/Organization), ünvan, biyografi, uzmanlık alanları, belgeler/sertifikalar, sameAs bağlantıları ve avatar.
 * Saf mantık: arayüz girdisi temizlenir (düz metin, https bağlantılar, yerel medya) ve veritabanı biçimine çevrilir.
 */
export type AuthorSchemaType = "Person" | "Organization";

export interface AuthorProfile {
  /** Yazar şema türü: gerçek kişi (`Person`) veya kurumsal yayın ekibi (`Organization`) */
  authorType: AuthorSchemaType;
  jobTitle: string;
  bio: string;
  /** Uzmanlık alanları (Person.knowsAbout / Organization.knowsAbout) */
  expertise: string[];
  /** Mesleki belgeler / sertifikalar (Person.hasCredential) */
  credentials: string[];
  /** Başka yerlerdeki profiller (LinkedIn, X, GitHub…) — sameAs */
  sameAs: string[];
  /** Yerel medya (`/media/med_…`) ya da https adresi */
  avatarUrl: string;
}

export const AUTHOR_LIMITS = {
  jobTitle: 100,
  bio: 1200,
  expertiseItems: 12,
  expertiseItem: 60,
  credentialItems: 8,
  credentialItem: 120,
  sameAsItems: 8,
  url: 300,
} as const;

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
export function sanitizeAuthorProfile(input: {
  authorType?: unknown;
  jobTitle?: unknown;
  bio?: unknown;
  expertise?: unknown;
  credentials?: unknown;
  sameAs?: unknown;
  avatarUrl?: unknown;
}): AuthorProfile {
  const list = (value: unknown): string[] => (Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : []);
  const lineList = (value: unknown): string[] => (Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n/) : []);
  const authorType: AuthorSchemaType = input.authorType === "Organization" ? "Organization" : "Person";
  const expertise = [...new Set(list(input.expertise).map((item) => plain(item, AUTHOR_LIMITS.expertiseItem)).filter(Boolean))].slice(0, AUTHOR_LIMITS.expertiseItems);
  const credentials = [...new Set(lineList(input.credentials).map((item) => plain(item, AUTHOR_LIMITS.credentialItem)).filter(Boolean))].slice(0, AUTHOR_LIMITS.credentialItems);
  const sameAs = [...new Set(list(input.sameAs).map(httpsUrl).filter(Boolean))].slice(0, AUTHOR_LIMITS.sameAsItems);
  return {
    authorType,
    jobTitle: plain(input.jobTitle, AUTHOR_LIMITS.jobTitle),
    bio: plain(input.bio, AUTHOR_LIMITS.bio),
    expertise,
    credentials,
    sameAs,
    avatarUrl: avatar(input.avatarUrl),
  };
}

/** Veritabanı satırı (metin sütunları) → profil. Bozuk JSON güvenle boş döner. */
export function authorProfileFromRow(row: {
  authorType?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  expertise?: string | null;
  credentials?: string | null;
  sameAs?: string | null;
  avatarUrl?: string | null;
}): AuthorProfile {
  let sameAs: unknown = [];
  let credentials: unknown = [];
  try {
    sameAs = row.sameAs ? JSON.parse(row.sameAs) : [];
  } catch {
    sameAs = [];
  }
  try {
    credentials = row.credentials ? JSON.parse(row.credentials) : [];
  } catch {
    credentials = typeof row.credentials === "string" ? row.credentials.split(/\r?\n/) : [];
  }
  return sanitizeAuthorProfile({
    authorType: row.authorType,
    jobTitle: row.jobTitle,
    bio: row.bio,
    expertise: row.expertise,
    credentials,
    sameAs,
    avatarUrl: row.avatarUrl,
  });
}

/** Profil → veritabanı sütunları (boş alan `null`). */
export function authorProfileToRow(profile: AuthorProfile): {
  authorType: string | null;
  jobTitle: string | null;
  bio: string | null;
  expertise: string | null;
  credentials: string | null;
  sameAs: string | null;
  avatarUrl: string | null;
} {
  return {
    authorType: profile.authorType === "Organization" ? "Organization" : null,
    jobTitle: profile.jobTitle || null,
    bio: profile.bio || null,
    expertise: profile.expertise.length ? profile.expertise.join(", ") : null,
    credentials: profile.credentials.length ? JSON.stringify(profile.credentials) : null,
    sameAs: profile.sameAs.length ? JSON.stringify(profile.sameAs) : null,
    avatarUrl: profile.avatarUrl || null,
  };
}

export const hasAuthorProfile = (profile: AuthorProfile | null | undefined): boolean =>
  Boolean(
    profile &&
      (profile.authorType === "Organization" ||
        profile.jobTitle ||
        profile.bio ||
        profile.expertise.length ||
        profile.credentials.length ||
        profile.sameAs.length ||
        profile.avatarUrl)
  );

/**
 * Görünür yazarı ve yazar sayfasına bağlı şema yazarını (E-E-A-T) taşıyan içerik türleri.
 * Makale, soru-cevap ve teknik bilgi bankası sayfaları yazar satırı, yazar kutusu ve `/yazar/...` bağlantısı alır;
 * sayfa, ürün, kampanya gibi türlerde yazar yoktur.
 */
export const AUTHORED_CONTENT_TYPES: readonly string[] = ["post", "ai_prompt", "kb_tech"];

export function isAuthoredType(type: string | null | undefined): boolean {
  return Boolean(type) && AUTHORED_CONTENT_TYPES.includes(type as string);
}
